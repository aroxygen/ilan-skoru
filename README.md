# İlan Skoru

İlan Skoru is a repeat-use listing decision engine with parsing, scoring, watchlist tracking, and notification delivery architecture.

## New upgrade: semi-automatic Sahibinden extraction

Sahibinden parser moved from stub to semi-auto extractor with conservative field handling.

### Auto-extracted fields (when reliably found)
- title
- price
- location
- gross square meters
- room count
- building age (if present)
- description text (if present)

### Strict missing-data behavior
- no hallucinated values
- unresolved fields remain empty
- unresolved fields are added to `missingFields`
- parser warnings explain what was missing/uncertain

### Safe parsing flow
- provider parser accepts raw HTML input (optional)
- otherwise loads fixture HTML snapshots for development
- extraction uses robust selector-like regex patterns + fallback regex
- extracted values are normalized before scoring
- network fetching is intentionally separate/not required for MVP

## Parser architecture

- `detectProvider(url)`
- `parseListing(url, { rawHtml? })`
- `normalizeParsedListing(rawParsedData)`

Provider modules:
- `sahibinden` (semi-auto extraction)
- `hepsiemlak` (stub)
- `emlakjet` (stub)

Fixture snapshots:
- `lib/parsers/fixtures/sahibinden/listing-1.html`
- `lib/parsers/fixtures/sahibinden/listing-2.html`

## Analysis form flow

- User can paste URL and click **Prefill from URL**.
- Parsed values prefill form fields.
- User edits/overrides any field before analysis.
- Manual values always override parsed values in ingestion merge.

## Notification & watchlist layer (active)

- Watchlist state + snapshot history
- Alert event flags
- Notification preferences/subscriptions
- Dedupe + quiet-hours controls
- Mock-safe delivery adapters (email/telegram/push)
İlan Skoru is a repeat-use listing decision engine with watchlist tracking and outbound alert delivery architecture.

## New layer: outbound notification delivery

### Notification architecture overview

Notification domain models:
- `NotificationPreference` (global defaults)
- `AlertSubscription` (per-watchlist overrides)
- `Notification` (alert record)
- `NotificationDelivery` (channel delivery logs + status)

Pipeline modules:
- `lib/alerts.ts` → computes event flags from snapshot changes
- `lib/watchlist.ts` → appends snapshots and triggers pipeline
- `lib/notifications/pipeline.ts` → applies preferences, dedupe, quiet hours, and adapter dispatch
- `lib/notifications/adapters/*` → channel adapters

### Supported channels and adapter flow

Adapters currently implemented:
- email (mock mode)
- Telegram (mock mode)
- push (mock mode / future)

Flow:
1. watchlist snapshot produced
2. event flags computed
3. preferences/subscription rules evaluated
4. dedupe + quiet-hour checks applied
5. notification records created
6. delivery attempts logged per selected channel

### Preferences supported

Global + per-watchlist configuration:
- enabled events:
  - `price_dropped`
  - `score_improved`
  - `fatigue_increased`
  - `action_upgraded`
  - `parser_failed`
  - `confidence_dropped`
- channel selection
- minimum severity threshold
- quiet hours
- dedupe window

### Dedupe and quiet hours behavior

- Dedupe key: `watchlistItemId:eventType`
- If the same event is seen within configured dedupe window, no new notification is created.
- If current UTC hour is inside quiet hours, deliveries are logged as `skipped_quiet_hours`.

### Notification center UI

- `/notifications` page includes:
  - notification settings form
  - event/channel controls
  - severity, quiet hours, dedupe config
  - notification history with delivery statuses

## Existing product layers (active)

- URL provider parsers + extraction metadata
- weighted comparable calibration
- watchlist state + history snapshots

## Routes

Pages:
- `/`
- `/dashboard`
- `/watchlist`
- `/notifications`
- `/listings/[id]`

API:
- `POST /api/analyze`
- `POST /api/parse-url`
- `GET /api/listings`
- `GET /api/listings/[id]`
- `POST /api/watchlist`
- `GET /api/watchlist`
- `GET/POST /api/watchlist/[id]/subscription`
- `GET/POST /api/notifications/settings`
- `GET /api/notifications/history`

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Project structure

```text
app/
  api/
    analyze/route.ts
    parse-url/route.ts
    listings/route.ts
    listings/[id]/route.ts
    watchlist/route.ts
    watchlist/[id]/subscription/route.ts
    notifications/settings/route.ts
    notifications/history/route.ts
  dashboard/page.tsx
  listings/[id]/page.tsx
  watchlist/page.tsx
  notifications/page.tsx
  layout.tsx
  page.tsx
components/
  analysis-result-card.tsx
  analyze-form.tsx
  header.tsx
  notification-settings-form.tsx
  watchlist-button.tsx
lib/
  alerts.ts
  watchlist.ts
  notifications/
    pipeline.ts
    types.ts
    adapters/
      index.ts
      email.ts
      telegram.ts
      push.ts
  comparable-weighting.ts
  parsers/
    index.ts
    types.ts
    fixtures/sahibinden/
      listing-1.html
      listing-2.html
    providers/
      sahibinden.ts
      hepsiemlak.ts
      emlakjet.ts
  prisma.ts
  scoring.ts
  types.ts
  url-parser.ts
prisma/
  schema.prisma
  seed.ts
```

## Recommended next step

Add a fetcher abstraction that retrieves cached HTML snapshots from a worker queue and feeds parser modules, then add parser regression tests per provider template.
Implement real channel connectors (SMTP/API bot/webpush) behind the same adapter contracts with retry policy, rate limits, and user authentication.

---

## Arox Emlak Operatörü (Yeni modül)

Bu repoya FastAPI tabanlı karar motoru, Next.js koyu tema ekranı ve Chrome extension eklendi.

### Bileşenler

- `arox-backend/`: FastAPI + SQLite + scraper + psikolojik skor motoru
- `app/arox/page.tsx`: React + Tailwind minimal ekran
- `app/api/arox/analiz/route.ts`: Next.js proxy endpoint
- `arox-extension/`: Manifest v3 extension (content script + popup)

### Hızlı akış

1. `uvicorn app.main:app --reload --port 8000`
2. `npm run dev`
3. `/arox` ekranına link gir ve sonucu al.
