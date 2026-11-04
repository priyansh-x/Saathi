# Product Requirements Document

**Product:** Saathi  
**Status:** Draft for build  
**Date:** 16 October 2026  
**One line:** A morning phone companion for aging parents in India, plus a WhatsApp briefing and family desk for the child.

---

## 1. One-line brief

A voice agent that **calls the parent every morning on the phone they already own**, in their language, checks that they woke up, took their medicines, and are not in distress — then **WhatsApps a two-line briefing to the child**. If the parent misses the call or reports a fall, the agent escalates to the child and a neighbour who can physically go over.

The parent never installs an app. The child is the buyer.

---

## 2. Why this, why now

### 2.1 Why voice on the phone they already own

The parent should not install an app. Bolna’s stack is outbound / inbound phone agents, Indian-language speech, retries, and WhatsApp workflows. A product that **lives on a PSTN call** matches how families already reach elders.

### 2.2 Why this class of product

Caregiver jobs will go unfilled; little technology is actually built for older people; smart speakers already frustrate seniors. The opportunity is **voice that can hold a real conversation**, monitoring that keeps older adults independent, and software that helps family caregivers coordinate care and emergencies.

The Indian version of that sentence is sharper. The caregiver is usually an adult child in another city or country. The parent’s interface is a ringing phone, not a smart speaker.

### 2.3 Why India is the right first market

The US aging thesis is real. India is larger, less served, and already phone-native:

- India is adding old people faster than its care system can absorb them.
- Filial duty is culturally load-bearing. Children already experience “I should have called” as moral failure, not a UX gap.
- Internal migration plus the NRI pipeline means **distance is the default**, not the exception.
- Feature phones and barely-used smartphones are still common among 70+.
- WhatsApp is how Indian families already coordinate. The child does not need a new notification surface.
- Hindi and regional languages are the conversation, not a localisation afterthought.

---

## 3. Research

Figures below are from published national sources. They are directional, not a TAM model. Cite them as research, not as if we ran the survey.

### 3.1 How many older Indians

| Figure | What it means | Source |
| --- | --- | --- |
| **156.7 million** aged 60+ in 2024 (~11% of the population) | One in nine Indians is already old. | WHO SEARO Healthy Ageing fact sheet, India (2024/25) |
| **15.5 million** aged 80+ | The group that cannot self-serve an app. | Same |
| **193 million** aged 60+ by 2030 (~13%) | Five-year window, not a 2050 story. | UNFPA, *UHC for the Silver Dividend* (2025) |
| **347 million** / ~21% by 2050 | Same order of magnitude as the current US population. | UNFPA India Ageing Report 2023; UNFPA 2025 |
| **138 million** in 2021; **230 million** by 2036 | Official Indian projection track. | MoSPI / Technical Group on Population Projections; PIB *Elderly in India* (2025) |
| Sex ratio **1,065** women per 1,000 elderly men; **58%** of the elderly are women; **54% of elderly women are widows** | The typical user is often a widow, not a couple with a son in the next room. | LASI / NITI Aayog *Senior Care Reforms in India* |

India reports **limited resources for long-term care** even while claiming more capacity on “healthy ageing” paper goals (WHO SEARO). Formal geriatric labour is a rounding error against the numbers. NITI’s caregiver paper (2026) is explicit: demand for long-term care will rise as urbanisation and nuclear families weaken informal care, and India does not even have good data on how well informal care is working.

### 3.2 Who is actually in the house

The joint family is the marketing story. The data is emptier.

| Figure | What it means | Source |
| --- | --- | --- |
| **6%** of elderly live alone; **9%** of elderly women live alone | Millions of people with no one to hear a fall. | NITI Aayog, *Senior Care Reforms in India* (LASI-based) |
| **~5.7%** live alone in the LASI 60+ analytic sample | Same finding, different write-up. | LASI Wave 1 tables |
| Parents living **alone or only with a spouse** rose **22% (2011) → 27% (2017–18)** | The empty nest is growing inside India, not only via Gulf / US migration. | Jadhav et al., cited in SSM-Population Health (2023) using LASI |
| **~36%** of older parents have a **migrant child**; a large share are “left behind” | Distance is structural. | SSM-Population Health (2023), LASI 2017–18 |
| **19%** divorced, separated, deserted, or living alone | Isolation is not rare. | NITI Aayog senior care paper |
| **~66%** of LASI elderly are rural; **~85%** have no or only primary education | English UI and QR-code onboarding will fail. | LASI Wave 1 loneliness paper sample |

Living alone is not only lonely. It is medically worse. LASI analyses associate living alone with higher odds of diabetes versus living with a spouse/children, and with **uncontrolled hypertension among people already on medication (OR 1.63)**.

### 3.3 The health job: quiet days, not ambulances

| Figure | What it means | Source |
| --- | --- | --- |
| **Hypertension** more common in older women (37%) than men (28%); diabetes ~14% | The daily tablet is the product surface. | LASI gender / living-arrangement analysis |
| **Multimorbidity 32%** of older adults; higher if female, urban, older, or living alone; Kerala 59% | Most “users” have two problems, not one reminder. | BMC Geriatrics (2023), LASI |
| Among diagnosed hypertensives **on medication**, **31% Grade-1 / 15% Grade-2 / 2% Grade-3** still uncontrolled | A reminder is not enough, but a missed tablet plus silence is how control dies. | JNCD (2022), LASI 45+ on treatment |
| Rural (OR 1.37), **living alone (OR 1.63)**, no schooling (OR 1.18) raise uncontrolled BP | The parent who is hardest to reach on an app is the one who needs the call. | Same |
| Medication intake **81%** (diabetes) and **73%** (hypertension); lower if ≥65, widowed, rural | One in four hypertensives are not even taking the tablet. | National survey analysis on self-care (LASI) |
| **52%** of a LASI elderly loneliness sample had **more than two** chronic conditions | Check-ins must be short and specific, not a full history. | PMC loneliness paper, LASI Wave 1 |
| **13.4%** frequent loneliness; **94%** not in social activities | Companionship is a real job, secondary to safety. | Same |
| **~20%** at least one ADL limitation; **~44%** at least one IADL limitation in one living-arrangement paper | Many parents cannot manage a new device even if willing. | BMC Geriatrics living-arrangement / life-satisfaction paper |

Government programmes (NPHCE, e-Sanjeevani, Ayushman Bharat) exist. They do not call the parent at 8:30 after tea and tell the daughter in Dubai what was said.

### 3.4 How Indian families already “do” care at a distance

Ethnography on Kerala nurses abroad and parents at home (Ahlin and others) is consistent: **daily calling is the care practice**. Adult children ring once or several times a day. It is duty, reassurance, surveillance, and love in the same gesture. WhatsApp video has grown for those who can use it. A large group of 65+ in smaller towns still prefers a **normal incoming voice call** on a number they recognise.

That is the behaviour to instrument, not replace. The product is the call the child **cannot place every morning** because of meetings, time zones, or exhaustion — without pretending an agent is the child.

### 3.5 Competitive landscape (India)

| Player | What they sell | Gap this product occupies |
| --- | --- | --- |
| **Emoha** | Membership eldercare: geriatric plan, emergency coordination, panic hardware, family alerts. Plans from roughly ₹1,999/month upward; emergency add-ons extra. Ops-heavy, metro-shaped. | No daily conversational layer on a regular phone. Labour does not scale to a Tuesday in a tier-2 town. |
| **Portea** | In-home nurses and attendants. NRI booking via phone / WhatsApp. | Staffed care, not a daily signal. Expensive, city-limited. |
| **Samarth** | Care managers, clinics, NRI app with updates. 350+ cities claim. | Human coordination. The parent still has to be visited or phoned by a person. |
| **Nila** | AI care coordination + cross-border payments for immigrants (India first). $2.4M pre-seed (2026 reporting). | Logistics and money. Not a morning voice in the parent’s language. |
| **Alexa / Google Home / pill-box apps** | Device or app reminders. | Setup the parent will not finish. English-first. Do not brief the child. Feel like a device. |
| **HMD + inTouch (pilot)** | AI companion on feature phones in other markets; HMD × Sarvam in India. | Validates phone-as-interface. Not a family-escalation product. |
| **Family WhatsApp groups** | The incumbent. | No structure, no missed-call protocol, no medicine memory, no neighbour dispatch. |

Incumbents are **labour marketplaces and emergency ops**. This product is **software on the voice channel**. It should not pretend to be an attendant in month one.

### 3.6 Insight

**The dangerous day does not look like an ambulance. It looks like silence.**

Did not wake. Did not take the tablet. Knee too swollen to reach the kitchen. Phone on silent. Scam call that shook them. Lonely enough not to mention it when the child finally rings at 11pm.

Indian eldertech over-indexes on the loud day (fall detected, ambulance, panic button). The unpaid caregiver’s actual anxiety is the **quiet Tuesday**. A three-minute call, a missed-call rule, and a neighbour’s number cover more real risk per rupee than a wearable the parent will leave on the shelf.

---

## 4. Problem statement

Adult children of ageing Indians who live in another city or country cannot reliably know, every day, whether a parent woke up, took their medicines, and is safe — and the parent will not use an app, speaker, or wearable to tell them.

Current substitutes fail:

1. **The child’s own daily call** — morally required, operationally fragile (work, time zones, guilt, inconsistency).
2. **WhatsApp voice notes** — only if the parent initiates and the child sees it.
3. **Attendant / agency care** — right for high-need, high-budget, metro families; wrong as a default.
4. **Smart speakers and health apps** — built for a user who can finish onboarding in English.

---

## 5. Goals

### 5.1 Product goals

1. The parent’s only required action is **answering a phone they already have**.
2. Every scheduled morning produces either a **structured briefing** or an **escalation**. Silence is never “no data.”
3. The child can set this up in **under ten minutes** without being in the house.
4. The conversation feels like a **respectful younger person**, not a clinic IVR or a cartoon companion.
5. Voice is the product, not a feature bolted onto a dashboard.

### 5.2 v0 goals

- Ship a walkable slice: setup → live or simulated call → family briefing → missed / emergency path.
- Run on Bolna (outbound agent + Indian languages). Cartesia / Sarvam / Deepgram as speech stack if the build uses them.
- Pitch in one sentence: *voice for ageing, India-first, phone-native, family-paid.*

### 5.3 Non-goals (v1)

- Robotics, cameras, wearables, in-home attendants.
- Diagnosing disease or replacing a doctor.
- A social network for seniors.
- A full EMR or hospital integration.
- Billing, subscriptions, or multi-tenant admin.
- The parent-facing smartphone app.
- English-only voice.
- Surveillance that the parent did not consent to (always-on mic, location stalking).

---

## 6. Users

### 6.1 Primary buyer — the adult child (“Ananya”)

- 28–45, works in an Indian metro, Gulf, UK, or US.
- Pays. Feels responsible. Already calls when they can.
- Lives on WhatsApp.
- Will not open a care-ops dashboard every day.
- Needs: a reliable morning signal, and a path that is not “I find out at midnight.”

### 6.2 Primary user — the parent (“Kamala”)

- Typically 68–85. Often a woman, often widowed, often Hindi / Tamil / Marathi / Kannada first.
- May share a house with a spouse, a part-time cook, or no one.
- Has a mobile number. May not unlock WhatsApp without help.
- Needs: to be spoken to with *aap*, by name, slowly; to complain about a knee; to not be treated as a patient ID.
- Must be able to **refuse or pause** the service. The child cannot enrol them as a tracking device.

### 6.3 Secondary — the neighbour / local contact

- Can walk to the house in ten minutes.
- Gets a call or WhatsApp only on miss or emergency.
- Must not be spammed on green days.

### 6.4 Anti-personas

- Bedridden, high-acuity patients who need a nurse (send them to Portea).
- Children who want covert monitoring without telling the parent.
- Parents who already have a live-in child and no distance problem (nice-to-have later, not the wedge).

---

## 7. Jobs to be done

**Child:** When I cannot call this morning, I want someone trustworthy to speak to my parent in their language and tell me, in two lines, whether today is fine, watch, or go there now — so I can work without imagining the worst, and act when it is not fine.

**Parent:** When the phone rings after tea, I want a short, respectful conversation that remembers my tablet and asks how I slept — so I feel the house is not empty, without learning a new machine.

**Neighbour:** When something is actually wrong, I want one clear ask (“please knock, she didn’t pick up twice”) — not a stream of wellness scores.

---

## 8. Product shape

### 8.1 What the parent sees

An incoming call. Caller ID / Truecaller should read as a **named family-sent line**, not `+91 unknown` and not a promotional 140-series blast that looks like a scam.

Call length: **2–4 minutes**. Structure:

1. Greeting by name, mention the child (“Ananya asked me to call”).
2. Sleep / morning.
3. Named medicine (“the small white tablet after breakfast”).
4. Body: dizziness, chest pain, fall, anything else.
5. Day: alone or someone coming.
6. Close in the register of that language (*Ram ram / Nandri / Namaskara*).

The parent can **call the same number back**. Inbound is in scope for v1 protocol even if the first demo is outbound-only.

### 8.2 What the child sees

- One-time setup (web).
- WhatsApp (or SMS fallback) after every call.
- Three outcomes only: **OK / Watch / Emergency** (plus **Missed** as its own path).
- Optional week strip: seven circles, not a hospital chart.
- Transcript on request, not in the default message.

### 8.3 What the agent does after the call

| Outcome | Trigger (examples) | Action |
| --- | --- | --- |
| **OK** | Answered; meds taken; no distress | WhatsApp child, two lines |
| **Watch** | Skipped tablet; pain; lonely; “heavy” mood; mild confusion | WhatsApp child with the flag; optional afternoon callback if meds skipped |
| **Emergency** | Fall; chest pain; “I can’t get up”; severe confusion; explicit ask for help | Call/WhatsApp child **and** neighbour immediately; keep parent on the line if possible |
| **Missed** | No answer → retry once in ~15 min → still no answer | Child + neighbour: “please knock” |

Silence is an outcome. The system must not treat an unanswered call as a successful no-op.

---

## 9. User flows

### 9.1 First-run (child)

1. Open the web app.
2. Enter their name and WhatsApp number.
3. Enter parent name, what the child calls them (Amma / Aai / Nani / Appa / Papa), phone, city, language.
4. Call window (e.g. 08:30 IST, after breakfast).
5. Medicines as plain language (“Amlodipine 5mg after breakfast”).
6. Neighbour name + phone.
7. Confirm: **the parent has agreed to receive this call.**
8. Optional: trigger a test call now.
9. Land on a quiet family desk: next call time, last outcome empty.

### 9.2 Happy morning

1. Agent places outbound call at the window.
2. Parent answers.
3. Four-beat conversation (sleep, meds, body, day).
4. Agent hangs up gently.
5. Child WhatsApp: `OK · Amma took Amlodipine · sounded steady · Lakshmi coming for tea.`
6. Family desk shows a green day.

### 9.3 Skipped tablet

1. Parent: “I forgot.”
2. Agent: take it now; may schedule a noon confirm call.
3. Child: `WATCH · forgot BP tablet, said she will take it now.`

### 9.4 Fall / distress

1. Parent describes a slip, or speech is clearly wrong.
2. Agent tells them to sit, stay on the line if possible.
3. Parallel alert to child and neighbour with the sentence they used.
4. Family desk: emergency state, call-back numbers visible.

### 9.5 Missed call

1. No answer.
2. Auto-retry once (guardrail: still inside allowed hours).
3. Still no answer → child + neighbour.
4. If anyone marks “spoke to her, she was in puja,” close as OK with a note.

### 9.6 Parent inbound

1. Parent calls the same number.
2. Agent answers in their language, knows who they are from caller ID.
3. Same triage. If panic, same emergency path.

### 9.7 Pause / stop

Child or parent can pause. Parent saying “don’t call me” is a stop, not a joke. Honour it and tell the child.

---

## 10. Functional requirements

### 10.1 Must have (build slice)

| ID | Requirement |
| --- | --- |
| F1 | Child can create one household (one parent, one child, one neighbour) from the web app. |
| F2 | Persistence at least sufficient for a demo (local store or single JSON/SQLite is acceptable for v0). |
| F3 | Outbound call can be triggered (“Call now”) without waiting for 08:30. |
| F4 | Voice conversation in **Hindi first**; English subtitles on the demo UI so a reviewer can follow. |
| F5 | Conversation covers greeting, sleep, **named** medicine, body/safety, social day, close. |
| F6 | Agent extracts structured flags: meds taken / skipped, pain, lonely, well, fall. |
| F7 | Post-call briefing with outcome OK / Watch / Emergency / Missed. |
| F8 | Missed-call retry + escalate copy is implemented (even if neighbour “call” is mocked). |
| F9 | Emergency copy is implemented and visually distinct. |
| F10 | Consent checkbox: parent knows this number will call. |
| F11 | Family desk empty / loading / error / after-call states. |
| F12 | Desktop and mobile layouts for setup and family desk. |

### 10.2 Should have

| ID | Requirement |
| --- | --- |
| S1 | Real Bolna outbound agent (not only a scripted web simulator). |
| S2 | Inbound on the same number. |
| S3 | Second language pack (Tamil or Marathi) with the same beats. |
| S4 | WhatsApp-shaped briefing in the UI; real WhatsApp if a provider is available. |
| S5 | Afternoon callback when meds were skipped. |
| S6 | Truecaller / branded caller name notes in the pitch even if not live. |
| S7 | Week history of outcomes. |

### 10.3 Nice to have (not this slice)

- Scam-call coaching (“if someone asks for OTP, hang up”).
- Festival / fasting calendar (medicine with food).
- Multiple children, sibling acknowledgements.
- Doctor appointment memory.
- Voice biometric / “this doesn’t sound like Amma.”
- Payments to a local chemist.

---

## 11. Conversation design

### 11.1 Voice principles

- Slow. One question at a time. Leave silence.
- *Aap*, name, and the child’s name in the first sentence so the call is socially licensed.
- Never “press 1.” Never interrupt a complaint to complete a schema.
- Medicines by **appearance and meal**, not only generic name.
- If the parent wants to talk about the neighbour’s daughter, allow one turn of chat, then one safety question, then close. Do not trap them in a script.
- Do not claim to be the child. Do not pretend to be a doctor.

### 11.2 Example happy path (Hindi, with intent)

> Agent: नमस्ते कमला जी, मैं [product] बोल रही हूँ — अनन्या ने कहा था सुबह बात कर लूँ। सो के उठे?  
> Parent: हाँ बेटी, ठीक से सोई।  
> Agent: नाश्ते के बाद अम्लोडीपिन की गोली ले ली? वो छोटी सफेद वाली।  
> Parent: हाँ, दूध के साथ ले ली।  
> Agent: आज शरीर कैसा है? चक्कर, सीने में दर्द, या कुछ और?  
> Parent: सब ठीक है।  
> Agent: अनन्या पूछ रही थी — आज घर में कोई आएगा?  
> Parent: लक्ष्मी शाम को चाय को आएगी।  
> Agent: ठीक है। अनन्या को कह देती हूँ आपने बात की। राम राम।

### 11.3 Extraction

From the call, persist:

- `flags[]`: `meds_taken` | `meds_skipped` | `pain` | `lonely` | `well` | `fall`
- `outcome`
- `summary_en` / `summary_hi`
- transcript (internal)
- timestamp, duration

If `fall` or equivalent distress language → `emergency`, no matter what else was said.

---

## 12. Information architecture (web)

```
/                 marketing + problem (short) + CTAs
/onboard          child setup (F1, F10)
/family           family desk (last call, week, contacts)
/call             demo / live call surface (simulator and/or Bolna web call)
```

The parent does not use these routes. Judges and the child do.

Visual tone: paper, not hospital. Warm type. Hindi visible. No purple “AI” gradient, no mascot, no stock photo of a white couple with a tablet.

---

## 13. Technical approach

### 13.1 Stack (this repo)

| Layer | Choice | Why |
| --- | --- | --- |
| Web | Next.js (App Router), TypeScript, Tailwind, shadcn/ui | Default for the child/judge surface |
| Voice | Bolna agent (outbound PSTN; web call for demo if phone numbers are blocked) | Hackathon-native |
| Speech | Whatever Bolna is wired to (Sarvam / Cartesia / Deepgram among sponsors) | Do not build a STT/TTS stack |
| Briefing | UI mock of WhatsApp first; provider later | Unblock demo |
| Data | Start local (structured objects); promote if needed | No auth/DB unless a flow requires it |
| Hosting | Dev server on a non-default port for preview; later Vercel | — |

### 13.2 Bolna mapping

- One agent prompt = conversation principles + household context (name, medicines, child, language).
- `POST /call` for “Call now.”
- Batch / workflow later for the 08:30 campaign + retry + WhatsApp.
- Guardrails: calling hours only; no night retries.
- Inbound number shared with the parent as a fridge magnet / written note in the pitch.

### 13.3 Privacy and safety (even in a demo)

- Do not record a real parent without consent.
- Demo data is fictional (e.g. Kamala Iyer, Coimbatore) unless a teammate’s parent has agreed.
- Medical content is a check-in, not advice. If they report chest pain, escalate; do not titrate a dose.
- Make it obvious the agent is not the child.

---

## 14. Success metrics

### 14.1 Hackathon

- A judge can set up a household and complete a call path in **< 5 minutes**.
- All four outcomes (OK, Watch, Emergency, Missed) are demonstrable.
- Hindi audio is intelligible; English sidecar exists.
- Pitch sentence fits the RFS without a slide of US census data pretending to be India.

### 14.2 If this became a company (directional)

- **Answer rate** of scheduled calls.
- **% mornings that produce a briefing** (answered or escalated — never void).
- **Time-to-neighbour** on missed/emergency.
- Child **7-day retention** of reading the briefing (WhatsApp open is enough).
- Parent **opt-out rate** (high = voice is wrong or too frequent).
- Qualitative: “I didn’t have that 11am knot in my stomach.”

Do not optimise “minutes of companionship.” That metric creates a clingy agent.

---

## 15. Risks

| Risk | Why it’s real | Mitigation |
| --- | --- | --- |
| Parent thinks it’s a scam | India spam / 140-series distrust | Child-sent caller name; first week the child warns Amma; written number on the fridge |
| Agent sounds like a call centre | Destroys trust in one call | Prompting, pace, language; never menus |
| Medical liability | People will treat a check-in like a nurse | Escalation, not advice; explicit non-clinical framing |
| Covert use by children | Ethical and reputational kill shot | Consent gate; parent can stop |
| Missed-call false alarms | Neighbour fatigue | One retry; calling-hour guardrail; easy “all fine” ack |
| Incumbents add a call | Emoha could phone people | Win on voice quality + daily habit + price of software vs labour |
| Bolna credits / telephony in the demo env | Numbers and DLT | Web-call fallback so the demo never depends on a live DID |

---

## 16. Build plan (this repository)

### Slice 0 — repo (this pass)

- PRD, architecture, flow docs, README, env example.
- Next.js + TypeScript + Tailwind + shadcn/ui installed.

### Slice 1 — child setup + family desk

- Household form, validation, empty desk, dummy last-call.

### Slice 2 — conversation

- Scripted interactive call (Hindi + English) proving F5–F9 without telephony.
- Then swap the mouth/ear to Bolna when keys exist.

### Slice 3 — escalation theatre

- Missed and fall paths that look like WhatsApp + neighbour ping.

### Slice 4 — live voice

- Bolna agent, Call now, optional inbound.

Do not start Slice 4 before Slice 2 is walkable. Judges can forgive a mocked PSTN. They cannot forgive a confusing product.

---

## 17. Open questions

1. Working name (deferred).
2. Is the first language Hindi for all demos, or do we record one Tamil path for South Indian families?
3. Do we need a real WhatsApp Business sender, or is an in-app message enough for 31 Oct?
4. Who on the team can legally place test calls to Indian numbers from this environment?
5. Minimum viable consent language in Hindi for the parent.

---

## 18. Sources

1. WHO SEARO, *Facts and Figures — Healthy Ageing — India* (2024/25). 156.7M aged 60+; 15.5M aged 80+.
2. UNFPA India, *UHC for the Silver Dividend: Building Health Systems for an Ageing India* (2025). 193M by 2030; 347M by 2050.
3. UNFPA India, commentary on India Ageing Report 2023. Pace of ageing; weak pension coverage; migration weakening family support.
4. NITI Aayog, *Senior Care Reforms in India*. Living alone 6% / 9% of women; widowhood; nuclearisation.
5. NITI Aayog, *Reimagining Care: Strategies for Empowering Caregivers in Viksit Bharat 2047* (2026). Informal vs formal care; demand shock; data gap.
6. MoSPI / PIB, *Elderly in India* (2021, 2025 updates). 138M (2021) → 230M (2036); LASI summary; 54% of elderly women widows.
7. LASI Wave 1 (2017–18), various secondary papers:
   - Living arrangements and chronic disease (Aging and Health Research, 2022).
   - Multimorbidity (BMC Geriatrics, 2023).
   - Hypertension control among treated patients (JNCD, 2022).
   - Self-care / medication intake in DM and HTN.
   - Loneliness correlates (PMC, LASI Wave 1).
   - Offspring migration and left-behind parents (SSM-Population Health, 2023).
   - Living arrangement and life satisfaction (BMC Geriatrics, 2023).
8. Ahlin, frequent calling as transnational care (Kerala nurses; phone / WhatsApp).
9. Emoha, Portea, Samarth, Nila — public plan and press pages (2024–2026).
10. Bolna docs: voice agents, outbound `POST /call`, batch, WhatsApp workflows, 140/160-series, Truecaller, web calls.
11. Public research on AI for the aging population.
12. Bolna public docs (voice agents, outbound call APIs).

---

## 19. Decision log

| Date | Decision |
| --- | --- |
| 2026-10-16 | Wedge is the **daily outbound phone check-in**, not a senior app, not a caregiver marketplace. |
| 2026-10-16 | Buyer = child. Interface for parent = PSTN. Briefing = WhatsApp. |
| 2026-10-16 | Four outcomes only: OK, Watch, Emergency, Missed. |
| 2026-10-16 | Product name deferred. |
| 2026-10-16 | Stack: Next.js + shadcn for the family surface; Bolna for voice. |
