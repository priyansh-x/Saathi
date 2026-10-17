# Architecture

Product specs in [docs/saathi/](./saathi/) win over this file when they disagree. Working name: **Saathi**.

## Surfaces

```
Parent  -- PSTN -->  Bolna agent (Phase 2)
Child   -- WhatsApp briefing (Phase 3) + /d/[token] magic-link web view
Neighbour -- alert only (Phase 3–4)
```

The parent never opens this website.

## Routes (Phase 1)

| Route | Job |
| --- | --- |
| `/` | One screen, one CTA |
| `/onboard` | Household form + consent |
| `/d/[token]` | Today (family web view) |
| `/d/[token]/history` | 7 / 30 calendar |
| `/d/[token]/alerts` | Alert list |
| `/d/[token]/alerts/[id]` | Alert detail |
| `/d/[token]/calls/[id]` | Call detail |
| `/d/[token]/settings` | Read-only settings |
| `/demo/call` | Offline scripted simulator (judge fallback) |
| `/family`, `/call` | Redirect into `/d/example-kamla` or `/demo/call` |

## Data

Postgres-shaped schema (Supabase in prod). Local: PGlite file `.data/saathi`.  
Source of truth is the database. **localStorage is not used for the family view.** `/demo/call` may keep a local transcript as an offline judge fallback.

Tables: parents, contacts, medicines, schedules, calls, call_attempts, dose_logs, alerts, alert_events, memory_notes, consents, outbound_messages, webhook_events, magic_links.

`is_example=true` on seed rows. UI shows **EXAMPLE DATA**.

When `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, swap the driver (Phase 1 still runs on PGlite if they are empty).

## Outbound (Phase 2+)

One gateway. Never dial/send outside `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS`.  
`MOCK_BOLNA=1` and `MOCK_WHATSAPP=1` by default.

## What not to add

- A second component library
- FastAPI / extra services
- Diagnosis or dose advice
- Third-party analytics
- Parent-facing mobile app
