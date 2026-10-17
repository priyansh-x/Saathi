# Saathi UX spec v0.1 (working name)

Owner: Product (UI/UX) · Drafted Sat 17 Oct 2026 (IST) · Status: draft for Priyansh to review
Inputs: `context.md`, `product/prd_v0_excerpt.md` (truncated at §3.4), `prd_summary.md`, `voice/persona.md`, `voice/red_flags.md`, `pitch/competitors.md`.
Companion files: `whatsapp_templates.md`, `dashboard_spec.md`, `wireframes.html` (+ `wireframes_*.png`), `open_questions.md`.

> **Ground rules for this doc.** We have **no user research yet**. Every behaviour claim about parents or children below is a design **assumption** (marked **[A]**) to be checked in the 5–10 family pilot. Population stats are quoted from the PRD's cited research, not our data. Timings (retry gaps, ack windows) are **proposed defaults**, not validated numbers. Framing everywhere: companionship and reminders, **not diagnosis**, and **not an emergency service**.

---

## 0. The product in one picture

```
            every morning, on her own phone              2 lines on WhatsApp
 PARENT  <------------- voice call (Bolna) ------------>  SAATHI  ------------------------> CHILD (buyer)
 (no app,               "Namaste Maa, dawai li?"          backend                           + siblings (optional)
  any phone)                                                 |  missed call x N / fall / red flag
                                                             +--------------------------------> NEIGHBOUR (alerts only,
                                                                                                one-tap "I'm going")
                                                       magic link from WhatsApp --> mobile web "details" view (optional)
```

The parent's whole interface is **a ringing phone**. The child's whole interface is **a WhatsApp chat** (plus an optional web page opened from it). The neighbour's whole interface is **one WhatsApp message with buttons**.

---

## 1. User types

| | **Parent** (the person cared for) | **Primary child** (buyer, admin) | **Secondary child / sibling** | **Neighbour / responder** |
|---|---|---|---|---|
| Who [A] | 60–85, often living alone or with spouse; may be rural, low/no literacy (PRD cites ~66% rural, ~85% no/primary education); often a widowed mother (PRD cites 54% of elderly women widows). Feature phone or basic Android. | 25–45, in another city or abroad (NRI). Pays. Busy, anxious, often guilty about distance. | Brother/sister/spouse who wants to know but didn't set it up. | Lives within walking distance: neighbour, relative, house help, RWA guard. Not paying, not family. |
| Channel | Inbound PSTN voice call only. | WhatsApp (primary), magic-link web view (secondary). | WhatsApp only. | WhatsApp only (fallback: SMS/voice call, later). |
| What they **see/hear** | A warm voice, same time daily, in her language; her own words reflected back ("Toh BP wali goli le li. Bahut accha."). | Daily 2-line briefing; alerts; weekly summary; optional web view (today, streaks, mood, call history, alerts, settings). | Same briefing (or alerts-only, their choice); ack status of alerts. | Nothing day to day. Only: "Kamla ji may need help, can you check?" + buttons; then "Thanks, Rohit has been told." |
| What they **do** | Pick up, talk. Can say: "aaj dawai nahi li", "Rohit ko bolo phone kare", "kal mat karna, mandir jaa rahi hoon", "phone band karo / mat karo". | Onboard; read briefing; tap "Call Maa"/"I'm on it"; reply with questions or changes in plain text; edit settings. | Read; ack alerts; reply with questions. Cannot change settings (MVP). | Opt in once ("HAAN/YES"); tap **"I'm going"** or **"Can't go now"**; optionally **"She's OK"** after visiting. |
| Never | Installs an app, presses keys, reads a text, gets scolded. | Gets a medical verdict; gets 5 messages a day on a normal day. | Gets admin power by accident. | Sees medicines, mood, transcripts, or daily data. |

---

## 2. Design principles

### 2.1 Parent: zero-UI, voice only
1. **The call is the product.** No app, no IVR keypad ("press 1"), no SMS to read, no QR code. [PRD: English UI and QR onboarding will fail for this population.]
2. **Same number, same time, same voice, every day.** Predictability builds trust and beats scam-wariness [A]. Ask the child to save the Saathi number in Maa's phone as "Saathi (Rohit)".
3. **Short and slow.** Max 2 sentences per turn, one question at a time, slow TTS, long end-of-turn silence (see `voice/persona.md` §3). Target call 2–5 min; let her talk longer if she wants.
4. **Her words, her language.** Household Hindi/Hinglish/regional, family-chosen address term ("Maa", "Kamla ji"). Times as spoken ("subah aath baje"), medicines as the family names them ("BP wali goli").
5. **Respect and control.** She can say no, skip a day, change the time, or stop entirely, by voice. Saathi always says it is an AI set up by her child (never pretends to be human or the child).
6. **No guilt, no nagging, no diagnosis.** "Bahut accha" for taken meds; a gentle note for missed ones; never "aap phir bhool gaye".
7. **Works on a bad line.** Repeat slower and simpler before anything else; a dropped call is a retry, not an alarm.

### 2.2 Primary child: WhatsApp-first, glanceable, calm
1. **Answer the real question in line 1: "Is Maa okay today?"** Status first (✅ / ⚠️ / 🔴 plus words), detail second. Two lines max on a normal day.
2. **Silence is not reassurance; a short "all good" is.** Send a briefing every day the call happens, so absence of a message never means "probably fine" [A].
3. **Calm by default, loud only when it matters.** Three visual/urgency levels only: Good day · Needs a look · Act now. Never use red or 🚨 for a missed tablet.
4. **Designed for the anxious, guilty reader [A].** No guilt copy ("Maa felt lonely, you haven't called in 4 days"). Give a **next action** instead ("Maa would love a call this evening. [Call Maa]").
5. **Time-zone aware.** Daily briefings respect the child's quiet hours (held until their morning); alerts always break through.
6. **Reply in plain words.** The chat understands "skip tomorrow", "change time to 9", "how did she sleep this week?" No command syntax required.
7. **Every message has one obvious button.** Max 3 buttons; the first is the most likely action.

### 2.3 Siblings
- Opt-in by the primary child; each sibling confirms on WhatsApp. Default: **alerts + weekly summary**, daily briefing optional. Everyone sees who acknowledged, so two siblings don't both panic or both assume the other handled it.

### 2.4 Neighbour / responder: one tap
1. **One message, one decision.** "Can you check on Kamla ji now?" → **[I'm going]** **[Can't go now]**.
2. **Minimum data.** Name, address/landmark, what was reported in plain words ("said she fell"), child's number. No medicines, mood, or transcripts (privacy; DPDP Act — needs legal check).
3. **Close the loop.** Thank them and tell them the family has been informed. Ask once "Is she OK?" → **[She's OK]** **[Needs help]**.
4. **Explicit opt-in first.** The neighbour replies YES before they can ever be alerted (WhatsApp opt-in requirement + basic decency). They can say STOP anytime.
5. **Never the only safety net.** Neighbour is notified in parallel with family, never instead of 112 in a true emergency.

---

## 3. Journeys

### J1. Child onboarding (target: under 5 minutes, done from a phone)

**Recommended for MVP: WhatsApp front door + one short web form.** Chat is great for opt-in and warmth; a form is faster and less error-prone for structured data (medicine lists, times). Full chat-only onboarding is a stretch goal (or WhatsApp Flows later).

| Step | Where | What the child does / sees | Notes |
|---|---|---|---|
| 1 | Landing page / shared link (`wa.me/<number>?text=Start`) | Taps "Set up on WhatsApp". | User-initiated message opens the 24h service window; free-form messages allowed. |
| 2 | WhatsApp | Bot: who we are, what it does, "not a medical or emergency service", consent to WhatsApp messages. Buttons: **[Set up for my parent] [How it works]** | Copy in `whatsapp_templates.md` §6. |
| 3 | WhatsApp | Bot asks only 3 things in chat: your name · parent's name + what you call them (Maa/Papa/…) · parent's phone. | Typed answers; confirm back. |
| 4 | Web form (magic link, no password) | One page, 6 fields: language(s) · call time (default 8:00 IST) · medicines (name as you'd say it + morning/afternoon/night) · neighbour (name, phone, landmark — optional but encouraged) · siblings (optional) · your quiet hours/time zone (auto from phone prefix, editable). | Large inputs, Hindi labels toggle, saves partial progress. |
| 5 | WhatsApp | Summary card: "Saathi will call Maa (Kamla ji) every day at 8:00 AM in Hindi. 2 medicines. Neighbour: Sunita ji (pending her YES)." **[Looks right] [Edit]** | |
| 6 | WhatsApp | **Prep Maa (important):** "Please tell Maa before the first call." We give a 20-second script and a **ready-to-forward voice note** in her language: "Maa, kal se ek Saathi naam ki awaaz aapko subah phone karegi, maine rakha hai…" | Biggest trust lever for an unknown-number AI call [A]. Ask child to save the number as "Saathi (Rohit)" in her phone. |
| 7 | WhatsApp → neighbour | Neighbour gets an opt-in request **sent by Saathi on the child's behalf** with the child named; must reply YES. Child sees status. | Utility template; see §5 of templates. |
| 8 | Voice | **Intro + consent call** to the parent (J2) at a time the child picks (default: within the next hour or next morning). | Child gets the outcome on WhatsApp. |

Exit: parent consented → daily calls start next scheduled slot. Parent declined → no calls; child gets a gentle note (J2 outcome).

**Consent note:** the **parent** is the person whose data (voice, health mentions) is processed; the child cannot consent for her. Consent is captured **by voice in her language on the intro call**, logged with timestamp + audio snippet. Legal check needed (DPDP Act 2023) before real launch; pilot uses this + written consent from the child.

### J2. Parent's first-ever call: introduction and consent (target 2–3 min)

Goals: (1) she knows **who** is calling and **why**, (2) she knows it's an AI set up by her child, (3) she agrees (or doesn't), (4) she knows how to stop.

Beats (Hindi lines are drafts for conversation design; final script lives in `voice/`):
1. **Greeting + who:** "Namaste Maa! Main Saathi bol rahi hoon. Rohit ne mujhe rakha hai, aapse roz subah baat karne ke liye."
2. **Check it's OK to talk:** "Abhi do minute baat kar sakte hain?" (No → "Koi baat nahi, main shaam ko phir phone karti hoon." Reschedule once; if still no, tell child.)
3. **What I am:** "Main ek computer wali awaaz hoon, AI. Insaan nahi hoon." (Never skip this.)
4. **What I'll do:** "Main roz subah aath baje phone karungi. Haal-chaal poochungi, dawai yaad dilaungi, aur Rohit ko chhota sa message bhejungi ki aap theek hain."
5. **What's shared:** "Aap jo bataengi, uska chhota sa saar Rohit ko jayega. Agar aap giri ya tabiyat bahut kharab ho, toh main Rohit aur Sunita ji ko turant bataungi." (Name the neighbour.)
6. **Ask consent (explicit yes):** "Kya main roz aapko phone kar sakti hoon?" Accept clear yes ("haan", "theek hai", "kar lo"). Ambiguous → ask once more, simpler. No → J2-decline.
7. **Recording (if family wants audio playback):** "Hum baat record karte hain taaki Rohit sun sakein. Theek hai?" No → calls not recorded/shared as audio; summaries only.
8. **Personalise lightly:** confirm time ("Subah aath baje theek hai, ya thoda baad?"), confirm what to call her.
9. **How to stop:** "Kabhi bhi mana karna ho, bas bol dijiye 'phone mat karo'."
10. **Close warmly + promise tomorrow:** "Kal subah aath baje baat karenge. Apna dhyaan rakhiye!"

Outcomes → child WhatsApp: ✅ "Maa said yes! First daily call tomorrow 8:00 AM." / ⏸ "Maa asked to talk later; we'll try at 6 PM." / ❌ "Maa wasn't comfortable with daily calls today. We won't call her. You could talk to her and try again." (no pressure copy).

Edge cases: suspicious parent ("aap kaun? OTP?") → never ask for any number/OTP; "Main kuch nahi maangti. Rohit se poochh lijiye, phir kal baat karte hain." Mark "verify with Rohit". Spouse answers → introduce to them too; ask for parent or note both (multi-parent household = open question).

### J3. Daily call (target 2–5 min; longer if she wants)

| Beat | Purpose | Data captured |
|---|---|---|
| 1. Greet by address term; "abhi baat kar sakte hain?" | Consent each day; "woke up" check | `answered`, `answered_by` |
| 2. "Aaj tabiyat kaisi hai?" + memory callback ("kal ghutne mein dard tha, aaj?") | Wellbeing, continuity | `mood` (good/okay/low/unclear), notes |
| 3. Meds one at a time ("subah wali BP ki goli le li?") | Adherence | per dose: `taken / not_taken / unsure / later` |
| 4. Listen for red flags throughout (fall, chest pain, breathlessness, confusion, low mood…) | Safety | tier per `voice/red_flags.md` |
| 5. "Rohit ko kuch bolna hai?" | Relay | `relay_message` |
| 6. Close: next call time; "dhyaan rakhiye" | Ritual | `next_call_ok` / skip requests |

Post-call (backend, within ~1 min): build the **2-line briefing** (state = good / needs-a-look / missed / alert), update dashboard, store summary (+ audio if consented). If the child is in quiet hours, hold the briefing (alerts never held).

Parent-initiated changes by voice: "kal mat karna" → skip tomorrow + tell child; "nau baje karna" → propose time change, child confirms on WhatsApp (MVP) [decision: should parent be able to change time without child? Recommend yes, child just informed].

### J4. Missed call: retry ladder and escalation timeline (proposed defaults, configurable)

Principle: **a missed call is usually nothing** (bathroom, temple, phone on silent, market) [A], so start soft, but **never let a missed day go silent**. Reference: IAmFine retries 5 times over 1 hour before alerting the care circle; Snug texts contacts 15 min after a missed check-in ([iamfine](https://dailycall.iamfine.com/), [Snug](https://www.snugsafe.com/how-snug-works-for-people-who-live-alone)).

| Time (example: scheduled 08:00 IST) | System | Child sees | Neighbour |
|---|---|---|---|
| 08:00 | Call #1 (ring ~45 s) | — | — |
| 08:10 | Call #2 | — | — |
| 08:25 | Call #3 | — | — |
| **08:30** | | **Soft notice** (not an alert): "Couldn't reach Maa yet (3 tries since 8:00). We'll try again at 8:45." **[I'll call her] [She's OK] [Ask Sunita ji]** | — |
| 08:45 | Call #4 (last auto-try) | If answered → normal briefing + "Reached Maa at 8:46 ✅" | — |
| **09:00** | Still unreachable **and** no child ack | **Escalation**: "⚠️ Still can't reach Maa (4 tries). Sunita ji is being asked to check." + Saathi **voice-calls the child** | **Neighbour alert** "[I'm going] [Can't go now]" |
| 09:15 | No ack from anyone | Siblings alerted; second voice call to child | Repeat once |
| 09:30 | Still no ack | Final message to all: "Nobody has confirmed. If you're worried, call Maa or local help. We'll keep trying Maa every 30 min until noon." | — |
| 30-min retries until 12:00 | Calls continue | Any answer/ack ends the ladder for everyone | |

Resolution: any of these stops escalation everywhere and posts a one-line "resolved" update to everyone who was notified: parent answers · child taps "She's OK"/"I'll call her" and later confirms · neighbour taps "She's OK".
- Child tapping **[She's OK]** at 08:30 = skip escalation for today (e.g. "she's at the temple"). Ask once: "Want us to try once more later?" [Yes, at 11] [No, skip today].
- **Known absences**: parent says "kal mandir/shaadi jaa rahi hoon" or child says "skip tomorrow" → no call, no escalation, briefing says "Skipped today (Maa said she's at a wedding)."
- **Busy/declined calls** (call rejected or "abhi nahi") ≠ unreachable: she's alive and chose not to talk. Retry once later; briefing says "Maa was busy; we'll try at 11."
- **Switched off / not reachable** on all tries for 2 days in a row → treat as escalation at the first ladder step.
- The ladder never calls 112. Saathi is not an emergency service; copy says so.

### J5. Fall / red-flag escalation (EMERGENCY and URGENT)

Tiers from `voice/red_flags.md`: EMERGENCY (fall with injury, chest pain, breathlessness, stroke signs, unresponsive, suicidal talk) · URGENT (fall without injury, confusion, 2+ days missed meds, fever, not eating, scam risk) · WATCH (low mood, loneliness, poor sleep → briefing only).

**EMERGENCY timeline** (T = moment `raise_alert` fires on the call):

| T | Parent (on call) | Child | Siblings | Neighbour |
|---|---|---|---|---|
| 0 | Hears emergency line in her language: call 112 / call someone nearby / "main Rohit ko abhi bata rahi hoon". Saathi stays on the line if she wants. | 🔴 WhatsApp alert with **her own words**, time, and buttons **[I'm on it] [Call Maa] [Can't reach]** + **automatic voice call** (Bolna outbound: "This is Saathi. Maa said she fell and can't get up. Please check WhatsApp.") | 🔴 Same WhatsApp alert | 🔴 "Kamla ji may need help now. She said she fell. Can you go to her? [I'm going] [Can't go now]" + address/landmark |
| +0–5 min | | First ack wins. Everyone sees: "✅ Sunita ji is going (9:14)" / "✅ Rohit is on it (9:12)". | | |
| +5 | | No ack → second voice call to child | Voice call to sibling #1 | Reminder message |
| +10 | | | Voice call to sibling #2 | Voice call to neighbour (if MVP supports it) |
| +15 | **Saathi calls the parent back** to check and repeats "112 par phone kijiye" if she answers; relays any update. | "No one has confirmed yet. Please call 112 or someone near Maa." (stays at top of dashboard as unresolved) | same | same |
| Ack received | | "Thanks. Did you reach Maa? [She's OK] [Getting help] [Couldn't reach]" | Informed of status | After "I'm going": "Thank you. Rohit knows you're on the way." then "Is she OK? [She's OK] [Needs help]" |
| Resolved | Optionally a short follow-up call next day: "Kal aap giri thi, ab kaisi hain?" | Alert closed with who/when; appears in alerts log. | | "Thank you, Sunita ji." |

Rules:
- **Ack ≠ resolved.** Two states: **acknowledged** (someone is on it) and **resolved** (someone confirmed she's OK / help arrived). The dashboard shows both.
- **Never silent, never infinite.** After +15 min with no ack, stop auto-calling (avoid spam fatigue) but keep the alert red and pinned until someone resolves it.
- **URGENT** (e.g. fall without injury): child WhatsApp alert only (no auto voice call), with **[I'll call her] [Ask Sunita ji to check]**; neighbour only if the child taps that button or doesn't ack within 2 hours [A: needs child preference].
- **Suicidal talk:** child alert copy is calm and specific ("Maa said she doesn't want to live anymore. Please call her now."), includes Tele-MANAS 14416 for the family too; neighbour is **not** told the reason, only "please check on her".
- **False alarm path:** child taps "She's OK — false alarm" → alert closed, logged, and the next call does not mention it unless the parent does.

### J6. Child replies and asks via WhatsApp

Every briefing invites a reply; a reply opens the 24h window so free-form answers are allowed (from 1 Oct 2026 these are charged beyond 1,000 free service messages/number/month — see templates §0).

| Child types | System does | Reply style |
|---|---|---|
| "How did Maa sleep this week?" | Answer from logged summaries only; no inference beyond what she said | "Maa mentioned poor sleep on 2 of the last 7 calls (Tue, Fri). Other days she didn't mention it." |
| "Tell Maa I'll call at 7 tonight" | Queue relay for next call (MVP); optional immediate short "message call" (stretch) | "Got it. I'll tell Maa on tomorrow's 8 AM call." (Be honest about timing.) |
| "Skip tomorrow, she's travelling" | Skip + no escalation | "Okay, no call on Sun 18 Oct. Calls resume Mon 8:00 AM." |
| "Change time to 9" | Update schedule; tell parent on next call | Confirm with button **[Confirm 9:00 AM]** |
| "Add medicine Ecosprin at night" | Update meds (confirm) | "Add *Ecosprin, night*? [Yes] [No]" |
| "Is she okay?" (anxious) | Latest status + time | "Last call today 8:04 AM: Maa sounded well and took both tablets." |
| "Should she take extra BP tablet?" | **Decline medical advice** | "I can't advise on medicines. Please check with her doctor. I can remind Maa about anything you and the doctor decide." |
| "link" / "dashboard" | Fresh magic link | |
| Unclear | Offer menu buttons | [Today's update] [Change settings] [Talk to a human (team)] |

### J7. Weekly summary (Sunday, child's chosen time; default 10:00 local)
- 7-day strip: calls answered ●●●●○●● and doses taken (e.g. "12 of 14 doses").
- Mood in words, not scores ("mostly cheerful; low on Thursday").
- Up to 3 notable things in her words ("Knee pain better since Wednesday", "Wants to visit Haridwar").
- One gentle next action, never guilt ("Maa mentioned you twice this week. A weekend call would make her day.").
- Button: **[See the week]** (magic link) **[Change something]**.
Rule: if the week contains numbers that look bad (e.g. 3 missed days), state them plainly, without alarm words, plus what Saathi already did.

---

## 4. Cross-cutting rules
- **Message budget (normal day):** child receives exactly **1** message (the briefing). Weekly: +1. Everything else is exception-driven.
- **Status vocabulary (used identically in WhatsApp, web view, and code):** `good` ✅ · `attention` ⚠️ (missed medicine, low mood, busy/late, soft missed call) · `alert` 🔴 (EMERGENCY/URGENT, unreachable escalation) · `skipped` ⏸ · `no_data` (before onboarding / outside schedule).
- **Quotes:** when we show the parent's words, they are her words from the transcript, labelled as such, never paraphrased into a diagnosis.
- **Languages:** child UI in English + Hindi at launch (child picks); parent voice in Hindi/Hinglish/English first, regional languages only when native-speaker-reviewed (see `open_questions.md`).
- **Privacy:** neighbour sees the minimum; audio only with parent consent; magic links expire; any family member can request deletion.
- **Accessibility for the child:** works on 3G, low-end Android, large text, no colour-only status.

## 5. Competitor UX notes (quick scan, 17 Oct 2026; vendor claims, not verified)
- **Meela** (US): scheduled calls to any phone, "no apps, no screens"; families get a **text only when something concerning is mentioned**; senior can call back on the same number; intro video for the senior on the onboarding site. → We send a daily "all good" too (assumption that Indian children want the daily ritual; test in pilot). Copy the "call back the same number" idea once we have inbound. [meela.ai/faqs](https://www.meela.ai/faqs), [Get started](https://www.meela.ai/get-started)
- **IAmFine** (US): automated daily call, press 1 to confirm; **retries 5 times over 1 hour**, then alerts the care circle by SMS/email; senior can check in late by texting OK. → Similar ladder, but no keypad for our users. [dailycall.iamfine.com](https://dailycall.iamfine.com/)
- **Snug Safety** (US): app check-in; free plan texts contacts **15 min** after a missed deadline; paid Dispatch calls the person, then contacts, then requests a wellness check; sends an "all clear" if it was a false alarm. → Copy the explicit false-alarm "all clear" message. [snugsafe.com](https://www.snugsafe.com/how-snug-works-for-people-who-live-alone)
- **CareCall** (US): AI daily call, up to 5 care-circle members, conversation summaries sent to the circle, unanswered-call escalation. → Validates the care-circle + summary pattern. [getcarecall.com](https://www.getcarecall.com/)
- Indian players (Emoha, Samarth, Anvayaa) are human-service/app models; see `pitch/competitors.md`.
