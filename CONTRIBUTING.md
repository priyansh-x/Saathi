# Contributing

Product specs in [docs/saathi/](./docs/saathi/) win when they disagree with older notes. The [code map](./docs/code-map.md) is the place to start a change.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev          # http://127.0.0.1:43147
npm run seed
```

Keep `CALL_PROVIDER=simulated` and `MOCK_*=1` in git. New env names go in `.env.example` with empty or mock-safe values.

## Branch and PR

1. Branch from `main` with a short, descriptive name.
2. Small, reviewable diffs. Match the modules already in `src/lib`.
3. Do not add a second UI kit or a second backend.
4. Fake data is labelled EXAMPLE. Do not invent live transcripts or metrics.
5. Companionship and reminders. Never diagnosis or dose advice. Keep the 112 line.

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

- Desk change: empty, in-progress, and completed states. If you write a call, History still lists it.
- Outbound change: a unit test through `gateOutbound`. Every call, WhatsApp, email, or push goes through that function. Live targets must be on `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS`.
- Copy: EN and हिं in `src/lib/i18n/messages.ts`. No em dashes in user-facing strings.
- Do not pass `--yes` or `--apply` unless the owner asked.
