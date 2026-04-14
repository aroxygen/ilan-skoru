from __future__ import annotations

import re
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

from .models import ListingData

PRICE_RE = re.compile(r"([\d\.]+)\s*TL", re.IGNORECASE)
ILAN_NO_RE = re.compile(r"ilan\s*no\s*[:#]?\s*(\d+)", re.IGNORECASE)


async def fetch_html(url: str) -> str:
    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()
        return response.text


def _extract_price(text: str) -> int:
    match = PRICE_RE.search(text)
    if not match:
        return 0
    return int(match.group(1).replace(".", ""))


def _extract_listing_no(text: str) -> str | None:
    match = ILAN_NO_RE.search(text)
    return match.group(1) if match else None


def parse_listing(url: str, html: str) -> ListingData:
    soup = BeautifulSoup(html, "lxml")
    full_text = soup.get_text(" ", strip=True)

    desc_node = soup.find("meta", attrs={"name": "description"})
    aciklama = desc_node.get("content", "") if desc_node else ""

    gallery_candidates = soup.select("img")
    fotograf_sayisi = len([img for img in gallery_candidates if img.get("src")])

    breadcrumbs = [x.get_text(" ", strip=True) for x in soup.select(".breadcrumb li, nav li")]
    il = breadcrumbs[-2] if len(breadcrumbs) >= 2 else ""
    ilce = breadcrumbs[-1] if len(breadcrumbs) >= 1 else ""

    ilan = ListingData(
        url=url,
        ilan_no=_extract_listing_no(full_text),
        fiyat=_extract_price(full_text),
        ilan_tarihi=datetime.now(tz=timezone.utc),
        aciklama=aciklama,
        fotograf_sayisi=fotograf_sayisi,
        il=il,
        ilce=ilce,
        fiyat_gecmisi_dusus=0,
        yayin_suresi_gun=0,
    )

    tarih_text = full_text.lower()
    if "güncellendi" in tarih_text or "yayında" in tarih_text:
        ilan.yayin_suresi_gun = 30

    return ilan


async def scrape_listing(url: str) -> ListingData:
    html = await fetch_html(url)
    return parse_listing(url, html)
