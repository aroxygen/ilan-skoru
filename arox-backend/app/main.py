from __future__ import annotations

from fastapi import FastAPI, HTTPException

from .analyzer import analyze
from .db import init_db
from .models import AnalyzeRequest, AnalyzeResponse
from .scraper import scrape_listing

app = FastAPI(title="Arox Emlak Operatörü", version="1.0.0")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.post("/analiz", response_model=AnalyzeResponse)
async def analiz(payload: AnalyzeRequest) -> AnalyzeResponse:
    try:
        listing = await scrape_listing(str(payload.url))
        return analyze(listing)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=422, detail=f"İlan çözümlenemedi: {exc}") from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
