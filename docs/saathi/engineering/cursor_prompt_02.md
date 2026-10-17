# Cursor prompt 02: make Saathi easy to follow

> Paste everything below into Cursor. Written Sat 17 Oct 2026 IST for repo `priyansh-x/x`. Demo due Mon 26 Oct, submission Sat 31 Oct.

---

You are continuing **Saathi**: a daily AI morning call to an Indian parent (Bolna), a WhatsApp briefing to the child, and escalation to child + neighbour. Specs live in `docs/saathi/` (product, voice, engineering). `docs/saathi/product/cursor_design_brief.md` wins on any UI conflict. Read `AGENTS.md` and `node_modules/next/dist/docs/` before touching routes.

## Where things stand
- **Everything is on `main`** (merge commit 1a5ba85): PRs #1-#5, i.e. Phases 1-4: family desk at `/d/[token]` (Today/History/Alerts/Alert detail/Call detail/Settings), PGlite/Supabase data layer with EXAMPLE seed (Kamla Sharma / Rohit / Sunita ji), mock Bolna tools + webhook + cron tick, mock WhatsApp briefing + first-ack-wins, missed-call ladder, consent gate, delete, kill switch, one outbound gate (`src/lib/outbound.ts`). The `docs/saathi/` conflicts were resolved in favour of the team's latest specs.

### Task 0 (do first)
Pull `main`, then run `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`. Fix anything the merge broke in a small PR before starting the UI work.

## UI/UX fixes (Saathi Product, round 1)
*From Saathi Product's review of `main` @ 1a5ba85 (`docs/saathi/product/ux_review_round1.md`, with 390×844 screenshots). This replaces the earlier engineering-only list. `cursor_design_brief.md` still wins on conflicts.*

**Goal:** an anxious child opening the link from WhatsApp understands **Today in 3 seconds**: one status card, one sentence, one primary action. Keep the IA to exactly **Today / History / Alerts / Settings**; add no new tabs. Ship as 4 small PRs in this order (A → D), each with EN + हिं screenshots at 390×844 and at 200% text.

### PR A: Today and status truth (highest priority)
Files: `src/app/d/[token]/page.tsx`, `src/lib/db/queries.ts` (`todayStatus`), `src/lib/status.ts`, `src/components/family/chrome.tsx`, `src/lib/i18n/messages.ts`.
1. **Explicit day states.** Replace `todayStatus` with: `scheduled` (no call yet, before call time + 10 min) · `trying` (missed, retries in progress) · `good` · `look` · `act` (open Act-now alert, or the missed sequence escalated) · `paused` · `skipped`. A not-yet-called day must **never** be amber. The answered time is the call's real `started_at` (+ duration), not `parent.call_time`.
2. **One status hero card** (the only big thing): icon + level word (never colour alone) + a headline built from data + a sub-line + **one** primary button chosen by state:

   | State | Chip | Headline (EN) | Headline (हिं) | Primary | Secondary (text link) |
   |---|---|---|---|---|---|
   | scheduled | grey clock "Later today" | "Today's call is at 8:30 AM IST" | "आज की कॉल सुबह 8:30 बजे (IST) है" | none (show yesterday's one-line summary) | "See yesterday" |
   | good | green ✓ "Good" | "Maa is doing well today" | "माँ आज ठीक हैं" | Call Maa | "See today's call" |
   | look | amber ! "Needs a look" | names the thing: "Maa missed her sugar tablet" | "माँ ने शुगर की गोली नहीं ली" | Call Maa | "See today's call" |
   | trying | amber ! "Needs a look" | "Trying to reach Maa: 2 tries since 8:30 AM" | "माँ से बात नहीं हो पाई: 8:30 से 2 बार कोशिश" | Call Maa | "She's OK" · "Ask Sunita ji now" |
   | act | red ⚠ "Act now" | the alert in words + her quote: "Maa said she has chest pain · 8:33 AM" | "माँ ने सीने में दर्द बताया · 8:33" | **Open alert** (→ detail) | Call Maa |
   | paused | grey ⏸ "Paused" | "Calls are paused until you turn them back on" | "आप चालू करें तब तक कॉल बंद हैं" | Resume calls | — |

   Sub-line examples: "Picked up 8:32 AM IST · 4 min" / "Sunita ji is going (9:14)" / "Nobody has replied yet". In `act`, show who's on it inside the hero.
3. **Below the hero, at most 3 cards, hiding any with no data:** "Medicines today" (**one** card, a row per dose: name as the family wrote it, morning/night, pill Taken ✓ / Not taken – / Not sure ? / Not asked yet ·, deduped by medicine + slot) → "In her words" (quote + "from today's call"; never repeat a quote already in the hero; the mood caption only here, without "…") → "This week" (7 day tiles, tap → History).
4. **Missed-call steps in plain words** inside the `trying` hero: a vertical list with clock times ("8:30 Called, no answer ✕", "8:40 Called again ✕", "**8:55 Next try**", grey "9:30 Ask Sunita ji to check"). Never show the words "ladder", "सीढ़ी", "T", "+25" or raw results.
5. **Chrome:** EXAMPLE becomes a small pill in the top bar. The top bar reads `Maa · Sat 17 Oct · Updated 8:34 AM IST` + `EN | हिं`. **Do not render the Act-now banner on Today.** On other tabs it's a one-line strip "⚠ Act now · Chest pain · 8:33 AM · Open ›", with a count if more than one alert is open.

**Acceptance (PR A):**
- At 390×844, the chip, headline, sub-line and primary button are fully visible without scrolling in every state. Seed or mock one fixture per state and screenshot each, EN + हिं.
- Exactly one filled primary button on Today.
- The alert quote appears once on Today.
- Before the call time, Today is grey "Later today", not amber.
- After the Settings→demo "Missed" scenario, Today shows `trying` with the step list, and nothing on the page says "Call answered".
- After "Good morning", there are no duplicate medicine rows.
- No ISO dates or enum words anywhere on Today.

### PR B: Alerts you can act on
Files: `src/app/d/[token]/alerts/page.tsx`, `alerts/[id]/page.tsx`, `src/lib/db/queries.ts` (`resolveAlert`), `src/lib/whatsapp/ack.ts`.
1. **List:** open alerts first, then the rest newest first. Each row: severity chip (⚠ Act now / ! Check in) + category in words ("Chest pain", "Couldn't reach Maa", "Missed medicine 2 days") + a **status pill**: Open (red outline) · "Sunita ji is going · 9:14" (amber) · "Maa is OK · Rohit 9:31" (green) · "False alarm" (grey) + friendly time. Resolved alerts never show a red chip. Only words Maa actually said go in quote marks; system events are plain text.
2. **Detail order:**
   - "← Alerts" at the top.
   - A 3-step tracker: *Alert raised → Someone is going → Maa confirmed OK* (done ✓ / current / grey).
   - Her quote + time.
   - "Who we told" (names, channel).
   - A vertical timeline in words ("9:14 Sunita ji: I'm going").
   - Actions for an open alert: **I'm on it** (primary, hidden once anyone acks) · **Maa is OK** (replaces "Resolve") · **False alarm** (text button).
   - Acknowledged = amber, resolved = green; they must look different.
3. Record the **real** actor (the token's contact) and the real time on ack/resolve. Remove the hard-coded `"Rohit"` and the 12:00 timestamp.

**Acceptance (PR B):**
- From the list, a viewer can tell open vs someone-going vs OK without opening an alert and without colour (the words are in the pill).
- Tapping I'm on it → the pill becomes "<name> is going · hh:mm" on the list, the detail, and the Today hero.
- Tapping Maa is OK → the banner disappears on every tab.
- The timeline contains no enum words.

### PR C: Navigation, History, Call detail
Files: `src/components/family/chrome.tsx`, `history/page.tsx`, `calls/[id]/page.tsx`.
1. **Tab bar:** `position: fixed` at the bottom with `padding-bottom: env(safe-area-inset-bottom)`. Content gets `pb-24` so nothing hides under it. Icon + label ≥13 px. The active tab has `aria-current="page"`, a bold label and a 2 px top indicator (not colour only). Alerts shows a numeric badge when alerts are open.
2. **Back links:** every detail page has a 44 px "← Today / History / Alerts" at top-left, returning to the tab you came from.
3. **History:**
   - A summary line first ("Answered 6 of 7 calls · 12 of 14 medicines").
   - The calendar has Mon–Sun headers, month labels, and the date at ≥13 px.
   - Each cell shows a call glyph (✓ filled answered / ✕ hollow missed / – skipped) plus "2/2" meds text (amber when short; count **all** medicines, not just `med_amlo`) and a small red dot on alert days.
   - A legend always visible under the grid.
   - `aria-label` per cell ("Tue 13 Oct: call answered, 2 of 2 medicines").
   - Mood is a 3-row labelled dot strip (Cheerful / Okay / Low, hollow = Not clear) from the stored mood field (**no keyword matching on quotes**), with the caption. No streaks, no guilt copy.
4. **Call detail:**
   - Header "Wed 14 Oct · 8:32 AM IST · 4 min · Hindi".
   - A "Summary" label with 3–5 bullets.
   - **One** medicines card.
   - "In her words".
   - Transcript collapsed ("Show full conversation").
   - The audio line as is.

**Acceptance (PR C):**
- On History (7 days), Call detail and Alert detail at 390×844, the tab bar sits at the bottom edge with no gap.
- On Today, the last control is fully tappable above the bar.
- A first-time viewer can read a History cell using only the on-screen legend.
- The 7↔30 toggle and EN↔हिं keep each other's query params.

### PR D: Settings for families, demo tools elsewhere, Hindi everywhere
Files: `settings/page.tsx`, new `src/app/demo/controls/page.tsx`, `src/lib/i18n/messages.ts`, `src/app/layout.tsx`, `chrome.tsx` (`ExpiredLink`, `LoadingState`).
1. **Settings shows only:**
   - Call: time in IST + your time, days, language in words ("Hindi, English"), what Saathi calls her.
   - Medicines (list + "Saathi only reminds, never changes doses").
   - Family & neighbour, with opt-in status ✓ Ready / ⏳ Waiting / ✕ Declined.
   - Pause ("Saathi won't call Maa until you turn this back on").
   - Privacy: recording consent "Yes, Maa agreed on 10 Oct", delete.
   - About: "Saathi is a companion and reminder service, not a medical or emergency service. In an emergency call 112."
   - Values are read-only, with "Change on WhatsApp" links.
2. **Delete needs a confirm step:** a sheet or second screen with plain consequences + "Yes, delete everything" (red) + Cancel. Never one tap.
3. **Move to `/demo/controls`:** the mock Bolna scenarios, the outbound log, "Pretend Rohit tapped I'm on it", "Record Maa's voice haan" and the kill-switch notice. The page renders only when `MOCK_BOLNA=1` or `MOCK_WHATSAPP=1` (404 otherwise), carries an EXAMPLE header, and Settings links to it with a small "Demo controls (EXAMPLE)" link only in mock mode.
4. **i18n:**
   - Every string moves to `messages.ts`: no inline `lang === "hi" ? …`. Add a unit test that `en` and `hi` have identical keys.
   - `<html lang>` follows the choice. Save the choice in a cookie.
   - The toggle keeps the path and all query params.
   - In Hindi, apply `font-devanagari` and line-height 1.6 to the whole page.
   - `ExpiredLink` is bilingual and says "Type LINK in your Saathi WhatsApp chat for a fresh link". Don't offer the example desk to a real token.
5. **Friendly formats everywhere:** replace `formatWhen` ISO output with "Today 8:33 AM IST" / "Wed 14 Oct, 8:33 AM IST", plus "· 11:03 PM ET (Tue)" when the viewer's zone isn't IST.

**Acceptance (PR D):**
- Settings at 390 px is ≤ 2 screens long and has no mock, log or enum content.
- Delete can't happen in one tap.
- `/demo/controls` 404s with mocks off.
- Switch to हिं on every route: no English is left except names, numbers and "Saathi".
- `grep -rn 'lang === "hi"' src/app src/components` returns nothing.
- No `YYYY-MM-DD` appears in any rendered page.

### Applies to every PR
- Tokens only from `globals.css` (no new colours). Body ≥16 px. Touch targets ≥44 px, primary buttons 48 px full width. One filled primary button per screen.
- Status is always icon + word + colour.
- Every screen has empty, loading and error states. Wrap data sections in `<Suspense>` with the existing skeletons; this also clears the "uncached data during prerendering" dev errors on History, Alerts and Settings.
- Varied EXAMPLE seed (fall, couldn't reach, missed medicine 2 days, false alarm) instead of the same chest-pain alert every week, still `is_example=true`.
- Lighthouse accessibility ≥95 on Today, History and Alert detail. No horizontal scroll at 200% text.

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
