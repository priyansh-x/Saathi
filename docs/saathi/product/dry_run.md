# Dry-run script (Step 1)

This is the pass/fail for “Saathi works.” Run it the same way every time. Mocks stay on. Nothing dials or sends.

Do it **locally first** (this step). After you deploy (Step 2), run it again on the HTTPS URLs.

| | Local | After Vercel |
| --- | --- | --- |
| Family desk | http://127.0.0.1:43147 | `https://<family-host>` |
| Landing | http://127.0.0.1:43211 | `https://<landing-host>` |

```bash
# family desk
npm i && cp -n .env.example .env.local && npm run dev
# landing (second terminal)
cd landing && npm i && npm run dev
```

Leave `MOCK_BOLNA=1`, `MOCK_WHATSAPP=1`, `MOCK_EMAIL=1`. Do not set `CALL_PROVIDER=bolna`. Do not fill allowlists.

Log every miss as one row (GitHub issue is fine):

| Date | Surface | Walk | Expected | Got | Next |
| --- | --- | --- | --- | --- | --- |
| | desk / demo / landing / APK | A1… | | | |

---

## A. Identity (2 minutes)

Phone width (~390 px) and a laptop window.

- [ ] **A1** `/` — terracotta primary CTA only; mark is the outlined स, not an indigo ring and not a font glyph.
- [ ] **A2** `/d/example-kamla` header — same mark; **EXAMPLE** ribbon on the household.
- [ ] **A3** Favicon at 16 px still reads as स (bar, open hook, right stem). Compare `/brand` if unsure.
- [ ] **A4** `/?lang=hi` and `/d/example-kamla?lang=hi` — Hindi copy, no overflow on the chip or headline.

Fail if you see leftover indigo, a pill/capsule medicine icon, or terracotta used as the only way to tell “look” from “act”.

---

## B. EXAMPLE desk (the product)

Open `/d/example-kamla`. Seeded Kamla/Rohit. All of this is labelled EXAMPLE.

- [ ] **B1 Today** — chip has an **icon plus words** (not colour alone). “Needs a look” uses the eye; “Act now” uses the warning triangle **and** the words Act now (Hindi: अभी देखें).
- [ ] **B2** Bottom nav: Today, History, Alerts, Settings. Each loads. Back from a call/alert returns to Today.
- [ ] **B3 History** — calendar of past EXAMPLE mornings; open one call. No diagnosis copy. 112 line stays in privacy/emergency framing, not as “we will call 112 for you.”
- [ ] **B4 Alerts** — open/closed EXAMPLE alerts. Ack/resolve if the desk offers it; Today chip must update.
- [ ] **B5 Settings** — parent name, call time, medicines (bottle, not a capsule), neighbour. Read-only is fine. No raw secrets.
- [ ] **B6** `/onboard` — wizard walks. Locally a mock session may exist; on Vercel (`NODE_ENV=production`) typed email must **not** mint a cookie. Desk testers stay on `/d/example-kamla`.

Fail if EXAMPLE data is missing the EXAMPLE label, or if Act now is colour-only.

---

## C. One mocked morning (`/demo`)

`/demo` is allowed while Bolna and WhatsApp are mocked. It drives the EXAMPLE household.

- [ ] **C1** `/demo` then the walk: start → call → meds → brief → missed → red → ladder → going → ok.
- [ ] **C2** After **brief**, `/d/example-kamla` shows a **Good** (or equivalent) morning — answered call, doses not screaming Act now.
- [ ] **C3** After **missed** / ladder, Today is trying or Act now with a **text chip**, and Alerts has the row.
- [ ] **C4** After **going** / **ok**, first ack wins; chip is no longer Act now.
- [ ] **C5** `?lang=hi` on `/demo` — same walk, Hindi.
- [ ] **C6** Optional film: `/demo?record=1` plays through. `/demo` 404s only if mocks were turned off (they must not be).

Voice quality (haan, later, no diagnosis) is `docs/saathi/voice/test_scripts.md`. Do not need a live Bolna line for this script.

---

## D. Trust and ops

- [ ] **D1** `/ops` is **404** while `OPS_EMAILS` is empty. Do not add your address until you are ready to bootstrap mail (Step 2 / deploy.md).
- [ ] **D2** Kill switch: locally, `SAATHI_KILL_SWITCH=1` in `.env.local`, restart, hit `/demo` or a tick — no new outbound. Set back to `0`.
- [ ] **D3** Page source / `/ops` (when you later open it) never shows a full `+91…` or a token value.
- [ ] **D4** Landing `/` — waitlist form may no-op without Supabase. Primary CTA once. Privacy/terms load. Not the family desk.

---

## E. After Step 2 (same script, HTTPS)

Repeat A–D on the Vercel family URL. Extra:

- [ ] **E1** Phone browser: `/d/example-kamla` full screen, terracotta splash if you later sideload the APK (Step 3).
- [ ] **E2** Airplane mode on the APK (not required today): offline page, WhatsApp-still-works copy, Retry. Skip until the APK points at this host.
- [ ] **E3** Cold start: Vercel PGlite is ephemeral — EXAMPLE may re-seed. That is a pass for Step 2, not a bug.

---

## Pass

Every box in A–D is checked locally, with a dated log of anything you skipped or failed.

Then go to Step 2 (below). Do not enable cron. Do not put a real number on the allowlist. Do not run `bolna:test-call --yes`.

---

## Step 2 — what to deploy on Vercel (you do this)

Two **separate** Vercel projects, same GitHub repo (`main`). Framework: Next.js. Install/build: `npm install` / `npm run build`. Node 20.

### Project 1 — family desk (the product)

| Vercel setting | Value |
| --- | --- |
| Root directory | `.` (repo root, not `landing/`) |
| What it serves | `/`, `/demo`, `/onboard`, `/d/example-kamla`, `/ops`, `/api/*`, PWA |
| After deploy | Open `https://<family-host>/d/example-kamla` and `/demo` |

Env: copy **every name** from `.env.example` into Production and Preview. Values:

| Name | Set to | Leave empty |
| --- | --- | --- |
| `MOCK_BOLNA` `MOCK_WHATSAPP` `MOCK_EMAIL` | `1` | |
| `CALL_PROVIDER` | `simulated` | |
| `ALLOWED_PHONE_NUMBERS` `ALLOWED_EMAILS` | | empty |
| `WHATSAPP_TEMPLATES_APPROVED` | `0` | |
| `SAATHI_KILL_SWITCH` | `0` | |
| `OPS_EMAILS` | | empty until ops bootstrap |
| `VOICE_ALERT_CHILD` | `0` | |
| `PUBLIC_BASE_URL` | `https://<family-host>` no trailing slash | |
| `SAATHI_APP_URL` | same HTTPS origin (Android shell later) | |
| `SESSION_SECRET` | `openssl rand -hex 32` | |
| `BOLNA_TOOL_TOKEN` | different `openssl rand -hex 32` | |
| `BOLNA_WEBHOOK_SECRET` | different `openssl rand -hex 32` | |
| `CRON_SECRET` | different `openssl rand -hex 32` | |
| `PRODUCT_NAME` `BRIEFING_CHANNEL` `LANGUAGES` | `Saathi` / `whatsapp` / `hi,en` | |
| `CALL_BUDGET_MINUTES_DAILY` `MAX_CALL_SECONDS` | `15` / `180` | |
| `BOLNA_API_KEY` `BOLNA_AGENT_ID` `WHATSAPP_TOKEN` … `RESEND_API_KEY` `SMTP_*` `DATABASE_URL` | | empty |

Four secrets must all be different. Public hosts have no `dev-*` fallbacks. Do not add a Vercel Cron job.

`DATABASE_URL` empty is correct for Step 2: PGlite + EXAMPLE seed. Postgres is Step 5.

### Project 2 — landing (waitlist only)

| Vercel setting | Value |
| --- | --- |
| Root directory | `landing` |
| What it serves | Marketing page, waitlist, privacy/terms |
| After deploy | Open `https://<landing-host>/` |

Env: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` only if the waitlist table exists; otherwise leave them empty (form no-ops). Do not put family `SESSION_SECRET` or Bolna keys on this project.

Optional: point a landing CTA at `https://<family-host>/onboard` once both URLs exist.

### After both URLs exist

1. Re-run this file from **E**, using the family host as the base.
2. Paste failures into the log table.
3. Checklist for the click-deploy: `docs/saathi/engineering/deploy.md`.

Do not bootstrap `/ops` until family HTTPS is up **and** you have a real mail path for your own address. Desk testers keep `/d/example-kamla`.

---

## Step 3 — phone surfaces (PWA + APK)

Still mocked. No Play Store. Family origin: `https://x-navy-tau.vercel.app`

First, in the **family** Vercel project, add (Production + Preview) and Redeploy if they are missing:

| Name | Value |
| --- | --- |
| `PUBLIC_BASE_URL` | `https://x-navy-tau.vercel.app` |
| `SAATHI_APP_URL` | `https://x-navy-tau.vercel.app` |

Confirm `https://x-navy-tau.vercel.app/d/example-kamla` shows the EXAMPLE ribbon (not a Next error page). Then:

### PWA (any phone browser)

1. Open `/d/example-kamla` on the phone. Add to Home Screen.
2. From the icon: Today, History, Alerts, Settings — each survives a refresh.
3. Airplane mode: you should still get the app shell / offline copy (“WhatsApp still works”, Retry). Skip if the install is brand new and the shell is not cached yet.

### Android APK (Priyansh builds, testers sideload)

Needs JDK 21, Android SDK, `ANDROID_HOME`. Not a Play listing.

```bash
export SAATHI_APP_URL=https://x-navy-tau.vercel.app
npm run android:apk
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Sideload from Files / Drive / WhatsApp to yourself. Confirm terracotta splash, hosted desk, bundled offline page if the host is unreachable, back-on-Today (press back twice within two seconds to leave). Full install notes: `docs/saathi/engineering/android.md`.

### Landing

Keep it waitlist-only. Do not promise live calls. Optional: a CTA to `https://x-navy-tau.vercel.app/onboard` — do not import family secrets onto the landing project.

When PWA and (if you have an Android phone) APK both show EXAMPLE, go to Step 4: run A–D on those surfaces and log misses. Postgres is Step 5; do not enable cron; do not `--yes`.
