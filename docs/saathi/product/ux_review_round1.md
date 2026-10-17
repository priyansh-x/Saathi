# Saathi family view: UX review, round 1

Owner: Product (UI/UX) · Sat 17 Oct 2026, ~12:30 PM IST · Reviewed: `priyansh-x/x` `main` after merge 1a5ba85 (PRs #1–#5). The app code on `main` is the same as the Phase 4 branch tip `f0a2bbc`; `main` only adds `docs/saathi/*`.
Why this review: Priyansh says the shipped UI "still feels tough to follow". That is the only feedback here. Nothing below is user research; every problem comes from the screenshots and code cited.

**How I checked.** `git clone` over https failed because the repo is private (no credentials on the box, and I did not use any). So I rebuilt the source tree read-only in `/tmp/saathi-x`, file by file, with the GitHub MCP `get_file_contents` (everything under `src/` plus the configs). Then I ran `npm install && next dev` with `MOCK_BOLNA=1 MOCK_WHATSAPP=1` on the seeded EXAMPLE household (`/d/example-kamla`) and took screenshots with Playwright at 390×844, 2× DPR, with the Next.js dev badge hidden. I made two state screenshots by tapping the Settings mock buttons ("Missed-call ladder", then "Good morning"). That changed only the local PGlite DB on the box. Nothing was pushed, commented or merged.

Screenshots (`/workspace/saathi/product/`): `shipped_landing`, `shipped_onboard(_full)`, `shipped_demo_call`, `shipped_today(_full)`, `shipped_today_hi`, `shipped_today_zoom200`, `shipped_today_missed`, `shipped_today_after_good(_full)`, `shipped_history_7`, `shipped_history_30`, `shipped_alerts(_full)`, `shipped_alert_detail_open`, `shipped_alert_detail_missed`, `shipped_alert_detail_resolved`, `shipped_call_detail`, `shipped_settings(_full)`, `shipped_settings_hi(_full)`, `shipped_expired` (all `.png`). Unless named `_full`, a screenshot shows the first screen (above the fold).

---

## 1. What's shipped, per route

| Route | What it shows today | Matches spec? |
|---|---|---|
| `/` (`src/app/page.tsx`) | One screen: headline, "Set up a call for Maa" (primary), "Open Rohit's example desk", "Hear a practice call". | ✅ Close to brief (one CTA). |
| `/onboard` (`src/app/onboard/page.tsx`) | One long form (≈1,600 px): you, your parent, call time, medicines textarea, neighbour, consent checkbox, "Save and open family desk". Contains dev-ish copy ("Hindi is the voice we ship first; English sits under every line"). | ⚠️ Works, but long; copy is internal. |
| `/demo/call` | Scripted offline call for judges. | ✅ (out of scope here) |
| `/d/[token]` Today (`src/app/d/[token]/page.tsx`) | EXAMPLE ribbon → red "Act now" banner with quote → "Saathi" top bar + हिं → status card (scheduled time, level word, "Saathi spoke with Kamla.") → "Call answered 08:30 IST" card → one card **per medicine** → quote card with mood caption → "Call Maa · 98100 22118" → "Call detail" (second full-width button, partly under the tab bar). | ❌ Many same-weight cards; no answer in words; alert shown twice. |
| `/d/[token]/history` | 7 / 30 toggle; grid of day tiles showing `DD` + two 10 px glyphs (`● ○`); caption; a strip of coloured dots. No weekday header, legend, month or summary line. | ❌ Not readable without a legend. |
| `/d/[token]/alerts` | Newest-first list; **every** row has a red "Act now" chip (resolved ones too); her quote (or a system sentence in quote marks); ISO time. | ❌ Can't tell open from done. |
| `/d/[token]/alerts/[id]` | ISO time, quote as H1, "Notified: …", "Someone is on it — Rohit" / "Nobody has said they are going.", "Not confirmed OK yet.", raw event log (`… · acked · Rohit · I'm going`), "I'm on it" (primary), "Resolve", "Back" (→ list). | ⚠️ The data is right; the hierarchy and words aren't. |
| `/d/[token]/calls/[id]` | ISO time, summary sentence as H1, one card per dose, collapsed "Transcript", audio consent line. No back link, duration or language. | ⚠️ |
| `/d/[token]/settings` (`settings/page.tsx`, 220 lines) | Parent details (Phone, Languages `hi,en`, Call window, Neighbour), Pause, a dev hint, **5 mock-Bolna buttons**, an **Outbound (EXAMPLE)** log of 8 raw WhatsApp bodies, raw consent rows (`child_written · yes · 2026-10-10T08:00:00+05:30 · …`), "Record Maa's voice haan", **"Delete all of Maa's data" (one tap)**, "Pretend Rohit tapped I'm on it" (primary). ≈2,500 px long. | ❌ A dev console. |
| `/d/<bad>` (`ExpiredLink`) | "Link expired or unknown" + "Open example desk". English only. | ⚠️ |
| Loading / error (`chrome.tsx`, `loading.tsx`, `error.tsx`) | Skeleton + "Opening…"; error copy from spec + Retry. | ✅ exist (strings partly inline). |

What works and should stay: the warm tokens in `globals.css` (match dashboard_spec), Inter + Noto Sans Devanagari, 48 px buttons, the 4-tab IA, the EXAMPLE labelling, the acknowledged vs resolved data model, the consent-gated audio copy, and no horizontal scroll at 390 px or at 200% text.

---

## 2. Top usability problems, ranked by severity

Severity: **P0** = an anxious child gets the wrong idea or takes the wrong action · **P1** = slows them down or confuses them · **P2** = polish/consistency.

### 1. P0: Today doesn't answer "Is Maa OK, and what should I do?"
- **Evidence:** `shipped_today.png`. The status card says only the level word ("Act now") plus "Saathi spoke with Kamla." (`page.tsx` L32–44). What happened (her quote) is in the red banner above it and again in a card below it, so the same alert appears 3 times. Nobody is shown as being on it. The only primary action is "Call Maa", whatever the state.
- **Why it confuses:** a child opening this from WhatsApp at work sees red twice and no sentence explaining it. "Act now" with no instruction raises panic but doesn't say what to do.
- **Fix:** one **status hero card** that holds the whole answer. Icon + level word + one plain-language headline built from data, a sub-line, and **one** primary action chosen by state (copy table in §3). Don't render the global Act-now banner on Today (the hero *is* the alert). Remove the quote card when the quote is already in the hero.

### 2. P0: Status logic shows the wrong level and contradictory facts
- **Evidence:**
  - (a) `queries.ts todayStatus()`: `if (!args.call) return "look"`. Every morning *before* the scheduled call, Today turns amber "Needs a look".
  - (b) `shipped_today_missed.png`: after the missed-call scenario, the banner says "No answer after the morning ladder." while the card below still says "Call answered 08:30 IST" and "Saathi spoke with Kamla."
  - (c) `shipped_today_after_good_full.png`: after a good call, Today is still "Act now" because older open alerts pin it, and Amlodipine is listed twice.
  - (d) The "answered" time is `parent.call_time` (scheduled), not the call's real start.
- **Why it confuses:** false amber every morning trains the child to ignore amber. Contradictory facts on one screen destroy trust in the whole product.
- **Fix:** add explicit states: `scheduled` (neutral grey, "Today's call is at 8:30 AM IST"), `in_progress`, `good`, `look`, `missed_trying`, `act`, `paused`, `skipped`. Show the actual `started_at` and duration. When an open alert drives `act`, the hero names *that* alert. The answered/missed row must come from the same call record as the hero. Dedupe dose rows by `medicine_id` + slot.

### 3. P0: Alerts can't be told apart, and ack vs resolve is unclear
- **Evidence:**
  - `shipped_alerts_full.png`: 9 rows, all with a red "Act now" chip, including resolved ones. `alerts/page.tsx` uses `statusLabel(alert.level)` and shows no open/acked/resolved state.
  - System events are shown in quote marks as if Maa said them ("No answer after the morning ladder.").
  - `shipped_alert_detail_open.png`: three similar-weight lines ("Notified…", "Nobody has said they are going.", "Not confirmed OK yet."), then a raw event log (`08:33 IST · notified · Saathi · Rohit and Sunita ji`), then "I'm on it" + a generic "Resolve".
  - `queries.ts resolveAlert()` writes actor `"Rohit"` and time `12:00` hard-coded, so the trail can show a time that never happened.
- **Why it confuses:** in an emergency the child needs to know at a glance: is someone going, and is she OK? "Resolve" doesn't say what it means. Red everywhere hides the one alert that matters.
- **Fix:**
  - **List:** open first, then the rest. Each row: severity chip (Act now / Check in), category in words ("Chest pain", "Couldn't reach Maa"), a status pill (Open · red outline / "Sunita ji is going · 9:14" · amber / "Maa is OK · Rohit 9:31" · green / "False alarm" · grey) and a friendly time.
  - **Detail:** a 3-step tracker *Alert raised → Someone is going → Maa confirmed OK*, then her quote (only real quotes get quote marks), then a vertical timeline in words, then actions. Rename "Resolve" to **"Maa is OK"**, add "False alarm". Record the real actor and time.

### 4. P0: Family Settings mixes destructive actions with dev tools
- **Evidence:** `shipped_settings_full.png`, `settings/page.tsx` L112–217:
  - Mock Bolna buttons, with a **filled primary "Chest-pain line"** button.
  - An "Outbound (EXAMPLE)" log of raw WhatsApp bodies (`whatsapp · daily_briefing_en · example`).
  - Raw consent strings with ISO offsets.
  - "Delete all of Maa's data" deletes on **one tap with no confirm** and redirects to `/`.
  - A primary "Pretend Rohit tapped I'm on it".
  - Copy like "Pause writes to the household".
- **Why it confuses:** the child can't find the 5 things they came for (call time, medicines, neighbour, pause, privacy), and one mis-tap wipes the family's history.
- **Fix:** Settings shows only the sections in dashboard_spec S6 (Call · Medicines · Family & neighbour · Privacy · About), read-only with "Change on WhatsApp" links. Delete becomes a 2-step confirm (type the address term or tap "Yes, delete everything"). Move all mock/demo controls, the outbound log and the kill-switch notice to `/demo/controls`, rendered only when `MOCK_*=1` and labelled EXAMPLE.

### 5. P1: Navigation feels broken on short pages
- **Evidence:**
  - `shipped_history_7.png`, `shipped_call_detail.png`, `shipped_alert_detail_open.png`: the tab bar floats mid-screen with blank space under it. `chrome.tsx` uses `sticky bottom-0` inside a column that isn't full viewport height.
  - `shipped_today.png`: the "Call detail" button sits under the tab bar.
  - Call detail has no back link. Alert detail's "Back" is a plain text link at the bottom, going to the list rather than to where you came from.
  - The active tab is shown by colour only, and the Alerts tab has no count badge.
- **Why it confuses:** a mid-screen bar looks like a bug. Detail pages feel like dead ends.
- **Fix:** `fixed` bottom bar with `env(safe-area-inset-bottom)` padding, `pb-24` on content, `aria-current="page"` plus a 2 px top indicator and bold label on the active tab, and a numeric badge on Alerts when something is open. Every detail page gets a top-left "← Today" / "← History" / "← Alerts" (44 px).

### 6. P1: The header stack eats the first screen
- **Evidence:** `shipped_today.png`: the EXAMPLE ribbon (≈44 px) + red banner (≈80 px) + "Saathi" top bar (≈70 px) take ≈200 of 844 px before any content. At 200% text (`shipped_today_zoom200.png`) the first screen is only chrome plus the level word, and the "Call Maa" button is far below. The header says "Saathi" rather than the spec's "Maa · Sat 17 Oct · Updated 8:34 AM IST".
- **Why it confuses:** the child has to scroll to find the action and doesn't know how fresh the page is.
- **Fix:** EXAMPLE becomes a small pill inside the top bar. The top bar reads "Maa" + date + "Updated hh:mm IST" + EN|हिं. The Act-now banner shows on History/Alerts/Settings only, as a one-line strip ("Act now · Chest pain · 8:33 AM · Open ›").

### 7. P1: Missed calls are shown in jargon, or not at all
- **Evidence:** `page.tsx` L53–65 renders `T · 2026-10-17 08:30 IST · missed · Neighbour is asked to knock` under the heading "Missed-call ladder" (Hindi: "छूटी कॉल की सीढ़ी"). In `shipped_today_missed.png` the missed scenario shows no timeline at all on Today (see #2b). The brief asks for a live timeline of T, +10, +25, +45 and when the neighbour gets asked.
- **Why it confuses:** "ladder", "T" and "+25" are internal words. A worried child wants "we're still trying; next try at 8:55; Sunita ji will be asked at 9:30 unless you say she's OK".
- **Fix:** in the `missed_trying` hero, a vertical step list with real clock times: done steps ✓/✕, the current step bold, future steps grey with their planned time. Actions: **Call Maa** (primary) · "She's OK" · "Ask Sunita ji now". Never show the word "ladder".

### 8. P1: History can't be read without a legend
- **Evidence:**
  - `shipped_history_30.png`: tiles show only `18`, `19`… with two 10 px glyphs (`text-[10px]`). There are no weekday headers (the grid starts on whatever day was 30 days ago), no month, no legend and no summary.
  - Meds count only `med_amlo` (hard-coded in `history/page.tsx` L53).
  - The mood strip is colour-only dots coloured by keyword matching on the quote (`"dard"`, `"phisal"` → red). That is a medical-sounding read the brief says to avoid, and it's inaccessible.
- **Why it confuses:** the child can't answer "better or worse this week?" and can't tell what a hollow dot means.
- **Fix:** a summary line on top ("Answered 6 of 7 calls · 12 of 14 medicines"). The grid has Mon–Sun headers and month labels. Each cell shows the date ≥13 px, a call glyph (✓ filled / ✕ hollow / – skipped) plus "2/2" meds text, amber when short, and a red dot only for alert days. Show a legend under the grid. Mood is a labelled 3-row dot strip (Cheerful / Okay / Low + Not clear) driven by the stored `mood` field, not keyword matching, with the caption.

### 9. P2: The Hindi toggle is half done
- **Evidence:**
  - `shipped_settings_hi_full.png`: labels still "Phone / Languages / Call window / Neighbour", the outbound bodies are English, and consent rows are raw.
  - `layout.tsx` hard-codes `<html lang="en">`.
  - The toggle link is `href="?lang=hi"`, which drops `days=7` on History.
  - ~30 inline `lang === "hi" ? … : …` strings in the pages, instead of `messages.ts`.
  - `ExpiredLink` and `LoadingState` are English only.
- **Why it confuses:** a Hindi-preferring sibling switches and still meets English at the most important places.
- **Fix:** all strings in `messages.ts`, with a test that `en` and `hi` have the same keys. `<html lang>` follows the choice, which is saved in a cookie. The toggle keeps the path and all query params. In Hindi, the whole page gets `font-devanagari` and line-height 1.6.

### 10. P2: Raw data formats everywhere
- **Evidence:**
  - ISO dates on every screen (`formatWhen` → `2026-10-17 08:33 IST`).
  - `Languages: hi,en`.
  - Enum words in the alert log (`notified`, `acked`).
  - Medicines as one card each with "Not asked yet ·" (`page.tsx` L66–81).
  - The mood caption ("Saathi's rough read of how Maa sounded… Not a medical assessment.", with a literal "…") sits under a **chest-pain** quote, which reads as dismissive.
  - No viewer-zone time for a child abroad.
- **Fix:**
  - Friendly times: "Today 8:33 AM IST" / "Wed 14 Oct, 8:33 AM IST". Add "· 11:03 PM ET (Tue)" when the viewer's zone isn't IST.
  - Languages in words.
  - One "Medicines today" card with rows and state pills.
  - The mood caption only under mood content, never under an alert quote. Fix the caption text (no ellipsis).

**Also noted (lower priority):**
- `/onboard` is one long form with internal copy. Use 4 short steps with a progress line.
- `ExpiredLink` offers a real user the "example desk". It should say "Type LINK in your Saathi WhatsApp chat to get a fresh link."
- The EXAMPLE seed repeats the same chest-pain alert every week, so Alerts looks alarming. Vary it per dashboard_spec (fall, missed medicine 2 days, couldn't reach).
- For Engineering: the dev log shows `Next.js encountered uncached data during prerendering or a navigation` on History, Alerts, Alert detail, Call detail and Settings (cacheComponents is on). This can make tab switches feel slow or blank. Wrap the data parts in `<Suspense>` with the existing skeletons.

### Engineering's list, checked
| Engineering claim | Verdict |
|---|---|
| Today has no single answer or primary action | **Confirmed** (#1, #2). It's worse than stated: the status is also wrong before the call and contradictory after a missed call. |
| Too many stacked banners | **Confirmed** (#6). ≈200 px of chrome; the alert is shown 3× on Today. |
| Settings reads like a dev console | **Confirmed**, plus the one-tap delete (#4). |
| Hindi toggle half done | **Confirmed** (#9). Today is mostly translated; Settings, the alert log, `<html lang>`, the toggle params and ExpiredLink are not. |
| Weak tab bar, no back links on detail pages | **Confirmed with nuance** (#5). Alert detail has a bottom "Back" to the list; Call detail has none. The tab bar also floats mid-screen on short pages. |

---

## 3. Ready-to-paste "UI/UX improvements" section for Cursor

The same text replaces `## UI/UX fixes (Saathi Product to refine)` in `/workspace/saathi/engineering/cursor_prompt_02.md`.

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
