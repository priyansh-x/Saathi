# Saathi

Saathi is a morning phone call for an Indian parent, on the phone they already own. The child gets a short WhatsApp briefing. Companionship and reminders — never diagnosis.

Two apps live in this repo:

| App | Directory | Dev server |
| --- | --- | --- |
| Family desk | repo root | `npm run dev` → http://127.0.0.1:43147 |
| Marketing landing | `landing/` | `cd landing && npm run dev` → http://127.0.0.1:43211 |

Child setup: `/onboard` (email sign-in, then the family form). EXAMPLE household: `/d/example-kamla` (fictional, labelled EXAMPLE). Specs in [`docs/saathi/`](./docs/saathi/).

The family desk is a PWA (`/manifest.webmanifest`, `/sw.js`): Add to Home Screen from the home page or Settings. Layout target is a 360×740 phone. The service worker caches the app shell (desk HTML, JS, CSS, fonts, icons) on successful GETs and never `/api`. Desk pages expire after 24 hours; a cached page shows “Last updated at …”. Sign-out and Delete everything clear the cache. Web Push goes through `gateOutbound` (`push`) and is mocked while `MOCK_WHATSAPP=1`.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev          # family desk, port 43147
npm run seed         # reset Kamla Sharma EXAMPLE
npm test
npm run lint
npm run e2e         # Playwright at 360×740, mocks on, isolated PGlite. Under 3 minutes.
                    # Once: npx playwright install chromium

cd landing && npm install && npm run dev   # landing, port 43211
```

Local data is PGlite at `.data/saathi` when `DATABASE_URL` is unset. Set `DATABASE_URL` to a Postgres URL (Supabase) and run `npm run db:migrate`. Tests always use PGlite.

Images go through `next/image` with `sizes`. Fonts are subset (latin Inter/serif, Devanagari Noto) and not preloaded, so CSS is not queued behind the typefaces. Compiled CSS is inlined (`npm run prebuild`). Today, Alerts, and History stay server-rendered — no React client bundle.

## Mocks and allowlist

`MOCK_BOLNA=1` and `MOCK_WHATSAPP=1` by default. Morning calls go through `CALL_PROVIDER` (`simulated` by default; `MOCK_BOLNA=0` is an alias for `bolna`). Nothing dials or sends on install, deploy, or `npm run dev`. Cron is authenticated and **not** enabled on deploy. Sunday evening IST, the same tick logs a mocked weekly WhatsApp note for each family.

Every call, WhatsApp, SMS, or email goes through `gateOutbound` and `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS`. Kill switch: `SAATHI_KILL_SWITCH=1`.

## Env (names only)

| Name | Default | Used for |
| --- | --- | --- |
| `CALL_PROVIDER` | `simulated` | `simulated` or `bolna`. Default simulated. Never set to `bolna` unless Priyansh says go. |
| `MOCK_BOLNA` | `1` | Mock dials. `0` is an alias for `CALL_PROVIDER=bolna`. Never set to `0` unless Priyansh says go. |
| `MOCK_WHATSAPP` | `1` | Mock WhatsApp. Same rule. |
| `SAATHI_KILL_SWITCH` | `0` | Stops cron, dials, and sends. |
| `ALLOWED_PHONE_NUMBERS` | empty | Live allowlist. |
| `ALLOWED_EMAILS` | empty | Live email fallback allowlist. |
| `OPS_EMAILS` | empty | Signed-in emails that can open `/ops`. Others get 404. |
| `RETENTION_TRANSCRIPT_DAYS` | `30` | Daily tick deletes call transcripts older than this. |
| `RETENTION_SUMMARY_DAYS` | `90` | Daily tick clears summaries and quotes; alerts stay without her words. |
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

## First live call (runbook)

Nothing reaches a real person without Priyansh's explicit go-ahead. Defaults stay `CALL_PROVIDER=simulated`, `MOCK_BOLNA=1`, `MOCK_WHATSAPP=1`. Agents never set those live flags and never pass `--yes`.

1. **Env.** Set `BOLNA_API_KEY`, `BOLNA_AGENT_ID`, `SAATHI_TOOL_TOKEN`, `BOLNA_WEBHOOK_SECRET`, `CRON_SECRET`, and `PUBLIC_BASE_URL` (HTTPS). Keep `MOCK_WHATSAPP=1`. Leave `SAATHI_KILL_SWITCH=0` until you need to freeze.
2. **Sync dry, then apply.** `npm run bolna:sync` prints the agent JSON and diffs `scripts/bolna/agent.json` (no network). Only Priyansh runs `npm run bolna:sync -- --apply`, which PUTs the existing agent. It never creates a new one.
3. **Readiness all green.** Sign in with an `OPS_EMAILS` address. `/ops` Bolna card: CALL_PROVIDER, agent id / API key / tool token / webhook secret set, `PUBLIC_BASE_URL` HTTPS, allowlist exactly one number (last four only). Secrets are never shown.
4. **Simulate webhook.** On `/ops`, **Simulate a Bolna webhook**. Last webhook time + status should go green. EXAMPLE synthetic payload only.
5. **Allowlist own number.** `ALLOWED_PHONE_NUMBERS` is exactly Priyansh's E.164 number. `ALLOWED_EMAILS` is his inbox.
6. **Provider.** Priyansh sets `CALL_PROVIDER=bolna` (do not leave this on).
7. **Test-call dry, then `--yes`.** `npm run bolna:test-call -- +91XXXXXXXXXX` prints the payload and does not fetch. Live dial only with `--yes`, `CALL_PROVIDER=bolna`, and the allowlisted number, with Priyansh on the line.
8. **Desk.** Confirm Today, the call row, and the briefing path on the family desk (EXAMPLE data stays labelled EXAMPLE).
9. **Switch back.** Set `CALL_PROVIDER=simulated` and `MOCK_BOLNA=1`. Empty or restore the allowlist. Do not leave Bolna live.
10. **Kill switch.** `SAATHI_KILL_SWITCH=1` (or `/ops` Turn on) stops cron, dials, and sends. Env `1` still wins over the desk latch.

If you are not Priyansh, stop after the dry-run sync and the dry-run test-call. Do not `--apply`. Do not `--yes`. Do not set `CALL_PROVIDER=bolna`.
