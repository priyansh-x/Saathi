# Contributing

1. Product specs in [docs/saathi/](./docs/saathi/) win. [prd.md](./prd.md) is background.
2. Small PRs: Phase 1 data/UI, then Bolna, then WhatsApp, then ladder.
3. Do not add a second UI kit or a FastAPI service.
4. Never dial or message a number outside `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS`.
5. Fake data is always labelled EXAMPLE. No invented metrics.
6. Companionship and reminders. Never diagnosis or dose advice.

```bash
npm install
npm run dev      # http://127.0.0.1:43147
npm run seed
npm run lint
```

New env names go in `.env.example` with no values.

## PR B test plan (Alerts)

- List: open first; each row has words in the status pill (Open / is going / Maa is OK / False alarm). Resolved rows have no red chip.
- I'm on it → pill becomes "<name> is going · hh:mm" on list, detail, and Today.
- Maa is OK → Act-now banner gone on History/Alerts/Settings.
- Timeline has no raw enum words (`notified`, `acked`).
- Actor is the token's child, time is now (not 12:00 / Rohit).

## PR A test plan (Today)

- Before 8:40 IST with no call today: grey "Later today", not amber.
- Settings → Missed: hero is Needs a look + step times; page never says "Call answered" or "ladder".
- Settings → Good morning: one Amlodipine row; quote once.
- Open chest-pain seed: hero is Act now with her quote; no Act-now banner above it.
- `npm test` includes `todayStatus` states.

## Phase 4 test plan

- `npm test` includes ladder, busy≠unreachable, consent gate, kill switch, delete.
- Settings → Missed-call ladder → Today shows T…+60 and Act now if nobody acked.
- `SAATHI_KILL_SWITCH=1` then `POST /api/cron/tick` returns `halted`.
- Delete all of Maa's data → `/` and the example token 404s until you `npm run seed`.
- Env: `SAATHI_KILL_SWITCH`, `VOICE_ALERT_CHILD`, `LADDER_*`.

## Phase 3 test plan

- `npm test` includes WhatsApp briefing + first-ack-wins + allowlist.
- Settings → Good morning → Outbound list shows a child briefing (EXAMPLE).
- Chest-pain → Alert detail → I'm on it. Second tap is a no-op. Ack broadcast is logged.
- `MOCK_WHATSAPP=0` without allowlist refuses a send.
- Env: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_TEMPLATES_APPROVED`, `EMAIL_API_KEY`, `MOCK_WHATSAPP`, `ALLOWED_PHONE_NUMBERS`, `ALLOWED_EMAILS`.

## Phase 2 test plan

- `npm test` — dose/alert idempotency, webhook replay ×3 → one call, late extraction → one alert, allowlist + kill switch.
- Settings → Chest-pain line → Today shows Act now with her quote.
- `POST /api/webhooks/bolna` the same body three times → one `calls` row.
- `MOCK_BOLNA=0` without allowlist → placeCall refuses.
- Env: `MOCK_BOLNA`, `BOLNA_TOOL_TOKEN`, `CRON_SECRET`, `BOLNA_API_KEY`, `BOLNA_AGENT_ID`, `PUBLIC_BASE_URL`, `CALL_BUDGET_MINUTES_DAILY`, `MAX_CALL_SECONDS`, `ALLOWED_PHONE_NUMBERS`.

## Phase 1 test plan

- Open `/d/example-kamla` at 375 px and at 200% zoom. No horizontal scroll.
- Today / History / Alerts / Settings / call detail / alert detail all read the DB.
- Act-now banner stays on every tab until Resolve.
- EN / हिं toggle keeps you on the same screen.
- Settings pause flips `parents.paused`.
- `/` has one CTA. `/demo/call` still runs offline.
- Invalid token → not found. Kill the DB file and reload → seed + EXAMPLE ribbon.
