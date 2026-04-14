from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from .db import get_conn
from .models import AnalyzeResponse, ListingData

YORGUNLUK_KELIMELERI = ["acil", "nakit", "hemen", "pazarlik", "fiyat dustu", "son fiyat"]
POZITIF_LOKASYONLAR = {"kadikoy": 18, "besiktas": 16, "cankaya": 12, "konyaalti": 14, "nilufer": 11}


def _clamp(value: int, min_v: int = 0, max_v: int = 100) -> int:
    return max(min_v, min(max_v, value))


def ilan_hafiza_sinyali(ilan: ListingData) -> bool:
    aciklama_hash = hashlib.sha256(ilan.aciklama.encode("utf-8")).hexdigest()
    now = datetime.now(tz=timezone.utc).isoformat()

    with get_conn() as conn:
        existing = conn.execute(
            "SELECT id, seen_count FROM listings WHERE url = ? OR (ilan_no IS NOT NULL AND ilan_no = ?)",
            (ilan.url, ilan.ilan_no),
        ).fetchone()

        if existing:
            conn.execute(
                "UPDATE listings SET last_seen_at = ?, seen_count = seen_count + 1 WHERE id = ?",
                (now, existing["id"]),
            )
            return True

        conn.execute(
            """
            INSERT INTO listings (url, ilan_no, fiyat, il, ilce, aciklama_hash, first_seen_at, last_seen_at, seen_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (ilan.url, ilan.ilan_no, ilan.fiyat, ilan.il, ilan.ilce, aciklama_hash, now, now),
        )
    return False


def yorgunluk_skoru(ilan: ListingData) -> int:
    skor = 20
    skor += min(35, ilan.yayin_suresi_gun // 2)

    text = ilan.aciklama.lower()
    skor += sum(8 for kelime in YORGUNLUK_KELIMELERI if kelime in text)

    if ilan.fotograf_sayisi <= 5:
        skor += 12
    if len(ilan.aciklama.strip()) < 120:
        skor += 10
    if ilan.tekrar_yayin:
        skor += 20

    return _clamp(skor)


def firsat_skoru(ilan: ListingData) -> int:
    skor = 35

    lokasyon_key = ilan.ilce.lower().replace(" ", "")
    skor += POZITIF_LOKASYONLAR.get(lokasyon_key, 4)

    if ilan.fiyat_gecmisi_dusus > 0:
        skor += min(20, ilan.fiyat_gecmisi_dusus // 2)

    if ilan.yayin_suresi_gun >= 45:
        skor += 12

    if ilan.fiyat and ilan.fiyat < 4_000_000:
        skor += 10

    return _clamp(skor)


def risk_skoru(ilan: ListingData) -> int:
    skor = 15

    text = ilan.aciklama.lower()
    if ilan.fiyat >= 12_000_000:
        skor += 35
    if all(k not in text for k in ["acil", "pazarlik", "hemen"]):
        skor += 14
    if ilan.fotograf_sayisi >= 20 and ilan.yayin_suresi_gun >= 60:
        skor += 18

    return _clamp(skor)


def karar_metni(yorgunluk: int, firsat: int, risk: int) -> tuple[str, str]:
    if yorgunluk > 80 and firsat > 70 and risk < 40:
        return "ARA", "ARA — satıcı sabrını kaybediyor."
    if yorgunluk > 60:
        return "İZLE", "İZLE — potansiyel oluşuyor."
    return "ELE", "ELE — zaman kaybı riski yüksek."


def analyze(ilan: ListingData) -> AnalyzeResponse:
    tekrar = ilan_hafiza_sinyali(ilan)
    ilan.tekrar_yayin = tekrar

    y = yorgunluk_skoru(ilan)
    f = firsat_skoru(ilan)
    r = risk_skoru(ilan)

    karar, ozet = karar_metni(y, f, r)
    if tekrar:
        ozet += " Bu ilan tekrar yayına girmiş."

    response = AnalyzeResponse(
        karar=karar,
        yorgunluk_skoru=y,
        firsat_skoru=f,
        risk_skoru=r,
        ozet=ozet,
    )

    with get_conn() as conn:
        conn.execute(
            "INSERT INTO analyses (url, karar, yorgunluk_skoru, firsat_skoru, risk_skoru, ozet, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (ilan.url, karar, y, f, r, ozet, datetime.now(tz=timezone.utc).isoformat()),
        )

    return response
