# Cursor prompt 02: land the stack, then make Saathi easy to follow

> Paste everything below into Cursor. Written Sat 17 Oct 2026 IST for repo `priyansh-x/x`. Demo due Mon 26 Oct, submission Sat 31 Oct.

---

You are continuing **Saathi**: a daily AI morning call to an Indian parent (Bolna), a WhatsApp briefing to the child, and escalation to child + neighbour. Specs live in `docs/saathi/` (product, voice, engineering). `docs/saathi/product/cursor_design_brief.md` wins on any UI conflict. Read `AGENTS.md` and `node_modules/next/dist/docs/` before touching routes.

## Where things stand
- **On `main`:** PR #1 (walkable slice + the team's full `docs/saathi/` specs, commit 244bbf9).
- **Reviewed, merged into the stack, NOT yet on `main`:** PRs #3 → #4 → #5 were merged (merge commits) into `cursor/saathi-phase-1-cbc6`. That branch is open as **PR #2** and now holds Phase 1–4: family desk at `/d/[token]` (Today/History/Alerts/Alert detail/Call detail/Settings), PGlite/Supabase data layer with EXAMPLE seed (Kamla Sharma / Rohit / Sunita ji), mock Bolna tools + webhook + cron tick, mock WhatsApp briefing + first-ack-wins, missed-call ladder, consent gate, delete, kill switch, one outbound gate (`src/lib/outbound.ts`).
- **PR #2 has merge conflicts with `main`**: add/add conflicts in `docs/saathi/*` (main has the team's full spec files; the branch has its own copies).

### Task 0 (do first, one small PR or a push to PR #2)
Merge `main` into `cursor/saathi-phase-1-cbc6`. For every file under `docs/saathi/`, **keep main's version** (the team's originals, incl. wireframe PNGs). Keep the branch's version of everything else. Run `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`; all must pass. Then tell Priyansh PR #2 is ready to merge. Do not merge it yourself.

## UI/UX fixes (Saathi Product to refine)
*Product's own fix list is pending. When it lands in `docs/saathi/product/`, it overrides this section. These come from the engineering review of the merged code.*

The core problem: the desk shows a lot but doesn't tell Rohit **what's going on and what to do**. Too many same-weight cards, jargon, half-translated Hindi, and a Settings page that is really a dev console. Fix in this order. Check every screen at **390 px width**.

1. **Today = one answer in 3 seconds** (`src/app/d/[token]/page.tsx`)
   - Top card: status word + icon (Good ✓ / Needs a look ! / Act now ⚠), one plain sentence ("Maa answered at 8:32 IST and took her morning medicines."), and the time of the *actual* call, not the scheduled `call_time`.
   - Medicines collapse into **one** card with a checklist (row per dose: name, dose, Taken ✓ / Not taken – / Not sure ? / Not asked yet ·), not one card per dose.
   - Mood quote in one card with the caption. Hide rows that have no data. Don't show empty boxes.
   - **One** primary button: "Call Maa" (`tel:`). "See today's call" becomes a text link, not a second full-width button.
   - Acceptance: the status, sentence and primary button all fit above the fold at 390×844. No ISO dates, no raw enum values.
2. **Missed-call ladder in plain words.** Replace `T / +10 · missed / escalated` with a vertical timeline: "8:30 Called, no answer", "8:40 Calling again", … "9:30 Asking Sunita ji to check". Future steps greyed with their planned time. Translate every step. Drop the word "ladder"/"सीढ़ी" from the UI.
3. **Header stack is too tall.** EXAMPLE ribbon + red banner + top bar + status card push content down (`src/components/family/chrome.tsx`). Make EXAMPLE a small pill in the top bar. Keep the red Act-now banner on other tabs, but on Today the status card *is* the alert, so don't render it twice.
4. **Settings is a dev console** (`src/app/d/[token]/settings/page.tsx`, 220 lines). Split it: family Settings shows only Maa's details, call time, neighbour, pause, consent status, "Delete our data" (with a confirm step). Move mock Bolna/WhatsApp scenarios, outbound log, mock ack and the kill-switch notice to `/demo/controls`, which only renders when mock mode is on and is clearly labelled EXAMPLE. Rewrite copy like "Pause writes to the household" / "रोक डेटाबेस में लिखी जाती है" into plain words ("Saathi won't call Maa until you turn this back on.").
5. **Hindi/English toggle working everywhere.**
   - Move every inline `lang === "hi" ? … : …` string (Today, Settings, chrome, ExpiredLink, LoadingState, alert/call pages) into `src/lib/i18n/messages.ts`. Add a test that `en` and `hi` have the same keys.
   - Set `<html lang>` to `hi` or `en`. Apply `font-devanagari` + line-height 1.6 to the whole page in Hindi, not just the quote.
   - Remember the choice (cookie) so it doesn't depend on `?lang=` surviving every link. Toggle must keep the current page.
   - Acceptance: switch to हिं on every screen, and no English is left except names and numbers.
6. **Navigation.** Tab bar fixed to the bottom with safe-area padding, labels ≥13 px, `aria-current="page"`, Alerts tab shows a count badge when something is open. Call detail and Alert detail get a back link ("← Today"). Content gets bottom padding so the tab bar never covers the last button.
7. **Alerts.** Alert detail order: her quote and time → who was told → who said "I'm going" (acknowledged) → "She's confirmed OK" (resolved) button. Acknowledged and resolved look different. The Alerts list shows open first, with plain status words.
8. **History.** 7/30-day calendar with a dot per day (call + meds) and labelled cells (`aria-label="Mon 12 Oct: answered, all medicines taken"`). Mood strip has the caption. No streaks, no guilt copy. Empty state: "Saathi's first call will show here."
9. **States and basics on every screen:** empty, loading, error (+ Retry). Touch targets ≥44 px (primary 48 px full width). Body ≥16 px. Colour is never the only signal. No horizontal scroll at 200% zoom. Times carry "IST".
10. **Onboarding** (`src/app/onboard/page.tsx`): one question per step with a progress line, plain consent copy, all inputs ≥44 px.

## Remaining work (current phase → next phase)
Phases 1–4 exist in mock form. To reach the 26 Oct demo:
- **Real Bolna (behind flags):** sync `scripts/bolna/agent.json` with `docs/saathi/voice/system_prompt_bolna.md` + `tools_schema.md`. One real test call to an allowlisted number, only when Priyansh says go. Verify the webhook updates Today within 10 s.
- **Real WhatsApp:** template submission per `whatsapp_templates.md`, webhook signature check (`X-Hub-Signature-256`), briefing + alert + neighbour quick replies end to end on allowlisted numbers only.
- **Escalation demo script:** a single `/demo/controls` flow that walks staged red flag → alert → neighbour "I'm going" → resolve, and missed call → ladder → neighbour, all in mock by default.
- **Pilot readiness:** consent recorded before any real call, delete really deletes, kill switch tested, daily budget cap tested, a short `docs/runbook.md`.

## Code-quality follow-ups from review
- Add CI (GitHub Actions): lint, `tsc --noEmit`, `npm test`, `next build`. Currently no checks run on PRs.
- `config.ts` falls back to `dev-cron` / `dev-tool-token` / `dev-wa-verify` when mock mode is on. Refuse to start with `MOCK_*=0` unless the real secrets are set.
- `gateOutbound` lets any number through in mock mode. Fine for mocks, but add a test proving that a non-allowlisted number can never reach `fetch` when `MOCK_*=0`.
- Email fallback (`whatsapp/send.ts`) sends to the first `ALLOWED_EMAILS` entry instead of the family's address.
- Day matching uses `started_at like 'YYYY-MM-DD%'`. Use real timestamps / IST date ranges. The mock call start is hard-coded to 08:30.
- Settings `actor` defaults to "Rohit". Use the real child record.
- Remove the unused `cn` npm dependency.

## Hard rules (unchanged)
- Nothing reaches a real person without Priyansh's explicit go-ahead. Every call, WhatsApp, SMS or email goes through `gateOutbound` and the `ALLOWED_PHONE_NUMBERS` / `ALLOWED_EMAILS` allowlist. Nothing dials or sends automatically on deploy. Cron is manual/authenticated only.
- Bolna and WhatsApp are mocked in dev by default (`MOCK_BOLNA=1`, `MOCK_WHATSAPP=1`).
- No secrets in the repo. `.env.example` has names only.
- Companionship and reminders, **never diagnosis**. No medical claims in copy, summaries or mood.
- No invented data presented as real. Seed data stays fictional and visibly labelled **EXAMPLE**.
- Small PRs, one concern each. Every PR has a test plan and **screenshots at 390 px** (EN and हिं) for any UI change. Don't merge your own PRs. Ask Priyansh when something isn't covered here.
