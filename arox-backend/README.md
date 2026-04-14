# Arox Emlak Operatörü (FastAPI)

## Çalıştırma

```bash
cd arox-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## API

- `POST /analiz`

```json
{
  "url": "https://www.sahibinden.com/..."
}
```

Yanıt:

```json
{
  "karar": "ARA",
  "yorgunluk_skoru": 82,
  "firsat_skoru": 74,
  "risk_skoru": 25,
  "ozet": "ARA — satıcı sabrını kaybediyor."
}
```
