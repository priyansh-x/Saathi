# Architecture

Product specs in [saathi/](./saathi/) win when they disagree with this file.

## Surfaces

```
Parent   -- PSTN -->  Bolna agent
Child    -- WhatsApp briefing + /d/[token] family desk (PWA)
Neighbour -- alert only, if they opted in
```

The parent never opens this website.

## Apps

| App | Directory | Dev |
| --- | --- | --- |
| Family desk | repo root | `npm run dev` → :43147 |
| Marketing | `landing/` | `cd landing && npm run dev` → :43211 |
| Android shell | `android/` | `npm run android:apk` |

## Routes

| Route | Job |
| --- | --- |
| `/` | Sign in / start |
| `/onboard` | Household form + consent |
| `/d/[token]` | Today |
| `/d/[token]/history` | 7 / 30 calendar; every same-day ring is its own row |
| `/d/[token]/alerts` | Alert list |
| `/d/[token]/alerts/[id]` | Alert detail |
| `/d/[token]/calls/[id]` | Call detail (transcript, meds) |
| `/d/[token]/settings` | Pause, test call, consents, install |
| `/ops` | Kill switch, Bolna / WhatsApp readiness (`OPS_EMAILS`) |
| `/admin` | Full household dump + actions (`ADMIN_PASSWORD` cookie, or signed-in `OPS_EMAILS`) |
| `/demo` | EXAMPLE walkthrough |
| `/privacy` | Retention and 112 |

## Data

Postgres-shaped schema. Local: PGlite at `.data/saathi`. Production: `DATABASE_URL` via `pg`.

`npm run db:migrate` applies `src/lib/db/migrations/` in order. Source of truth is the database — not `localStorage` (except the offline `/demo/call` fallback).

Core tables: `parents`, `contacts`, `medicines`, `schedules`, `calls`, `call_attempts`, `dose_logs`, `alerts`, `alert_events`, `memory_notes`, `consents`, `outbound_messages`, `webhook_events`, `magic_links`.

Seed rows set `is_example`. The UI shows **EXAMPLE**.

## Outbound

One gateway: `src/lib/outbound.ts`. Never dial or send outside `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS`.

| Route | Job |
| --- | --- |
| `POST /api/tools/*` | Mid-call tools, Bearer `BOLNA_TOOL_TOKEN` |
| `POST /api/webhooks/bolna` | Store every delivery; hydrate completed calls |
| `GET/POST /api/cron/tick` | Morning calls (`CRON_SECRET`) |
| `GET /api/d/[token]/live` | Desk poll stamp (transcript, meds, alerts) |
| `POST /api/demo/bolna` | Mock scenarios when `MOCK_BOLNA=1` |

Agent JSON: `scripts/bolna/agent.json`, built from `docs/saathi/voice/`. `npm run bolna:sync` prints a diff. `--apply` is owner-only.

## Desk refresh

After a Settings test call or a morning ring, `LiveRefresh` polls `/api/d/[token]/live`. The stamp covers call id, status, transcript presence, open alert, and medicine status so Today and History update as soon as Bolna has words.
