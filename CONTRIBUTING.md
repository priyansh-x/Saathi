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

## Phase 2 test plan

- `npm test` — dose/alert idempotency, webhook replay ×3 → one call, late extraction → one alert, allowlist + kill switch.
- Settings → Chest-pain line → Today shows Act now with her quote.
- `POST /api/webhooks/bolna` the same body three times → one `calls` row.
- `MOCK_BOLNA=0` without allowlist → placeCall refuses.
- Env: `MOCK_BOLNA`, `SAATHI_TOOL_TOKEN`, `CRON_SECRET`, `BOLNA_API_KEY`, `BOLNA_AGENT_ID`, `PUBLIC_BASE_URL`, `CALL_BUDGET_MINUTES_DAILY`, `MAX_CALL_SECONDS`, `ALLOWED_PHONE_NUMBERS`.

## Phase 1 test plan

- Open `/d/example-kamla` at 375 px and at 200% zoom. No horizontal scroll.
- Today / History / Alerts / Settings / call detail / alert detail all read the DB.
- Act-now banner stays on every tab until Resolve.
- EN / हिं toggle keeps you on the same screen.
- Settings pause flips `parents.paused`.
- `/` has one CTA. `/demo/call` still runs offline.
- Invalid token → not found. Kill the DB file and reload → seed + EXAMPLE ribbon.
