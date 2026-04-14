from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl


class AnalyzeRequest(BaseModel):
    url: HttpUrl


class ListingData(BaseModel):
    url: str
    ilan_no: str | None = None
    fiyat: int = 0
    ilan_tarihi: datetime | None = None
    aciklama: str = ""
    fotograf_sayisi: int = 0
    il: str = ""
    ilce: str = ""
    fiyat_gecmisi_dusus: int = 0
    yayin_suresi_gun: int = 0
    tekrar_yayin: bool = False


class AnalyzeResponse(BaseModel):
    karar: str = Field(description="ARA, İZLE, ELE")
    yorgunluk_skoru: int
    firsat_skoru: int
    risk_skoru: int
    ozet: str
