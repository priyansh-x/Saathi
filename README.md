The marketing site lives in [`landing/`](./landing/) (`npm run dev` there on port 43211).

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
| `/demo/controls` | Two-minute EXAMPLE walks: red flag and missed ladder |

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

## Phase 2 (mock Bolna)

`MOCK_BOLNA=1` by default. No real dial.

```bash
npm test
npm run bolna:sync    # dry-run without BOLNA_API_KEY
```

Settings → mock buttons: good morning, chest-pain line, late extraction.  
Or `POST /api/demo/bolna` with `{ "scenario": "chest" }`.

Real `POST /call` needs `BOLNA_API_KEY`, `BOLNA_AGENT_ID`, `MOCK_BOLNA=0`, and the number on `ALLOWED_PHONE_NUMBERS`. `npx tsx scripts/bolna/test-call.ts +91XXXXXXXXXX` is a dry run unless `--yes` is passed and mocks are off. Do not run a live call unless Priyansh says go. Trial notes stay empty until then.

## Phase 3 (mock WhatsApp)

`MOCK_WHATSAPP=1` by default. No Meta send.

After a mock completed call, Settings shows the logged briefing. Chest-pain also logs safety + neighbour responder. **I'm on it** on Alert detail (or Settings) is first-ack-wins and broadcasts the ack update.

`WHATSAPP_TEMPLATES_APPROVED=0` uses `hello_world` + email fallback for real sends. Priyansh submits Utility templates. Live inbound checks `X-Hub-Signature-256` against `WHATSAPP_APP_SECRET`. `POST /api/demo/whatsapp/inbound` is a fixture button tap (mock only).

## Phase 4 (ladder + pilot)

Settings → **Missed-call ladder** walks T / +10 / +25 / +30 soft notice / +45 / +60 neighbour+child if nobody acked.

`SAATHI_KILL_SWITCH=1` stops cron, dials, and sends. Real calls need consent (child written + Maa's haan). **Delete all of Maa's data** wipes the household.

## UX round 1 (PR D)

Settings is family-only: call, medicines, family, pause, privacy, about. Delete needs a confirm screen. Mock Bolna, outbound log, kill-switch and “Record haan” live at `/demo/controls` (404 when mocks are off). `en` and `hi` share the same keys. `<html lang>` follows the cookie.

## UX round 1 (PR B)

Alerts list open first. Each row has a worded pill: Open / someone is going / Maa is OK / False alarm. Detail has a 3-step tracker, “I'm on it”, “Maa is OK”, and False alarm. Ack uses the real child name and time.

## UX round 1 (PR C)

Tab bar is fixed to the bottom with a safe-area inset. History has a Mon–Sun calendar, a visible legend, medicine counts for every tablet, and a stored-mood strip (no quote keyword matching). Call detail has a dated header, summary bullets, one medicines card, her words, and a collapsed transcript. EN↔हिं keeps `days` and `from`.

## UX round 1 (PR A)

Today is one hero card: scheduled / trying / good / look / act / paused / skipped. A morning with no call yet stays grey "Later today", never amber. Medicines are one card. Settings → Missed shows a trying step list (no "ladder" / "T" / "+25").

## Later

See `prd.md` and `docs/saathi/`. Live Bolna/WhatsApp still need Priyansh's allowlist and keys.
