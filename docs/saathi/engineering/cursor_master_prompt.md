# Cursor master prompt: Saathi, next build phases

> Paste everything below this line into Cursor. Written Sat 17 Oct 2026 IST for repo `priyansh-x/x`, PR #1 branch `cursor/walkable-check-in-cbc6`.
> Before pasting, copy these team specs into the repo under `docs/saathi/`: `product/` (ux_spec, dashboard_spec, whatsapp_templates, cursor_design_brief, wireframes PNGs, open_questions), `voice/` (persona, system_prompt_bolna, red_flags, tools_schema, test_scripts, voice_selection), and `engineering/bolna_api_notes.md` + `credits_budget.md`.

---

You are building **Saathi** (working name; keep it, and keep it easy to rename) for the Bolna x YC Voice AI Buildathon. Submission is **Sat 31 Oct 2026**. A working end-to-end demo is due **Mon 26 Oct**. Priyansh Joshi decides everything; ask him whenever a choice isn't covered here.

## Product in four lines
- Saathi phones an Indian parent every morning on the phone they already own, in Hindi or English, for 2–5 minutes.
- It chats warmly, remembers past calls, asks about each medicine and logs it, and listens for red flags (fall, chest pain, confusion, low mood).
- The child (often in another city) gets a short WhatsApp briefing. A red flag or a missed call escalates to the child **and** one neighbour.
- It is companionship and reminders, **never** diagnosis. The parent never installs anything.

**Demo goal (26 Oct):** (1) a real Bolna call, (2) a WhatsApp briefing arriving on the child's phone, (3) a staged red flag firing an alert, (4) a missed call escalating to child + neighbour.

**Defaults from Product (pending Priyansh's sign-off; keep each behind a config value so it's easy to change):** WhatsApp-first, with a thin **no-login** web view for the family (magic link); the simplest neighbour flow (opt-in YES + one alert with 2 quick replies + an ack broadcast); Hindi + English first; name "Saathi".

## Critique of PR #1: what to keep, what to replace
The PR is a tidy, walkable slice, but it reads as a **marketing site with a simulator attached**, not a product.
- **Wrong main surface.** `src/app/page.tsx` is a landing page (stats, "How it works"), and `src/components/site-header.tsx` brands it "Morning call" with marketing nav. The family view (`src/app/family/page.tsx`) is buried. Its week strip shows raw ISO dates (`item.endedAt.slice(0, 10)`), and it has no medicines checklist, no quotes, no call detail, no alert ack trail and no history.
- **Off-brief styling.** `src/app/layout.tsx` loads Figtree + Fraunces serif headings + Geist Mono. `src/lib/outcomes.ts` uses SHOUTY labels ("EMERGENCY") and hard-coded `oklch` classes instead of tokens. Buttons are `h-10` (40 px) and the selects in `src/app/onboard/page.tsx` are `h-8` (32 px), both under the 44 px target.
- **No real data.** `src/lib/storage.ts`/`store.ts` keep one household in `localStorage`. `src/lib/types.ts` (`medicines: string`, `flags[]`, no Hindi-English `Language`, no alert/dose/attempt types) doesn't match `voice/tools_schema.md`. `docs/architecture.md` forbids Postgres; update it.
- **Mocked voice.** `/call` is a browser `speechSynthesis` script (`src/lib/speak.ts`, `src/lib/script.ts`) whose missed path retries once after 15 min, not the product ladder. `.env.example` has only Bolna + WhatsApp placeholders.
- **Inconsistent demo data.** `src/lib/demo-household.ts` ("Kamala Iyer", Coimbatore, Hindi call) doesn't match the product fixture (Kamla Sharma / Rohit / neighbour Sunita ji, in `voice/test_scripts.md` and `product/whatsapp_templates.md`).

**Keep:** Next.js 16 + Tailwind v4 + shadcn/base-ui setup, `src/components/ui/*`, Noto Sans Devanagari loading, the onboarding validation and consent copy, the pause toggle, the existing empty states, the "fictional only" labelling, and the scripted call (move it to `/demo/call` as an offline fallback for judges).
**Replace:** the landing-first IA, the fonts and colour tokens, localStorage as the source of truth, the outcome badge styling, and the header/footer shell.

`AGENTS.md` warns that this Next.js version differs from your training data. Read `node_modules/next/dist/docs/` before writing routes, route handlers or cron code.

## UI/UX direction (from Saathi Product)
*Source: `docs/saathi/product/cursor_design_brief.md` (wins on conflicts), with detail from `dashboard_spec.md`, `ux_spec.md` and the wireframe PNGs. Product may refine this section.*

**Product, not landing page**
- The core experience is a **mobile-first family web view opened from a WhatsApp link, no login** (`/d/[token]`). Any marketing page is secondary: one screen, one CTA ("Set up a call for Maa").
- Design for a child aged 25–45, on a phone, often abroad, anxious and short on time. They should understand today **in under 3 seconds**.
- Build order: **Today → History → Call detail → Alert detail → Settings (read-only) → Onboarding form.** Bottom tab bar: Today / History / Alerts / Settings, icon + label always.

**Status: three levels only.** **Good** (calm green), **Needs a look** (amber), **Act now** (red, pinned above everything and on every tab until resolved). Map the PRD outcomes: OK→Good, Watch→Needs a look, Emergency→Act now. Missed starts as Needs a look and becomes Act now when the ladder escalates.

**Screens**
- **Today:** one status card on top; then rows for call answered, meds taken/missed (per dose: Taken ✓ / Not taken – / Not sure ? / Not asked yet ·), and mood **in her own words** (a quoted line, never a diagnosis). One clear next action, e.g. "Call Maa" as a `tel:` link with her number shown.
- **Missed-call ladder state:** a live timeline of retries (T, +10, +25, +45) and when the neighbour gets asked.
- **Alert detail:** her quote, the time, who was notified, who replied "I'm going", and a Resolve button. Keep **"someone is on it" (acknowledged)** separate from **"she's confirmed OK" (resolved)**.
- **History:** a 7/30-day calendar with a dot per day for call and meds, plus a simple mood dot strip. **No streaks, no guilt copy.** Caption the mood strip: "Saathi's rough read of how Maa sounded… Not a medical assessment."
- **Call detail:** short summary, meds checklist, transcript (collapsed), and audio **only if she consented to recording**.

**Visual rules**
- Warm and calm, not clinical, not startup-neon. Background `#FBF7F2`, ink `#1F1B16`, one accent: dark saffron/terracotta `#B0532A` (white text passes AA; never the lighter `#C4622D` under text). Status tokens from dashboard_spec: good `#276B43` on `#E3F1E7`, amber text `#7A4F0E` on `#FCEFD6` (`#B7791F` for icons/borders only), alert `#B23A2A`, muted `#D9CFC2`.
- Type: Inter (or similar sans) + **Noto Sans Devanagari** for Hindi. Body ≥16 px, line-height 1.5 (1.6 for Hindi, because matras need room), tabular numbers.
- Cards: 16 px radius, very light shadow, lots of whitespace, **one main action per screen**. Single column 360–430 px, 16 px side padding, 12 px gaps, max width 480 px centred on desktop.
- Lucide line icons. No stock photos of old people, no gradients, no emoji clutter. Motion ≤150 ms fade, and respect `prefers-reduced-motion`.
- Every screen has **empty, loading and error** states (e.g. "Couldn't load. Your WhatsApp updates still work." + Retry).
- **i18n from day one:** EN / हिं toggle, all strings in message files. Times always carry a zone label (IST, plus the viewer's zone when different).
- Accessibility: WCAG AA contrast; **colour is never the only signal** (icon + word); touch targets ≥44 px (primary buttons full-width 48 px); usable at 200% zoom with no horizontal scroll; `aria-label`s on calendar cells.
- Tech: Next.js + Tailwind + shadcn/ui, with **one design-token file** (colours, spacing, radius). Build against **seeded fake data first, clearly labelled "EXAMPLE"**.

## Phases (each is its own small PR)

### Phase 1: Product-feel redesign + real data model (target 19 Oct)
- Supabase Postgres via server-only route handlers (keep the stack small; no separate FastAPI service unless Priyansh asks). Tables: `parents, contacts, medicines, schedules, calls, call_attempts, dose_logs, alerts, alert_events, memory_notes, consents, outbound_messages, webhook_events`. Add SQL migrations and a seed script.
- Seed the product fixture (Kamla Sharma, Rohit, Sunita ji, meds from `test_scripts.md`) across 30 days with good/attention/missed/alert days. Every seeded row has `is_example=true`, and the UI shows an "EXAMPLE DATA" ribbon.
- Rebuild the screens in brief order under `/d/[token]` (signed random token, 7-day expiry). Shrink `/` to one screen with one CTA. Move the simulator to `/demo/call`.
- **Acceptance:** all six screens render from the DB at 375 px and at 200% zoom; each has empty/loading/error states; the Act-now banner pins across tabs; EN/हिं toggle works; the Lighthouse a11y score is ≥95 on Today; no localStorage source of truth remains.

### Phase 2: Bolna integration (target 22 Oct)
- Agent config as code (`scripts/bolna/agent.json` + a sync script) from `voice/system_prompt_bolna.md`, `persona.md` and `red_flags.md`. Use `POST /v2/agent` (expect **201**, read `state`), `PUT` to change tools, `PATCH` for the prompt/webhook. Pipelines are an array of arrays. Sarvam `saaras:v4` + `bulbul:v4-flash`, language `"hi"` (not `hi-IN`), synth `provider_config.language` set. Turn on `call_summary_enabled`. Set `calling_guardrails` to cover the family's call time. Language switching (Product decision): follow Bolna's guidance (notes §3). Configure languages through Bolna's native multilingual settings, and remove the language-switch rules from the prompt, keeping one line only: "Reply in the language the parent is speaking; Hindi in Devanagari, English words in Latin script." `voice/persona.md` rules on switching are design intent, not prompt text.
- `POST /call` with `user_data` = the prompt variables + `parent_id` + `timezone:"Asia/Kolkata"` + `last_call_summary` (last highlights + follow-ups + open memory notes, ≤800 chars, only doses due today). **Trial account: omit `from_phone_number`; dial Verified Numbers only.**
- Four mid-call tools from `tools_schema.md` §1–4: `log_medicine`, `raise_alert`, `relay_message_to_family`, `save_memory_note`. Each endpoint checks the Bearer `api_token`, replies in <300 ms with small JSON, does slow work async, and is idempotent on `call_sid` + a natural key.
- Post-call webhook: store every delivery, **process only on `status: "completed"`**, idempotent on execution `id`, require `conversation_duration > 0` and a `user:` line (otherwise `no_conversation`). Map back via `context_details.recipient_data.parent_id`. Create extractions via `POST /dispositions/` exactly per `tools_schema.md` §5; mark Low confidence as "needs human check".
- **Late-alert backstop:** if `extracted_data` shows an EMERGENCY/URGENT red flag with no matching `raise_alert` in the execution's `tool_call_logs`, send the alert now with `late=true` / `source=extraction_late`. Use a unique key (call_sid, category) so it **never duplicates** a mid-call alert.
- **Own daily scheduler** (Bolna scheduled calls and batches are one-shot): a cron-hit `/api/cron/tick` that places today's calls. All timestamps use `+05:30` offsets, **never `Z`**.
- **Verify on trial first** (write the results into `docs/saathi/bolna_api_notes.md`): POST tool `param` sent as a JSON body vs a query string (webhook.site); tool timeout and failure behaviour; whether `execution_id` substitutes into tool params; whether `user_data` substitutes into per-language prompts; whether the single-call `scheduled_at` lead time/rounding rule applies; the Verified Numbers cap and any trial per-call limit; whether webhooks fire per retry attempt; and for extractions: **(a)** can a question use call variables, **(b)** can one objective question return multiple values, **(c)** do text answers keep the requested line format (keep the parser tolerant either way).
- **Acceptance:** a call to Priyansh's verified number logs doses + a memory note; a staged chest-pain line creates an alert mid-call; replaying the same webhook 3× creates one call record; deleting the tool row and replaying triggers exactly one late alert; there's a mock Bolna mode for tests.

### Phase 3: WhatsApp briefing + alerts (target 24 Oct)
- Send through the **Meta WhatsApp Cloud API test number** from our backend, using approved Utility templates from `product/whatsapp_templates.md` (`daily_briefing_*`, `safety_alert_*`, `responder_*`, `alert_ack_update`). Use `hello_world` until approval. Priyansh submits the templates (target ~21 Oct). Quick-reply webhooks drive ack/resolve; the first ack wins everywhere.
- Email fallback when the send fails or the template isn't approved yet. Log every outbound message.
- **Acceptance:** a completed call produces a briefing on the verified child number within 60 s; an alert carries her quote + time; tapping "I'm on it" updates the Alert detail and broadcasts the ack; mock mode in tests.

### Phase 4: Escalation + pilot readiness (target 26 Oct)
- Missed-call ladder: T, +10, +25 (via Bolna `retry_config`, max 3) → soft notice to child at +30 → last try +45 → neighbour + child alert at +60 if nobody acked. Timings are per-family config; busy/declined ≠ unreachable. EMERGENCY: alert child + neighbour at once (an auto voice call to the child is optional, behind a flag).
- Pilot readiness: consent capture (the child's written consent + the parent's voice "haan" with timestamp, before any real call), a recording consent flag that gates audio, data minimisation (no PII in URLs, `noindex`, no third-party analytics), "delete all of Maa's data", per-family pause, and a **global kill switch** (`SAATHI_KILL_SWITCH=1` stops all dialling and sending).
- **Acceptance:** a full demo run of all 4 demo-goal beats on verified numbers, and the kill switch halts a queued run.

## Hard rules
- **Never** place a call or send a WhatsApp/email to a number or address not in `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS`. Enforce this in one outbound gateway with a test.
- Nothing contacts a real person (pilot family, neighbour) without Priyansh's explicit go-ahead.
- No secrets in code or commits; `.env.example` lists names only.
- Companionship and reminders framing; never diagnosis or dose advice in copy or prompts.
- No invented data, quotes, users or metrics. Fake data is always labelled EXAMPLE.
- Small PRs, each with a short test plan and a list of the **env vars/accounts it needs** (e.g. P1: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MAGIC_LINK_SECRET`; P2: `BOLNA_API_KEY`, `BOLNA_AGENT_ID`, `SAATHI_TOOL_TOKEN`, `PUBLIC_BASE_URL`, `CRON_SECRET`; P3: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `EMAIL_API_KEY`; P4: `SAATHI_KILL_SWITCH`).

## Stay cheap (see `docs/saathi/credits_budget.md`)
- `MOCK_BOLNA=1` and `MOCK_WHATSAPP=1` by default in dev and tests; real sends need an explicit flag plus the allowlist.
- `CALL_BUDGET_MINUTES_DAILY` and `MAX_CALL_SECONDS` caps: refuse to dial past the cap, and stop below a wallet floor (`GET /user/me`).
- Keep test calls ≤3 min, to Priyansh's own verified number.
- Default to **Sarvam via Bolna** (included in the ~$0.06/min flat rate). Wire Deepgram/Cartesia only if sponsor credits make them free **and** Bolna supports them on our account (verify in the wallet's preferred-models list). Sponsor credit amounts are **unconfirmed; Priyansh to confirm**.
