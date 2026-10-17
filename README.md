# Saathi

Working name for a morning phone call to an Indian parent, on the phone they already own. The child gets a short WhatsApp briefing. Companionship and reminders — never diagnosis. Easy to rename via `PRODUCT_NAME`.

Built for the Bolna × YC Voice AI Buildathon. Product specs in [docs/saathi/](./docs/saathi/) win when they disagree with older notes.

## Phase 1 (this slice)

Family web view from a magic link, seeded Postgres-shaped data, product chrome.

| Route | Job |
| --- | --- |
| `/` | One screen, one CTA |
| `/onboard` | Household form + consent |
| `/d/example-kamla` | Today |
| `/d/example-kamla/history` | 7 / 30 calendar |
| `/d/example-kamla/alerts` | Alert list + detail |
| `/d/example-kamla/settings` | Read-only + pause |
| `/demo/call` | Offline scripted call (judge fallback) |

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev          # http://127.0.0.1:43147
npm run seed         # reset the Kamla Sharma example
npm run lint
```

No Bolna or WhatsApp keys needed. Local data is PGlite at `.data/saathi`. Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` later to swap the driver.

## Env (Phase 1)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MAGIC_LINK_SECRET`, `PRODUCT_NAME`. Names only in `.env.example`.

## Demo data

Fictional only, labelled **EXAMPLE DATA**: Kamla Sharma (Delhi), Rohit, neighbour Sunita ji. Do not call a real parent without Priyansh’s go-ahead.

## Later phases

2 Bolna · 3 WhatsApp · 4 missed-call ladder + kill switch. See `prd.md` and `docs/saathi/`.
