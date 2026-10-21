# Contributing

Product specs in [docs/saathi/](./docs/saathi/) win. The [code map](./docs/code-map.md) is the place to start a change.

## Ground rules

1. Small, reviewable diffs. Match the modules already in `src/lib`.
2. Do not add a second UI kit or a second backend.
3. Never dial or message a number outside `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS`.
4. Leave `CALL_PROVIDER=simulated` and `MOCK_*=1` in git. Do not pass `--yes` or `--apply` unless the owner asked.
5. Fake data is labelled EXAMPLE. Do not invent live transcripts or metrics.
6. Companionship and reminders. Never diagnosis or dose advice. Keep the 112 line.

## Local loop

```bash
npm install
cp .env.example .env.local
npm run dev          # http://127.0.0.1:43147
npm run seed
npm test
npm run lint
npm run typecheck
```

New env names go in `.env.example` with empty values.

## Checks before you push

- Desk change: empty, in-progress, and completed states. If you write a call, History still lists it.
- Outbound change: a unit test through `gateOutbound`.
- Copy: EN and हिं in `src/lib/i18n/messages.ts`.
