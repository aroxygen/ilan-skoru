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
