# Saathi

Saathi is a morning phone call for an Indian parent, on the phone they already own. The child gets a short WhatsApp briefing. Companionship and reminders — never diagnosis.

Two apps live in this repo:

| App | Directory | Dev server |
| --- | --- | --- |
| Family desk | repo root | `npm run dev` → http://127.0.0.1:43147 |
| Marketing landing | `landing/` | `cd landing && npm run dev` → http://127.0.0.1:43211 |

Child setup: `/onboard` (email sign-in, then the family form). EXAMPLE household: `/d/example-kamla` (fictional, labelled EXAMPLE). Specs in [`docs/saathi/`](./docs/saathi/).

The family desk is a PWA (`/manifest.webmanifest`, `/sw.js`): Add to Home Screen from the home page or Settings. Layout target is a 360×740 phone. The service worker does not cache `/api`. Web Push goes through `gateOutbound` (`push`) and is mocked while `MOCK_WHATSAPP=1`.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev          # family desk, port 43147
npm run seed         # reset Kamla Sharma EXAMPLE
npm test
npm run lint

cd landing && npm install && npm run dev   # landing, port 43211
```

Local data is PGlite at `.data/saathi`.

## Mocks and allowlist

`MOCK_BOLNA=1` and `MOCK_WHATSAPP=1` by default. Nothing dials or sends on install, deploy, or `npm run dev`. Cron is authenticated and **not** enabled on deploy. Sunday evening IST, the same tick logs a mocked weekly WhatsApp note for each family.

Every call, WhatsApp, SMS, or email goes through `gateOutbound` and `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS`. Kill switch: `SAATHI_KILL_SWITCH=1`.

## Env (names only)

| Name | Default | Used for |
| --- | --- | --- |
| `MOCK_BOLNA` | `1` | Mock dials. Never set to `0` unless Priyansh says go. |
| `MOCK_WHATSAPP` | `1` | Mock WhatsApp. Same rule. |
| `SAATHI_KILL_SWITCH` | `0` | Stops cron, dials, and sends. |
| `ALLOWED_PHONE_NUMBERS` | empty | Live allowlist. |
| `ALLOWED_EMAILS` | empty | Live email fallback allowlist. |
| `BOLNA_API_KEY` / `BOLNA_AGENT_ID` / `BOLNA_BASE_URL` | empty | Live Bolna. |
| `SAATHI_TOOL_TOKEN` | empty (dev fallback when mocked) | Mid-call tools. |
| `BOLNA_WEBHOOK_SECRET` | empty | Live Bolna webhook. |
| `CRON_SECRET` | empty (dev fallback when mocked) | `POST /api/cron/tick`. |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_APP_SECRET` | empty | Live WhatsApp. |
| `WHATSAPP_TEMPLATES_APPROVED` | `0` | Real templates vs `hello_world`. |
| `PUBLIC_BASE_URL` | `http://127.0.0.1:43147` | Magic links and tool URLs. |
| `PRODUCT_NAME` | `Saathi` | Rename without a rewrite. |
| `MAGIC_LINK_SECRET` | empty | Desk tokens. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | empty | Auth magic link in production; optional later DB driver. |

Full list: [`.env.example`](./.env.example). Never commit values.

## Staging (Priyansh deploys)

Checklist: [`docs/saathi/engineering/deploy.md`](./docs/saathi/engineering/deploy.md). Vercel (family root + `landing/`) and optional Supabase. Keep `MOCK_BOLNA=1`, `MOCK_WHATSAPP=1`, empty allowlists, cron off.

## First real call (runbook)

Nothing reaches a real person without Priyansh's explicit go-ahead.

1. Keep `MOCK_BOLNA=1` and `MOCK_WHATSAPP=1`. Walk `/demo/controls` and `/d/example-kamla`.
2. Put **only** Priyansh's numbers on `ALLOWED_PHONE_NUMBERS` (and emails on `ALLOWED_EMAILS`).
3. Dry run, no `--yes`: `npx tsx scripts/bolna/test-call.ts +91XXXXXXXXXX`
4. Stop. Do not pass `--yes`. Do not set `MOCK_*=0`. Do not enable cron.
5. A live `--yes` call happens only when Priyansh is on the line and says go.

If you are not Priyansh, you are done at step 3.
