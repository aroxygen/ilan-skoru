# İlan Skoru

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

Implement real channel connectors (SMTP/API bot/webpush) behind the same adapter contracts with retry policy, rate limits, and user authentication.
