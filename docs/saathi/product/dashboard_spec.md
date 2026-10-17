# Saathi family view ("dashboard") spec v0.1

Owner: Product (UI/UX) · Drafted Sat 17 Oct 2026 (IST) · Status: draft for Priyansh to review
Mockups: `wireframes.html` → `wireframes_*.png` (fictional EXAMPLE data).

## 1. Does the MVP even need a dashboard?

**Recommendation: WhatsApp is the product; the web view is a thin, optional "details" page opened from WhatsApp. Build 2 screens for the demo, the rest only if time allows.**

| | WhatsApp only | WhatsApp + magic-link web view (recommended) | Full dashboard app with login |
|---|---|---|---|
| Child effort | Lowest | Low (one tap from a message, no password) | High (account, password, app) |
| What it can show | 2 lines, buttons, text answers | Trends, calendar, audio, settings, alert history | Same as middle |
| Build cost (Oct 17–31) | Lowest | ~2–3 days for Today + Calendar + Call detail (estimate, assumption) | Too much |
| Demo value for judges | "It sends a message" | Visible proof of the loop: streaks, mood, alert ack trail | Same as middle |
| Risk | Settings edits by chat are error-prone; no history view | Magic-link security; one more surface to keep in sync | Adoption friction |

Why not WhatsApp-only: (1) editing medicine lists and contacts via chat is error-prone; (2) the "is this getting better or worse?" question needs a 7/30-day view; (3) call audio and an alert's ack trail don't fit in chat; (4) judges and the pitch benefit from one visual. Why not a full app: the child already lives in WhatsApp [A], and a login wall kills the "one tap from the briefing" flow.

**MVP cut (proposed):**
- **Must (demo):** S1 Today · S2 Calendar (7/30) · S4 Call detail with summary (+ audio if consented) · S5 Alert detail with ack trail.
- **Should:** S3 Mood trend (inside S2) · S6 Settings (read-only display + "change via WhatsApp" links).
- **Could (post-buildathon):** editable settings in-web, siblings management, export/share with doctor.

## 2. Access: magic link, no password
- Every briefing/alert has a URL button `https://<domain>/d/<token>`. Child can also type "link" in chat.
- Token: random, signed, single family + single recipient, **expires in 7 days** (proposal), re-issued with every message. Opening it sets a 30-day cookie on that device. "Not you? / Lost phone?" → reply STOP LINKS in chat to revoke all.
- Role from token: primary child (can edit), sibling (read + ack), neighbour (no web access, ever).
- No PII in the URL beyond the token. `noindex`, no third-party analytics scripts.
- Sensitive views (audio, transcripts) re-check the parent's recording consent flag server-side.

## 3. Information architecture

```
/d/<token>           → S1 Today (default)
  ├─ tab: Today
  ├─ tab: History    → S2 Calendar (7 | 30) + S3 Mood trend + S4 Call list → S4b Call detail
  ├─ tab: Alerts     → S5 Alerts log → S5b Alert detail (ack trail)
  └─ tab: Settings   → S6
```
Bottom tab bar, 4 items, icon + label (always both). Header: parent's address term + avatar initial ("Maa"), switcher if >1 parent (later).

## 4. Screens, components, states

Layout grid: single column, 360–430 px design width, 16 px side padding, 12 px gap between cards, cards 16 px radius, max content width 480 px on desktop (centred, so NRIs on laptops still see a phone-like column).

### S1. Today
Components, top to bottom:
1. **Header**: "Maa" + "Sat 17 Oct" + small "Updated 8:07 AM IST". Time shown in viewer's zone with label if not IST.
2. **Status hero card** (the only big thing on the page):
   - Icon chip (✅/⚠️/🔴/⏸) + one-line headline in words ("Maa is doing well today").
   - Sub-line: "Picked up at 8:04 AM · 4 min call".
   - Primary button: **Call Maa** (`tel:` link with her number). Secondary: **Send a message** (opens WhatsApp chat with a prefilled "Tell Maa: ").
3. **Medicines today** card: one row per dose: name as family wrote it, time-of-day, state pill (Taken ✓ / Not taken – / Not sure ? / Later ⏱ / Not asked yet ·). Row tap → no-op in MVP.
4. **In her words** card: 1–2 verbatim quotes from today's call with a "from today's call" label, plus a **Listen (0:42)** mini player if audio consented.
5. **This week strip**: 7 small day tiles (Mon…Sun) with call-answered state + meds ratio; tap → S2.
6. **Neighbour & contacts** mini row: "Sunita ji ✓ ready" (opt-in status). Hidden if none.
States:
- **Good** (green chip): as above.
- **Attention** (amber): headline names the thing ("Missed her sugar tablet"); medicines card highlights the row; quote card shows her reason if said.
- **Missed (ladder running)**: hero = "Trying to reach Maa: 3 tries since 8:00 AM, next try 8:45" with a live step tracker (Call 1 ✕ → Call 2 ✕ → Call 3 ✕ → You notified → Neighbour at 9:00). Buttons: **Call Maa** · **She's OK** · **Ask Sunita ji now**.
- **Alert (open)**: a red banner pinned above everything: "🔴 Maa said she fell · 9:09 AM · Sunita ji is going (9:14)". Tap → S5b. Banner persists until resolved, even on other tabs.
- **Skipped**: grey chip "No call today: Maa is at a wedding (she told us yesterday)".
- **Before today's call**: "Today's call is at 8:00 AM IST" + yesterday's summary collapsed.
- **Empty (just onboarded)**: illustration-free card: "Saathi will call Maa for the first time at 8:00 AM tomorrow. You'll get a WhatsApp right after." + checklist (✓ Maa agreed · ✓ medicines added · ○ Sunita ji hasn't replied yet [Resend]).
- **Error/offline**: "Couldn't load. Your WhatsApp updates still work." + Retry.

### S2. History: streak calendar (7 | 30 days)
- Segmented control **7 days | 30 days**.
- **Calendar grid**: 7 columns (Mon–Sun). Each day cell shows **two signals** stacked, never colour-only:
  - Call: filled circle ✓ (answered), hollow circle with ✕ (missed), dash (skipped), small red dot overlay (alert that day).
  - Meds: a tiny bar or "2/2" text under the circle; amber if < all.
- Legend under the grid (always visible).
- Summary line above: "Answered 26 of 30 calls · 54 of 60 doses" (computed; in mockups these are EXAMPLE numbers).
- **No "streak" gamification** with flames or "Don't break the streak!" copy: it would put pressure/guilt on the parent and the child [A]. Show consistency calmly ("Answered every day this week").
- Tap a day → S4b for that day's call.
States: empty (fewer than 7 days: show only days since start, greyed future days); all-missed week (no special drama; headline states plainly "Maa answered 2 of 7 calls this week" + link to settings "Try a different call time?").

### S3. Mood trend (inside History, below calendar)
- 7/30-day **dot strip**, not a line chart with a y-axis: each day a face-free dot in 3 levels (Cheerful / Okay / Low) + "Not clear" (hollow). Labels in words on the left. Avoid emoji faces (patronising, and mood is our rough read, not a measurement).
- Caption, always: "Saathi's rough read of how Maa sounded, from what she said. Not a medical assessment."
- Below: "Things she mentioned" chips aggregated from WATCH flags (Knee pain ×3, Poor sleep ×2, Missing family ×1), each tap → filtered call list.

### S4. Call history + S4b Call detail
- **List rows**: date + time · status icon · 1-line summary ("Cheerful, both tablets, knee better") · duration · 🎧 if audio. Missed attempts collapsed into one row ("Missed · 4 tries · reached at 8:46").
- **Detail**: header (date, time, duration, language) → **Summary** (3–5 bullets, generated, labelled "summary") → **Medicines** (per dose state) → **In her words** (quotes) → **Audio player** (play/pause 48 px, scrubber, 1x/1.25x speed, download hidden in MVP) → **Transcript** collapsed by default ("Show full conversation") → **Flags** (WATCH/URGENT chips with link to alert).
- Audio absent states: "Maa preferred not to be recorded. Here's the summary." / "Audio is being processed."

### S5. Alerts log + S5b Alert detail
- **List**: newest first; each row: severity chip (🔴 Act now / ⚠️ Check in), category in words ("Fall", "Couldn't reach", "Missed medicine 2 days"), time, **ack status pill**: Open (red outline) · Acknowledged by Sunita ji 9:14 (amber) · Resolved by Rohit 9:31 (green) · False alarm (grey).
- **Detail = timeline** (vertical): 9:09 Alert raised, quote → 9:09 WhatsApp to Rohit, Priya, Sunita ji → 9:09 Voice call to Rohit (no answer) → 9:14 Sunita ji: "I'm going" → 9:31 Sunita ji: "She's OK" → resolved. Each step with icon + who + time (viewer's zone).
- Actions on an open alert: **I'm on it** · **She's OK** · **False alarm** (same as WhatsApp buttons; whichever is used first wins everywhere).
- Empty state: "No alerts so far. Saathi will message you and Sunita ji right away if something comes up."

### S6. Settings
Sections (MVP: show values with an **Edit** that either opens an inline form or deep-links to the WhatsApp chat with a prefilled message):
1. **Call**: time (time picker, IST + your local time shown), days (all/weekdays), language(s), voice (female/male), what Saathi calls her ("Maa").
2. **Medicines**: list (name as you say it · morning/afternoon/night · food note); add / remove; "Saathi only reminds, never changes doses" note.
3. **Family & neighbour**: contacts with role (primary/sibling/neighbour), opt-in status (✓ Ready / ⏳ Waiting for YES / ✕ Declined), daily briefing on/off per sibling, [Resend invite].
4. **Escalation**: missed-call ladder preview (editable: "Message neighbour after 1 hour of no answer" on/off; wait time 30/60/90 min); quiet hours for daily updates (alerts always come through).
5. **Privacy**: recording consent status (from Maa's intro call, with date), "Delete all of Maa's data", "Pause calls".
6. **About**: "Saathi is a companion and reminder service, not a medical or emergency service. In an emergency call 112."

## 5. Visual direction: warm, calm, not clinical
- **Mood**: a letter from home, not a hospital chart. Warm paper backgrounds, soft cards, plain words, generous spacing. No ECG lines, red crosses, hospital blue, stock photos of sad elders, or "monitoring" language.
- **Palette** (tokens; contrast ratios computed with the WCAG formula on 17 Oct; re-check in build):

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FBF6EE` | page (warm cream) |
| `--card` | `#FFFFFF` | cards |
| `--ink` | `#2E2A26` | primary text (≈ 13:1 on bg) |
| `--ink-2` | `#6B6158` | secondary text (≈ 5.6:1 on bg, AA) |
| `--brand` | `#B0532A` | terracotta/marigold: primary buttons, links (white text on it ≈ 5.1:1; the lighter `#C4622D` only reaches ≈ 4.1:1, so don't use it under text) |
| `--good` | `#276B43` | taken / answered (leaf green; ≈ 5.5:1 on its pale fill `#E3F1E7`) |
| `--attn` | `#B7791F` | attention (turmeric amber) for icons/borders only (≈ 3.4:1, fails for text); amber text uses `#7A4F0E` on `#FCEFD6` (≈ 6.3:1) |
| `--alert` | `#B23A2A` | act now (brick red, used sparingly; ≈ 5.5:1 on bg) |
| `--muted` | `#D9CFC2` | borders, skipped/no-data |
- **Type**: system stack with Indian-script coverage: `"Noto Sans", "Noto Sans Devanagari", system-ui, sans-serif` (Noto covers Hindi, Kannada, Tamil, etc.; load only needed subsets). Sizes: body 16 px (never below 14), hero headline 22 px/600, card titles 15 px/600 uppercase-free, numbers tabular. Hindi line-height 1.6 (matras need room).
- **Iconography**: rounded 2 px line icons (e.g. Lucide/Phosphor style): phone, pill, sun/moon for time of day, house for neighbour, bell for alerts. Status always **icon + shape + word**: ✓ filled circle, ✕ hollow circle, – dash, ! triangle.
- **Tone of copy**: first name / address term ("Maa"), past tense facts, verbatim quotes in quotation marks, no exclamation marks except celebrations (first call done).
- **Motion**: none needed; at most a 150 ms fade. Respect `prefers-reduced-motion`.

## 6. Accessibility & performance
- WCAG 2.1 AA contrast; status never colour-only (icons + text + pattern for colour-blind users).
- Tap targets ≥ 44×44 px; primary buttons full-width 48 px tall.
- Calendar cells have `aria-label` ("Tuesday 13 October: call answered, 2 of 2 medicines").
- Language toggle EN/हिं on every page (child's choice saved); dates/times localised; Hindi numerals not required (Western digits are standard on phones).
- Works at 200% text zoom without horizontal scroll.
- Audio player keyboard/screen-reader operable; transcript as the text alternative.
- Budget: first load < 150 KB, works on 3G and low-end Android, server-rendered HTML (no SPA required), cached last view offline.
- Time zones: all times shown in viewer's zone **with label**, IST shown alongside when different ("8:04 AM IST · 10:34 PM ET, Fri").

## 7. Data the view needs (for Engineering; maps to tables in plan.md M0)
`parents` (name, address_term, phone, language, call_time, consent flags) · `medicines` (name, slot) · `calls` (started_at, status, attempts[], duration, mood, summary, quotes[], audio_url, transcript) · `dose_logs` (call_id, medicine_id, state) · `alerts` (severity, category, quote, created_at, events[] with actor/action/time, status) · `contacts` (role, phone, optin_status, briefing_on, tz, quiet_hours).
