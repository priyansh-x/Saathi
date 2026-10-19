# Staging deploy (Vercel + Supabase)

Priyansh deploys. This file is the checklist only. **Do not turn mocks off. Do not enable cron. Do not put real numbers on the allowlist.**

Staging is a public HTTPS preview of the family desk and the landing page, with the same mock Bolna and mock WhatsApp behaviour as `npm run dev`. Nothing dials or sends.

## Two apps, two Vercel projects

| App | Root directory | Local port | Staging job |
| --- | --- | --- | --- |
| Family desk | repo root | 43147 | `/onboard`, `/d/example-kamla`, APIs |
| Marketing landing | `landing/` | 43211 | Waitlist only |

Framework: Next.js. Node as the install/build command (`npm install` / `npm run build`). Do not add a production cron on the first deploy.

Set each project's **Production** and **Preview** env from `.env.example` (names only in git; values only in the Vercel UI). After the family project has a URL, set `PUBLIC_BASE_URL` to that origin with no trailing slash.

## Staging env (family desk)

Copy every name from `.env.example`. Staging values that must stay as written:

| Name | Staging value | Why |
| --- | --- | --- |
| `MOCK_BOLNA` | `1` | No live dials. |
| `MOCK_WHATSAPP` | `1` | No live WhatsApp. Does **not** mint a sign-in cookie. |
| `MOCK_EMAIL` | `1` | No live email. On Vercel (`NODE_ENV=production`) this never issues a session. Sign-in returns "Email sign-in is not configured" except `OPS_EMAILS`, who still need a real emailed link or code. Instant mock sessions exist only on localhost `npm run dev`. |
| `ALLOWED_PHONE_NUMBERS` | empty | Even a mock path refuses non-example numbers off this list when mocks are later flipped. Keep it empty so a mistaken `MOCK_*=0` still cannot reach anyone. |
| `ALLOWED_EMAILS` | empty | Same rule for email. |
| `WHATSAPP_TEMPLATES_APPROVED` | `0` | Stay on `hello_world` if anything ever tried to send. |
| `SAATHI_KILL_SWITCH` | `0` | Desk and mock tools still run. Flip to `1` only to freeze outbound. `/ops` can also latch a DB kill switch (audit row); env `1` still wins. |
| `OPS_EMAILS` | empty | Who can open `/ops` after sign-in. Empty = 404 for everyone. |
| `VOICE_ALERT_CHILD` | `0` | No child voice alert. |
| `PUBLIC_BASE_URL` | `https://<family-vercel-host>` | Magic links and tool URLs. |
| `SESSION_SECRET` | `openssl rand -hex 32` | Required on a public host. Vercel sets `NODE_ENV=production` even with mocks on. Do not leave empty — there is no `dev-magic` fallback. |
| `BOLNA_TOOL_TOKEN` | `openssl rand -hex 32` | Required on a public host. Must differ from `BOLNA_WEBHOOK_SECRET`. No `dev-tool-token` fallback. `SAATHI_TOOL_TOKEN` is a deprecated alias. |
| `BOLNA_WEBHOOK_SECRET` | `openssl rand -hex 32` | Required on a public host. Must differ from the tool token. Never reuse the tool token. |
| `CRON_SECRET` | `openssl rand -hex 32` | Required on a public host. Must differ from `SESSION_SECRET`, `BOLNA_TOOL_TOKEN`, and `BOLNA_WEBHOOK_SECRET`. No `dev-cron` fallback. Production ignores `now` / `elapsed_min` on the cron body even with mocks on. |
| `PRODUCT_NAME` | `Saathi` | Keep unless renaming. |
| `BRIEFING_CHANNEL` | `whatsapp` | |
| `LANGUAGES` | `hi,en` | |
| `CALL_BUDGET_MINUTES_DAILY` | `15` | |
| `MAX_CALL_SECONDS` | `180` | |

Leave live Bolna API keys, WhatsApp Graph tokens, and live email secrets (`RESEND_API_KEY` / `EMAIL_API_KEY`, `SMTP_*`, `EMAIL_FROM`) **empty** on staging. Still set `SESSION_SECRET`, `BOLNA_TOOL_TOKEN`, `BOLNA_WEBHOOK_SECRET`, and `CRON_SECRET` with four different `openssl rand -hex 32` values — public hosts have no `dev-*` fallbacks. `WHATSAPP_VERIFY_TOKEN` has no `dev-wa-verify` fallback in production. `MAGIC_LINK_SECRET` is a deprecated alias for `SESSION_SECRET`. `SAATHI_TOOL_TOKEN` is a deprecated alias for `BOLNA_TOOL_TOKEN`.

Landing project: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` only if the waitlist table is ready; otherwise the waitlist route no-ops outside production.

## Supabase

Create one project (ap-south-1 if offered). Staging uses it for:

1. **Landing waitlist** (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on the landing project).
2. **Family email magic links** later (`SUPABASE_ANON_KEY` or service role on the family project). `MOCK_WHATSAPP=1` does not sign anyone in. Addresses must be on `ALLOWED_EMAILS` or `OPS_EMAILS`, or the form shows "Pilot is invite-only for now". On a public host, `MOCK_EMAIL=1` never mints a cookie — testers use `/d/[token]`. The emailed 6-digit code is for the Android app (the link opens the phone browser). Ops bootstrap is below. `/ops` lists pending codes only while `MOCK_EMAIL=1` and only for allowlisted addresses.

The family desk boots **PGlite** (`.data/saathi`) when `DATABASE_URL` is unset, including on Vercel. That store is ephemeral on serverless — cold starts re-seed the EXAMPLE household. That is enough for a mocked staging walk.

When you are ready to host family data on Supabase Postgres:

1. Create a project (ap-south-1 if offered). Copy the **service role** connection string into `DATABASE_URL` on the family Vercel project (server-only; never `NEXT_PUBLIC_`).
2. From this repo: `npm run db:migrate` with `DATABASE_URL` set. It applies `src/lib/db/migrations/001_*.sql` … in order, records them in `schema_migrations`, and is safe to re-run.
3. Every table has **RLS on and no public policies**. The Next.js server uses the service role, which bypasses RLS. Do not use the anon key for family queries.

**Manual Supabase check (Priyansh):**

1. `DATABASE_URL` set, `MOCK_BOLNA=1`, `MOCK_WHATSAPP=1`, allowlists empty.
2. `npm run db:migrate` prints `{ ok: true, driver: "postgres" }`.
3. In the SQL editor: `select id from schema_migrations order by id;` includes `013_rls`.
4. `select relrowsecurity from pg_class where relname = 'parents';` is true.
5. As anon (not service role), `select count(*) from parents;` returns 0 / permission error — no public policy.
6. `npm test` still runs on PGlite (unset `DATABASE_URL` in that shell).

Do not seed production with EXAMPLE rows. Staging may show `/d/example-kamla` from the local PGlite seed.

Auth redirect (later, live only): Site URL = `PUBLIC_BASE_URL`; additional redirect `https://<family-host>/api/auth/callback`.

## Vercel Cron

Leave cron **off**. `POST /api/cron/tick` stays bearer-authenticated (`CRON_SECRET`). Do not add an enabled `vercel.json` schedule until Priyansh says go. See `docs/saathi/engineering/cron.md`.

## After Priyansh clicks deploy

1. Open `https://<family-host>/d/example-kamla` — EXAMPLE ribbon, Today, History, Alerts, Settings.
2. Open `/onboard` — no cookie for a typed email. Staging `NODE_ENV` is production, so mock sign-in is closed. Desk still works at `/d/example-kamla`.
3. Confirm env in the Vercel UI: mocks `1`, allowlists empty, `OPS_EMAILS` empty until you bootstrap ops (below).
4. Do not run `bolna:test-call --yes`. Do not set `CALL_PROVIDER=bolna` or `MOCK_*=0`.

## Ops bootstrap (Priyansh)

`/ops` 404s until `OPS_EMAILS` has your address **and** you can prove you own it.

1. Keep `MOCK_EMAIL=1` on staging so nobody else gets mail. Instant mock cookies stay off because Vercel is `NODE_ENV=production`.
2. Put your address on `OPS_EMAILS`. Sign-in mail to `OPS_EMAILS` skips `gateOutbound` and the kill switch so you can still receive a code and turn the switch off. Other outbound still goes through the gate. Family testers stay on `ALLOWED_EMAILS` / `/d/<token>`.
3. Configure a real mail path: Resend/SMTP (`EMAIL_FROM` + key) **or** Supabase Auth magic link. `/onboard` will still say "Email sign-in is not configured" for everyone else.
4. Sign in with the emailed link or 6-digit code — never a cookie minted by the server because mocks are on.
5. Open `/ops`. Empty `OPS_EMAILS` again after the walk if you want the page 404 for everyone.
6. Desk testers keep using `/d/example-kamla`. Do not put a family owner's address on `OPS_EMAILS` unless they should see kill switch and simulate.

## First live call (only when Priyansh says go)

Staging stays mocked. This list is the same as the README runbook. Agents never flip live flags.

1. Env: `BOLNA_API_KEY`, `BOLNA_AGENT_ID`, `BOLNA_TOOL_TOKEN`, `BOLNA_WEBHOOK_SECRET`, `CRON_SECRET`, HTTPS `PUBLIC_BASE_URL`. Keep `MOCK_WHATSAPP=1`.
2. `npm run bolna:sync` (dry). Priyansh only: `npm run bolna:sync -- --apply` — PUT existing agent, never create.
3. `/ops` Bolna readiness all green (set/missing and last four only; never secret values).
4. **Simulate a Bolna webhook** on `/ops`. Last webhook time + status updates.
5. Allowlist exactly Priyansh's number.
6. Priyansh sets `CALL_PROVIDER=bolna`.
7. `npm run bolna:test-call -- +91XXXXXXXXXX` dry, then `--yes` only with Priyansh on the line.
8. Check the desk, then set `CALL_PROVIDER=simulated` / `MOCK_BOLNA=1` again.
9. `SAATHI_KILL_SWITCH=1` stops everything outbound.

If you are not Priyansh, stop after reviewing this file.
