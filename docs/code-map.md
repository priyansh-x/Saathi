# Code map

Use this when you add a feature or start a sibling product on the same stack.

## Stack

Next.js App Router, TypeScript, Tailwind, shadcn/ui. Family desk at the repo root. Marketing site in `landing/` with its own Next app. Capacitor Android in `android/`.

Do not add a second component library or a parallel backend.

## Where to change what

| You want to… | Start here |
| --- | --- |
| Desk screens (Today, History, Alerts, Settings) | `src/components/family/`, routes in `src/app/d/[token]/` |
| Copy / EN–HI | `src/lib/i18n/messages.ts` |
| Place a call | `src/lib/bolna/place.ts` → `src/lib/calls/prepare.ts` |
| Bolna webhook / transcript | `src/lib/bolna/webhook.ts`, `execution.ts`, `transcript.ts` |
| Medicine + alerts from a call | `src/lib/bolna/tools.ts`, `flag-from-transcript.ts` |
| Missed-call retries | `src/lib/ladder.ts` |
| WhatsApp / push | `src/lib/whatsapp/`, `src/lib/push.ts` |
| Allowlist / kill switch | `src/lib/outbound.ts`, `src/lib/config.ts` |
| Schema + queries | `src/lib/db/` (`schema.sql`, `migrations/`, `queries.ts`) |
| EXAMPLE Kamla seed | `src/lib/db/seed.ts` |
| Cron | `src/lib/cron/tick.ts`, `src/app/api/cron/tick/route.ts` |
| Auth / magic link | `src/lib/auth/` (do not casually rewrite session HMAC) |
| Onboard | `src/lib/onboard.ts`, `src/app/onboard/` |
| Ops | `src/app/ops/`, `src/lib/ops/` |
| Admin dashboard | `src/app/admin/`, `src/lib/admin/`, `src/app/api/admin/` |

## Invariants

1. **One outbound gate.** `gateOutbound` in `src/lib/outbound.ts`. Live numbers must be on `ALLOWED_PHONE_NUMBERS`.
2. **Mocks on in git.** `CALL_PROVIDER=simulated`, `MOCK_BOLNA=1`, `MOCK_WHATSAPP=1`, `MOCK_EMAIL=1`.
3. **EXAMPLE is labelled.** Seed rows use `is_example`. Never invent a live transcript.
4. **IST timestamps.** Store `+05:30`, never `Z`.
5. **Idempotent webhooks.** Replaying a Bolna `completed` body must not duplicate calls, doses, or alerts.
6. **Test call ≠ morning call.** `placeTestCall` skips the once-a-day cap and still writes History.

## Tests

Colocate `*.test.ts` next to the module. Run `npm test` with `--test-concurrency=1`. Playwright lives in `e2e/` and boots `next start` on port 43197 with its own PGlite file.

When you add a desk flow, cover empty / in-progress / completed, and check History if you write a call row.

## Env

Copy `.env.example` → `.env.local`. Production names also live on Vercel. `.env.production` may set non-secret product defaults (for example the pilot allowlist). Never commit `.env.local` or `family-desk.vercel.env`.
