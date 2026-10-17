# Saathi WhatsApp copy v0.1: templates, alerts, neighbour, onboarding

Owner: Product (UI/UX) · Drafted Sat 17 Oct 2026 (IST) · Status: draft for Priyansh to review
Read with `ux_spec.md` (journeys J1–J7). All names in examples are **fictional EXAMPLE data** (Maa = Kamla Sharma, child = Rohit, neighbour = Sunita ji). Hindi copy needs a native-speaker read before the pilot; Hindi variable values must be generated in Hindi too.

---

## 0. Meta / WhatsApp constraints that shape this copy

Sources (checked 17 Oct 2026): [Twilio: template approvals](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses), [WATI: character limits 2026](https://www.wati.io/en/blog/whatsapp-template-message-character-limit/), [Converzap: buttons](https://converzap.com/en/blog/whatsapp-message-templates/), [meetergo: pricing from Oct 2026](https://help.meetergo.com/en/integrations/automation/whatsapp-pricing/), [Freshdesk: pricing](https://support.freshdesk.com/support/solutions/articles/50000011590-whatsapp-pricing-model). Third-party summaries of Meta docs; re-check in the provider's template editor (Bolna WhatsApp beta or other BSP).

| Constraint | What it means for us |
|---|---|
| **Business-initiated messages outside the 24h customer-service window must be pre-approved templates.** | Daily briefing, alerts, neighbour messages, weekly summary = templates. Replies to the child within 24h of their last message can be free-form. |
| **Categories:** Utility (updates on a service the user signed up for), Marketing, Authentication. Meta can reclassify Utility → Marketing. | Submit everything as **Utility**, use descriptive names (`daily_briefing_good`, `safety_alert_emergency`), no promotional words ("offer", "upgrade", "try our"), make clear the user asked for it ("the daily update you set up"). |
| **Body ≤ 1,024 chars incl. variable values; header/footer ≤ 60 chars; footer has no variables.** | Our bodies are ~150–350 chars. |
| **Body cannot start or end with a variable; variables can't be adjacent; must be sequential `{{1}}, {{2}}…`.** | Every body starts with an emoji/fixed word and ends with fixed text or punctuation. |
| **Buttons:** up to 10 total; label ≤ 25 chars; max 2 URL buttons, 1 phone button; URL buttons allow **one variable at the end** of the URL. | Magic link = URL button `https://<domain>/d/{{1}}` (token). Phone-number buttons are **static** at approval time, so "Call Maa" can't be a per-family phone button. Instead put the parent's number in the body (WhatsApp auto-links numbers) or use a quick reply that returns a tappable number. |
| **4+ buttons, or quick replies mixed with URL/phone buttons, don't render on WhatsApp Desktop.** | Default ≤ 3 buttons. Alerts use **quick replies only** (renders everywhere, NRIs on laptops). Daily briefing mixes 1 URL + 1 quick reply (mobile-first; accept the desktop caveat or ship URL-only). |
| **Pricing (from 1 Oct 2026):** utility templates are charged per delivered message, **including inside** an open 24h window; free-form service replies: first 1,000/number/month free, then charged. | Message budget matters: 1 briefing/day/child on normal days. Siblings' daily briefings are opt-in. |
| **Recipients must opt in** to receive WhatsApp messages from the business. | Child opts in during onboarding; **siblings and neighbour must each opt in** (YES reply) before any template is sent to them. |
| Templates take time to be reviewed; rejected ones must be edited and resubmitted. | Submit all templates in §1–§5 by **~Oct 21** to leave time for the Oct 26 demo target. |

Status vocabulary (same as dashboard): ✅ good · ⚠️ attention · 🔴 alert · ⏸ skipped.

---

## 1. Daily 2-line briefing (to primary child; siblings if opted in)

Common buttons (all four variants): `URL: "Open today" → https://<domain>/d/{{token}}` · `Quick reply: "Message Maa"` (Hindi: "Maa ko sandesh"). Footer (fixed): "Saathi · reply to ask anything" / "साथी · कुछ भी पूछने के लिए जवाब दें". Footer must stay ≤ 60 chars.

### 1a. Good day: `daily_briefing_good`
EN body:
```
✅ {{1}} is doing well today.
Picked up at {{2}} and {{3}}. In her words: "{{4}}".
```
Example: ✅ Maa is doing well today. / Picked up at 8:04 AM and took both tablets (BP, sugar). In her words: "Ghutne ka dard aaj kam hai."

HI body:
```
✅ {{1}} आज ठीक हैं।
सुबह {{2}} बजे फ़ोन उठाया और {{3}}। उन्होंने कहा: "{{4}}"।
```
Example: ✅ माँ आज ठीक हैं। / सुबह 8:04 बजे फ़ोन उठाया और दोनों गोलियाँ (BP, शुगर) ले लीं। उन्होंने कहा: "घुटने का दर्द आज कम है"।

Rule: `{{4}}` is a short **verbatim** quote (≤ 80 chars) or, if nothing quotable, use variant without quote (`daily_briefing_good_noquote`: "…and {{3}}. Nothing worrying came up.").

### 1b. Missed medicine: `daily_briefing_missed_med`
EN:
```
⚠️ {{1}} is fine, but missed a medicine today.
{{2}} not taken ({{3}}). I'll remind her again tomorrow morning.
```
Example: ⚠️ Maa is fine, but missed a medicine today. / Sugar tablet (morning) not taken (she said "khatam ho gayi hai"). I'll remind her again tomorrow morning.

HI:
```
⚠️ {{1}} ठीक हैं, पर आज एक दवाई छूट गई।
{{2}} नहीं ली ({{3}})। कल सुबह मैं फिर याद दिलाऊँगी।
```
Notes: if the medicine has **run out** or it's the **2nd consecutive day**, send `safety_alert_urgent` (§2c) instead; that's URGENT per `voice/red_flags.md` U3. Never imply blame ("forgot again").

### 1c. Low mood: `daily_briefing_low_mood`
EN:
```
⚠️ {{1}} took her medicines but sounded low today.
She said: "{{2}}". A call from you this evening could help.
```
Example: …She said: "Aaj mann nahi lag raha." A call from you this evening could help.

HI:
```
⚠️ {{1}} ने दवाई ली, पर आज उदास लगीं।
उन्होंने कहा: "{{2}}"। आज शाम आपका एक फ़ोन अच्छा रहेगा।
```
Notes: WATCH tier, not an alert. If low mood appears on 3+ calls in 7 days, the backend sends a same-day nudge (red_flags.md rule) with the separate `low_mood_pattern` template (§2e), so the daily copy stays simple and honest.

### 1d. Missed call, soft notice (ladder step at T+30): `missed_call_soft`
EN:
```
⚠️ Couldn't reach {{1}} yet: {{2}} tries since {{3}}.
I'll try again at {{4}}. Her number: {{5}}.
```
Quick replies (no URL, so it renders on desktop): **"I'll call her"** · **"She's OK"** · **"Ask neighbour"** (button labels can't hold variables, so the neighbour isn't named here).
HI:
```
⚠️ {{1}} से अभी बात नहीं हो पाई: {{3}} से {{2}} बार कोशिश की।
{{4}} बजे फिर कोशिश करूँगी। उनका नंबर: {{5}}।
```
(Hindi word order changes variable order in the sentence; values are still passed by number.)
Buttons HI (gender-neutral, ≤ 25 chars): **"मैं कॉल करूँ"** · **"वो ठीक हैं"** · **"पड़ोसी से पूछें"**.

### 1e. Reached late / skipped / busy (after a soft notice or by request)
- `reached_late`: "✅ Reached {{1}} at {{2}} after a few tries. {{3}}." (Body ends with "." after the variable; if the editor rejects, append " Have a good day.")
- `call_skipped`: "⏸ No call today for {{1}}, as requested: {{2}}. Calls resume {{3}} as usual."
- `parent_busy`: "⚠️ {{1}} picked up but was busy, so we kept it short. I'll call again at {{2}} for the medicine check."

---

## 2. Alerts (child + siblings)

All alerts: **quick-reply buttons only**, ≤ 3, include parent's number in body (auto-links), name the time in the **recipient's** time zone with zone label when not IST ("9:12 AM IST / 11:42 PM ET").

### 2a. Unreachable escalation (ladder T+60): `safety_alert_unreachable`
EN:
```
🔴 Still can't reach {{1}}: {{2}} tries since {{3}}.
{{4}} has been asked to check on her. Her number: {{5}}. Please reply when you know she's OK.
```
Buttons: **"I'm on it"** · **"She's OK"** · **"Can't reach her"**
HI:
```
🔴 {{1}} से अब भी बात नहीं हुई: {{3}} से {{2}} बार कोशिश।
{{4}} से देखने को कहा गया है। उनका नंबर: {{5}}। ठीक होने की ख़बर मिले तो बताइए।
```
Buttons HI: **"मैं देख रहा/रही हूँ"** (≤25 ✓) · **"वो ठीक हैं"** · **"बात नहीं हुई"**
Paired with an automatic **voice call** to the child (Bolna outbound, ~15 s script): "Namaste, this is Saathi. We have not been able to reach Kamla ji since 8 AM. Sunita ji has been asked to check. Please see WhatsApp." (Hindi version in voice/ to be written.)

### 2b. EMERGENCY (fall with injury, chest pain, breathlessness, stroke signs, unresponsive): `safety_alert_emergency`
EN:
```
🔴 URGENT: {{1}} needs help now.
On today's call at {{2}} she said: "{{3}}". I told her to call 112 or someone nearby. {{4}} has also been alerted. Her number: {{5}}.
```
Example: 🔴 URGENT: Maa needs help now. / On today's call at 8:09 AM she said: "Bathroom mein gir gayi, uth nahi pa rahi." I told her to call 112 or someone nearby. Sunita ji (neighbour) has also been alerted. Her number: +91 98xxx xxx01.
Buttons: **"I'm on it"** · **"Can't reach her"** · **"False alarm"**
Footer: "Saathi is not an emergency service. Call 112."
HI:
```
🔴 ज़रूरी: {{1}} को अभी मदद चाहिए।
आज {{2}} बजे की कॉल पर उन्होंने कहा: "{{3}}"। मैंने उन्हें 112 या किसी पास वाले को फ़ोन करने को कहा। {{4}} को भी बताया गया है। उनका नंबर: {{5}}।
```
Buttons HI: **"मैं देख रहा/रही हूँ"** · **"बात नहीं हुई"** · **"ग़लत अलार्म"** · Footer HI: "साथी इमरजेंसी सेवा नहीं है। 112 पर कॉल करें।"
Plus automatic voice call to child at T+0, repeats per J5 timeline.

**Suicidal-talk variant** `safety_alert_emotional` (neighbour gets the generic "please check on her" only):
```
🔴 Please call {{1}} now.
On today's call she said: "{{2}}". I stayed with her and shared the Tele-MANAS helpline (14416, free, 24x7). Please talk to her today.
```
Buttons: **"Calling her now"** · **"Can't reach her"**. (Check wording with a mental-health professional before pilot.)

### 2c. URGENT (fall without injury, confusion, 2+ days missed meds / out of stock, fever, not eating, scam risk): `safety_alert_urgent`
EN:
```
⚠️ Please check in with {{1}} today.
On the {{2}} call she said: "{{3}}". She sounded {{4}}. Nothing else urgent came up.
```
Buttons: **"I'll call her"** · **"Ask neighbour"** · **"Seen"**
HI:
```
⚠️ आज {{1}} से ज़रूर बात कर लीजिए।
{{2}} बजे की कॉल पर उन्होंने कहा: "{{3}}"। आवाज़ से वो {{4}} लगीं। और कुछ ज़रूरी नहीं था।
```
Scam-risk example `{{3}}`: "Bank wale bole KYC karna hai, OTP maang rahe the." with fixed extra line in a dedicated template `safety_alert_scam`: "I told her not to share any OTP or money."

### 2d. Ack broadcast (to everyone already alerted): `alert_ack_update`
```
✅ {{1}} is on it ({{2}}).
We'll update you when {{3}} is confirmed OK.
```
HI: "✅ {{1}} देख रहे हैं ({{2}})। {{3}} के ठीक होने की पुष्टि होते ही बताएँगे।"
Follow-up to the acker after 20 min: "Did you reach {{1}}?" **[She's OK] [Getting help] [Couldn't reach]**

### 2e. Resolved / no-ack / pattern
- `alert_resolved`: "✅ All clear: {{1}} confirmed {{2}} is OK at {{3}}. Thank you." (Snug-style explicit all-clear.)
- `alert_no_ack`: "🔴 Nobody has confirmed {{1}} is OK yet. Please call her ({{2}}) or someone near her. If it's an emergency, call 112." (sent once at T+15/T+30, then the alert stays pinned in the web view)
- `low_mood_pattern`: "⚠️ {{1}} has sounded low on {{2}} calls this week. Latest, she said: "{{3}}". A call or visit soon could help."
- `parent_relay`: "💬 {{1}} asked me to tell you: "{{2}}". (From today's {{3}} call.)" Buttons: **"Calling her"** · **"Reply via Saathi"**

---

## 3. Neighbour / responder messages

Neighbour language = their choice at opt-in (Hindi default). Minimum data only.

### 3a. Opt-in request (sent once, on the child's behalf): `responder_optin`
HI:
```
नमस्ते {{1}} जी, {{2}} ने आपको अपनी माँ {{3}} ({{4}}) के लिए भरोसेमंद पड़ोसी के रूप में जोड़ा है।
अगर कभी उनसे संपर्क न हो या वो गिर जाएँ, तो साथी आपको यहाँ एक मैसेज भेजेगा ताकि आप उन्हें देख सकें। रोज़ कोई मैसेज नहीं आएगा। क्या आप तैयार हैं?
```
EN:
```
Namaste {{1}} ji, {{2}} has added you as a trusted neighbour for their mother, {{3}} ({{4}}).
If we ever can't reach her, or she reports a fall, Saathi will message you here so you can check on her. No daily messages. Are you okay with this?
```
Buttons: **"Haan, theek hai / Yes"** · **"Nahi / No"**. `{{4}}` = landmark ("B-12, Shanti Nagar"). Child is told the outcome.

### 3b. Emergency check request: `responder_alert_emergency`
HI:
```
🔴 {{1}} जी, क्या आप अभी {{2}} जी ({{3}}) को देख सकते हैं?
उन्होंने अभी फ़ोन पर बताया कि {{4}}। उनके बेटे {{5}} को बता दिया गया है। ज़रूरत हो तो 112 पर कॉल करें।
```
EN:
```
🔴 {{1}} ji, can you check on {{2}} ji ({{3}}) right now?
She just said on a call that {{4}}. Her son {{5}} has been told. If needed, call 112.
```
`{{4}}` is plain words, no medical detail: "she fell and can't get up" / "she is not feeling well and needs someone" / (suicidal talk) "she needs someone with her". Buttons: **"Main ja raha/rahi hoon"** (HI, 24 chars) / **"I'm going"** · **"Abhi nahi ja sakta"** / **"Can't go now"**.

### 3c. Unreachable check request: `responder_alert_unreachable`
HI: "⚠️ {{1}} जी, {{2}} जी ({{3}}) सुबह से फ़ोन नहीं उठा रहीं। क्या आप एक बार जाकर देख सकते हैं? उनके बेटे {{4}} को पता है।"
EN: "⚠️ {{1}} ji, {{2}} ji ({{3}}) hasn't answered her phone since this morning. Could you check on her once? Her son {{4}} knows."
Same buttons.

### 3d. After "I'm going"
Session message (window open): "🙏 Dhanyavaad! {{child}} ko bata diya hai ki aap ja rahe hain." Then after 15 min: "Kya {{parent}} ji theek hain?" **[Haan, theek hain] [Madad chahiye]**. "Madad chahiye" → child alerted immediately ("Sunita ji is with Maa and says she needs help.") + "Please call 112 if it's an emergency."
### 3e. If someone else already acked
"✅ Thank you, {{child}} has already reached her. No need to go." (prevents wasted trips.)

---

## 4. Weekly summary (Sunday; child's local time): `weekly_summary`
EN:
```
🗓 {{1}}'s week ({{2}}): answered {{3}} of 7 calls, took {{4}} of {{5}} doses.
Mood: {{6}}. Notable: {{7}}. Tap below for the full week.
```
Example: 🗓 Maa's week (11–17 Oct): answered 6 of 7 calls, took 12 of 14 doses. / Mood: mostly cheerful, low on Thursday. Notable: knee pain better since Wednesday; wants to plan a Haridwar trip. Tap below for the full week.
HI:
```
🗓 {{1}} का हफ़्ता ({{2}}): 7 में से {{3}} कॉल उठाईं, {{5}} में से {{4}} दवाइयाँ लीं।
मन: {{6}}। ख़ास बातें: {{7}}। पूरा हफ़्ता नीचे देखें।
```
Button: URL **"See the week"** · quick reply **"Change something"**.
(Example numbers are illustrative, not pilot data.)

---

## 5. Child onboarding chat (session messages after the child messages first, so mostly free-form; only the reminders are templates)

> 👋 Namaste! I'm Saathi. Every morning I can **call your parent on their own phone**, in their language, check they're okay and remind them about medicines, then send you a 2-line update here.
> I'm a friendly AI helper, not a doctor and not an emergency service.
> [Set up for my parent] [How it works]

> Great. What's your name?
> → *Rohit*

> Thanks Rohit. What's your parent's name, and what do you call them? (e.g. "Kamla Sharma, Maa")
> → *Kamla Sharma, Maa*

> And Maa's phone number? (Any phone works, even a basic one.)
> → *98xxxxxx01*

> Got it: Maa (Kamla Sharma), +91 98xxx xxx01.
> One quick form for language, call time, medicines and a neighbour (2 min): [Open form] *(URL, magic link)*

*(after form)*
> Here's the plan:
> 📞 Every day at **8:00 AM IST**, in **Hindi**
> 💊 BP tablet (morning), sugar tablet (morning + night)
> 🏠 Neighbour: Sunita ji (waiting for her YES)
> 📬 Your update: right after the call (you're in IST, no quiet hours set)
> [Looks right] [Edit]

> One important step: **please tell Maa before the first call** so she isn't surprised by a new number. Here's a voice note you can forward to her 👇 *(audio, Hindi, ~20 s)*
> "Maa, main Rohit. Kal se Saathi naam ki ek awaaz aapko roz subah aath baje phone karegi. Maine hi rakha hai. Woh aapki dawai yaad dilayegi aur mujhe bata degi ki aap theek ho. Phone utha lena!"
> Also save this number in her phone as **"Saathi (Rohit)"**: +91 xxxxx xxxxx
> When should Saathi make the first introduction call? [In 1 hour] [Tomorrow 8 AM] [Pick a time]

`onboarding_reminder` (template, if the child stops mid-way and 24h passes): "👋 Your Saathi setup for {{1}} is almost done. It takes about 2 minutes to finish." [Finish setup]

`parent_consent_result` (template; sent after the intro call):
- ✅ "Maa said yes! 🎉 Her first daily call is {{1}}. You'll get the first update right after."
- ⏸ "Maa asked to talk later. I'll try again at {{1}}."
- ❌ "Maa wasn't comfortable with daily calls today, so I won't call her. You could talk to her about it and try again anytime. [Try again later] [Talk to the team]"

---

## 6. Free-form replies to child questions (inside the 24h window)

- Status: "Last call today at 8:04 AM IST: Maa sounded well and took both tablets."
- Medical question: "I can't advise on medicines or symptoms. Please check with her doctor. I can remind Maa about whatever you and the doctor decide."
- Relay: "Got it. I'll tell Maa on tomorrow's 8 AM call: "I'll call you at 7 tonight."" (Be honest about when.)
- Settings change confirm: "Change Maa's call time to 9:00 AM IST from tomorrow? [Confirm] [Cancel]"
- Not understood: "Sorry, I didn't get that. You can ask about Maa's day, change her call time or medicines, or skip a day." [Today's update] [Change settings] [Skip a day]
