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

When `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, swap the driver (Phase 1 still runs on PGlite if they are empty). Staging steps: `docs/saathi/engineering/deploy.md`. The family desk still uses PGlite until that swap lands.

## Outbound (Phase 2)

One gateway (`src/lib/outbound.ts`). Never dial/send outside `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS`.  
`MOCK_BOLNA=1` and `MOCK_WHATSAPP=1` by default.

| Route | Job |
| --- | --- |
| `POST /api/tools/*` | Mid-call tools, Bearer `SAATHI_TOOL_TOKEN` |
| `POST /api/webhooks/bolna` | Store every delivery; process `status=completed` |
| `POST /api/cron/tick` | Place today's calls (own scheduler) |
| `POST /api/demo/bolna` | Mock scenarios when `MOCK_BOLNA=1` |

Agent config: `scripts/bolna/agent.json`. Sync: `npm run bolna:sync` (dry-run without a key).

Trial verification still pending — write results into `docs/saathi/engineering/bolna_api_notes.md`. Do not invent them.

## WhatsApp (Phase 3)

`MOCK_WHATSAPP=1` by default. Until `WHATSAPP_TEMPLATES_APPROVED=1`, we send `hello_world` (or email fallback) and still log the intended Utility copy.

| Route | Job |
| --- | --- |
| `GET/POST /api/webhooks/whatsapp` | Verify + quick-reply acks. First ack wins. |
| `POST /api/demo/whatsapp` | Mock “I'm on it” |

A completed call writes a child briefing. `raise_alert` writes safety_alert + responder. Ack broadcasts `alert_ack_update`.

## Escalation + pilot (Phase 4)

Missed-call ladder (per-family `family_config`): T, +10, +25, soft notice +30, last try +45, child+neighbour +60 if nobody acked. Busy/declined ≠ unreachable.

`SAATHI_KILL_SWITCH=1` stops `/api/cron/tick`, dialling, and sending. Real calls need child written consent + parent voice haan. Settings can delete all of Maa's data. `VOICE_ALERT_CHILD=1` queues an optional child voice alert on EMERGENCY only.

## What not to add

- A second component library
- FastAPI / extra services
- Diagnosis or dose advice
- Third-party analytics
- Parent-facing mobile app
