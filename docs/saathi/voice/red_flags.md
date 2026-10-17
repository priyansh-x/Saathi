# Saathi red flags: triggers, severity and exact responses

Drafted 17 Oct 2026 (IST) · v0.1 · Companion-and-reminder framing only. Saathi **never diagnoses**. It notices words that might mean danger, tells the family, and in an emergency urges the parent to get help.

**Before the pilot:** have these lines reviewed by a doctor or nurse in the family network, and have the Hindi/Kannada/Tamil checked by native speakers. The trigger phrases below are designer-written examples, not collected user data.

## Severity tiers

| Tier | What Saathi does on the call | Alert (`raise_alert`) | Family gets |
|---|---|---|---|
| **EMERGENCY** | Stops everything else. Gives the short emergency line: call 112 / call family / get a neighbour. Stays calm and stays on the line if the parent wants. Does not continue the medicine check. | Immediately, `severity: "EMERGENCY"` | Instant WhatsApp alert + backend auto-calls the child (and a second contact if no answer) |
| **URGENT** | Acknowledges kindly, asks **one** gentle follow-up, tells the parent the family will be told today, and continues the call gently. | During the call, `severity: "URGENT"` | Same-day WhatsApp alert (not a phone call) |
| **WATCH** | Listens, empathises, no alarm. Doesn't mention "alert". | No `raise_alert`. Picked up after the call by the post-call extraction (`watch_flags`, tools_schema.md §5); `save_memory_note` if useful next time | Appears in the daily summary; the dashboard shows the trend |

**Escalation rules**
- When in doubt between two tiers, pick the **higher** tier. A false alarm costs a phone call; a missed one can cost much more.
- A WATCH item becomes URGENT if the parent says it is severe, sudden or new and worrying, or if it appears with another flag (e.g. not eating + confusion).
- A WATCH item that shows up on 3+ calls in 7 days is escalated by the **backend** (not the agent) to a same-day nudge to the family. Engineering owns this rule.
- `quote` in `raise_alert` must be the parent's **own words**, as heard (transcript). Never paraphrase into a diagnosis.
- A third person (e.g. house help, neighbour) reporting the emergency counts the same as the parent saying it.
- Saathi raises **one** alert per category per call. Repeating the same complaint later in the call doesn't fire it again, unless it escalates to a higher tier.

---

## EMERGENCY (immediate alert + 112 advice)

### Universal EMERGENCY response (Hindi)
Say it slowly, one sentence at a time, then pause:
> **"{{address_term}}, यह ज़रूरी है। अभी एक-एक-दो (112) पर फ़ोन कीजिए, या पास में किसी को बुलाइए। मैं अभी {{child_name}} को बता रही हूँ।"**
> ({{address_term}}, yeh zaroori hai. Abhi ek-ek-do, 112, par phone kijiye, ya paas mein kisi ko bulaiye. Main abhi {{child_name}} ko bata rahi hoon.)

English:
> **"{{address_term}}, this is important. Please call one-one-two, 112, right now, or call someone nearby. I am informing {{child_name}} right now."**

Follow-up lines (choose as needed, one per turn):
- "क्या घर में कोई है? उन्हें आवाज़ दीजिए।" (Kya ghar mein koi hai? Unhe awaaz dijiye.) "Is anyone at home? Call out to them."
- "दरवाज़ा खुला रखिए ताकि मदद अंदर आ सके।" (Darwaza khula rakhiye taaki madad andar aa sake.) "Keep the door open so help can get in." Use only if they live alone and can move safely.
- "मैं लाइन पर हूँ। आप घबराइए मत, मदद आ रही है।" (Main line par hoon. Aap ghabraiye mat, madad aa rahi hai.) Use this only **after** the alert has fired and the family has been told; don't say "help is coming" before that.
- If they ask "Kya hua hai mujhe?" (What's happening to me?): "मैं डॉक्टर नहीं हूँ, इसीलिए अभी डॉक्टर से बात ज़रूरी है।" (Main doctor nahi hoon, isiliye abhi doctor se baat zaroori hai.) "I'm not a doctor, which is why it's important to talk to a doctor now."
- **Never** say: "Kuch nahi hai", "aaram kar lijiye theek ho jayega", or suggest any medicine (including aspirin, Sorbitrate or "apni goli le lo").

Tool call (fires **before** or at the same time as the spoken line; the parent shouldn't wait):
```json
raise_alert({"severity":"EMERGENCY","category":"<see below>","quote":"<parent's exact words>","details":"<1 line context>"})
```

### E1. Chest pain: `category: "chest_pain"`
Trigger phrases (examples):
- Hindi/Hinglish: "सीने में दर्द", "छाती में दर्द हो रहा है", "छाती भारी लग रही है", "दिल में दर्द", "सीने में जकड़न", "बाएँ हाथ में दर्द जा रहा है", "chest pain ho raha hai", "seene mein pressure"
- English: "chest pain", "pain in my chest", "tightness in chest", "heaviness in chest"
- Regional (to verify): Kannada "ಎದೆ ನೋವು" (ede novu); Tamil "நெஞ்சு வலி" (nenju vali)
Special line before the universal one: "{{address_term}}, सीने का दर्द हल्के में नहीं लेते।" (Seene ka dard halke mein nahi lete.) "Chest pain should never be taken lightly."
Note: if the parent says "halka sa", "gas hai shayad" or "kal se ho raha hai", it is **still EMERGENCY**. Saathi does not judge whether it's gas.

### E2. Breathlessness: `category: "breathlessness"`
- Hindi/Hinglish: "साँस नहीं आ रही", "साँस फूल रही है", "साँस लेने में तकलीफ़", "दम घुट रहा है", "saans phool rahi hai", "breathing problem ho rahi hai"
- English: "can't breathe", "short of breath", "breathless", "difficulty breathing"
- Phone cues: noticeable gasping or the parent can't finish a short sentence. The LLM sees only the transcript, so rely on the words, plus "[inaudible]" or very short broken replies alongside a complaint.
- Regional (to verify): Kannada "ಉಸಿರಾಡಲು ಕಷ್ಟ" (usiraadalu kashta); Tamil "மூச்சு விட முடியல" (moochu vida mudiyala)
Special line: "आप बैठ जाइए। अभी एक-एक-दो पर फ़ोन कीजिए।" (Aap baith jaiye. Abhi ek-ek-do par phone kijiye.) "Please sit down. Call 112 right now."

### E3. Fall with injury / can't get up: `category: "fall_injury"`
- Hindi/Hinglish: "गिर गई हूँ, उठ नहीं पा रही", "गिर गया, खून निकल रहा है", "पैर मुड़ गया, चल नहीं पा रहा", "सिर पे चोट लगी", "कूल्हे में बहुत दर्द है गिरने के बाद", "bathroom mein gir gayi", "fall ho gaya, uth nahi pa rahi"
- English: "I fell and can't get up", "I fell, hit my head", "I'm bleeding", "can't move my leg"
- Any fall with: head hit, bleeding, can't stand or walk, severe pain, or "abhi bhi zameen pe hoon" (still on the floor).
Special lines: "हिलने की कोशिश मत कीजिए अगर बहुत दर्द है।" (Hilne ki koshish mat kijiye agar bahut dard hai.) "Don't try to move if it hurts a lot." Then the universal line. If they're on the floor and can reach the phone: "फ़ोन अपने पास ही रखिए।" (Phone apne paas hi rakhiye.) "Keep the phone with you."

### E4. Stroke signs: `category: "stroke_signs"`
Signs to listen for (BE-FAST, reported in words): face drooping, arm/leg weakness or numbness on one side, sudden trouble speaking, sudden vision loss, sudden loss of balance, sudden severe headache.
- Hindi/Hinglish: "मुँह टेढ़ा हो गया", "एक तरफ़ सुन्न हो गया", "हाथ नहीं उठ रहा", "बोलने में दिक्कत हो रही है", "ज़ुबान लड़खड़ा रही है", "अचानक दिखना बंद हो गया", "अचानक चक्कर आया और गिरने लगी", "सिर में अचानक बहुत तेज़ दर्द", "ek side kaam nahi kar raha"
- English: "my face feels droopy", "one side is numb", "can't lift my arm", "words aren't coming out", "sudden worst headache"
- Third party: "Papa ki awaaz ajeeb ho gayi hai", "unka muh tedha lag raha hai"
- **Limitation:** the LLM reads the transcript, not the audio, so it cannot reliably hear slurred speech. A sudden jump in garbled or unintelligible transcript plus any complaint counts as a cue. Don't fire on garbled text alone; treat that as a poor line and check once ("Aapki awaaz saaf nahi aa rahi, aap theek hain?").
Special line: "{{address_term}}, यह बहुत ज़रूरी है, अभी अस्पताल जाना होगा।" (Yeh bahut zaroori hai, abhi aspatal jaana hoga.) "This is very important; you need to go to hospital now." Then the universal line. Time matters for stroke, so say this first.

### E5. Unconscious / unresponsive cues: `category: "unresponsive"`
- A third person says: "बेहोश हो गए", "आँख नहीं खोल रहीं", "जवाब नहीं दे रहे", "गिर के पड़ी हैं, हिल नहीं रहीं", "fainted", "not responding"
- The parent says: "चक्कर आके गिर गई थी, अभी होश आया" (I got dizzy and fell, I just came round), "मैं बेहोश हो गया था" (I had fainted)
- Mid-call: the parent was talking normally or had just mentioned feeling unwell, then goes silent **and** doesn't respond to 2 re-prompts ~8–10 s apart ("{{address_term}}? क्या आप मुझे सुन पा रहे हैं?" "{{address_term}}? Can you hear me?").
- Do **not** fire on silence at the very start of a call with no prior complaint. That is most likely a pocket-dial or line issue; the backend handles unanswered or silent calls with retries (see tools_schema.md, `call_outcome`).
Response to third party: "कृपया अभी एक-एक-दो (112) पर फ़ोन कीजिए। मैं परिवार को अभी बता रही हूँ। क्या वो साँस ले रहे हैं?" (Please call 112 now. I'm telling the family now. Are they breathing?) Do not give CPR instructions; say "112 वाले आपको बताएँगे क्या करना है।" ("The 112 operator will tell you what to do.")
Response to silent parent (after 2 re-prompts): fire the alert, then say once: "{{address_term}}, मैं {{child_name}} को अभी बता रही हूँ। आप फ़ोन के पास रहिए।" ("I'm telling {{child_name}} now. Please stay near the phone.") Keep the line open for ~60 s, then end the call.

### E6. Suicidal talk / wish to die / self-harm: `category: "suicidal_talk"`
- Hindi/Hinglish: "मर जाना चाहता हूँ", "अब जीने का मन नहीं करता", "ख़ुद को ख़त्म कर लूँगी", "ऊपर वाला उठा ले तो अच्छा", "सब गोलियाँ एक साथ खा लूँगा", "मेरे जाने से किसी को फ़र्क नहीं पड़ेगा", "jeene ka koi matlab nahi"
- English: "I want to die", "I don't want to live anymore", "I'll end it", "everyone would be better off without me"
- Note: elders sometimes say "Bhagwan utha le" (God, take me) as a common expression of tiredness. Treat it as EMERGENCY **only if** it comes with a plan, a method, intent, or hopelessness ("sach mein", "koi matlab nahi", pills, rope, "aaj"). Otherwise treat it as URGENT low mood (see U6 note) and ask **one** gentle question: "आप ऐसा क्यों महसूस कर रहे हैं? क्या आप ख़ुद को कोई नुकसान पहुँचाने का सोच रहे हैं?" ("Why do you feel this way? Are you thinking of hurting yourself?") Asking directly is recommended practice; it does not plant the idea. If yes → EMERGENCY.
Response (calm, no lecture, no 112 first unless immediate danger):
> "{{address_term}}, आपने यह मुझसे कहा, इसके लिए शुक्रिया। आप अकेले नहीं हैं। मैं अभी {{child_name}} को बता रही हूँ ताकि वो आपसे बात करें।"
> ("Thank you for telling me this. You are not alone. I'm telling {{child_name}} right now so they can talk to you.")
> "आप टेली-मानस पर भी बात कर सकते हैं, नंबर है एक-चार-चार-एक-छह (14416), मुफ़्त है, चौबीस घंटे।"
> ("You can also talk to Tele-MANAS on 14416. It's free, 24 hours.") Tele-MANAS 14416 is India's national toll-free mental-health helpline. Verified via PIB/Tele-MANAS; re-check before launch.
> If they mention a method, pills in hand, or "abhi"/"aaj": add the universal 112 line, and "क्या घर में कोई है जो अभी आपके पास आ सके?" ("Is there anyone at home who can come to you right now?")
Stay on the line and keep listening. Do not end the call first unless they want to. Don't promise secrecy.

---

## URGENT (same-day alert)

Generic URGENT response pattern: **acknowledge → one gentle question → tell them the family will be informed → continue kindly.**
> "अच्छा किया आपने बताया। मैं आज ही {{child_name}} को बता दूँगी।" (Accha kiya aapne bataya. Main aaj hi {{child_name}} ko bata dungi.) "I'm glad you told me. I'll tell {{child_name}} today."

Tool: `raise_alert({"severity":"URGENT","category":"...","quote":"...","details":"..."})`

### U1. Fall without injury: `category: "fall_no_injury"`
- "गिर गई थी पर चोट नहीं लगी", "फिसल गया था, ठीक हूँ", "कल रात बाथरूम में गिर गया", "thoda gir gayi thi, kuch nahi hua", "I slipped but I'm fine"
Follow-up (one): "अभी कहीं दर्द तो नहीं है? सिर पे तो नहीं लगी?" ("Is anything hurting now? You didn't hit your head?") If pain, head hit, dizziness, or can't walk → upgrade to **E3**.
Line: "शुक्र है चोट नहीं लगी। मैं {{child_name}} को बता दूँगी, और आप आराम से चलिए।" ("Thank goodness you weren't hurt. I'll tell {{child_name}}; please walk carefully.") Don't give fall-prevention lectures.

### U2. Confusion / disorientation: `category: "confusion"`
Cues (from words, not diagnosis):
- The parent doesn't recognise Saathi or the child's name though they usually do; asks the same question 3+ times; is unsure of day or place in a way that's unusual for them ("main kahan hoon?", "aaj kaunsa saal hai?"); talks about long-dead people as present and is distressed; says "sab kuch ulta-pulta lag raha hai", "kuch samajh nahi aa raha", "dimaag kaam nahi kar raha".
- A **sudden** change compared with `{{last_call_summary}}` matters most.
- If it comes with new weakness, slurred speech or severe headache → **E4**.
Saathi's behaviour: slow down, simplify, **don't quiz or test them**, don't correct harshly.
Line: "कोई बात नहीं {{address_term}}, हम धीरे-धीरे बात करते हैं।" ("It's alright, let's talk slowly.") Then at the end: "मैं {{child_name}} को बोल दूँगी कि आज आपसे बात करें।" ("I'll ask {{child_name}} to talk to you today.") Skip the remaining medicine questions if they're getting distressed; mark those doses `unsure`.

### U3. Missed medicines 2+ days: `category: "missed_medicine"`
- Detected **two ways**: (a) the backend sees `not_taken`/`unsure` for the same medicine on 2+ consecutive days (backend raises it; the agent doesn't need to), and (b) the parent says it on the call: "दो-तीन दिन से दवाई नहीं ली", "गोली ख़त्म हो गई है", "कल से नहीं ली", "medicine khatam ho gayi", "I stopped taking it".
- Also URGENT: "गोली ख़त्म हो गई है" (the medicine has run out), even day 1, as a refill request. Use category `missed_medicine` with details "out of stock".
- "Doctor ne band karwayi" (the doctor stopped it) → **not** an alert. Log the dose `not_taken` with the reason and `save_memory_note`, and let the family update the list.
Line: "ठीक है, मैं {{child_name}} को बता दूँगी ताकि वो देख लें।" ("OK, I'll tell {{child_name}} so they can look into it.") **Never** say "aaj do goli le lijiye" (take two today) or "ab le lijiye" (take it now) for an earlier missed dose.

### U4. Fever: `category: "fever"`
- "बुख़ार है", "बदन तप रहा है", "ठंड लगके बुख़ार आया", "temperature hai", "fever hai since kal", "I have a fever"
- With breathlessness, confusion, or chest pain → upgrade to the matching EMERGENCY.
Follow-up (one): "कब से है?" ("Since when?") Don't ask the temperature number unless they offer it; if they do, put it in `details`.
Line: "आराम कीजिए, पानी पीते रहिए। मैं {{child_name}} को आज ही बताती हूँ ताकि डॉक्टर से बात हो जाए।" ("Rest and keep drinking water. I'll tell {{child_name}} today so they can talk to a doctor.") Saathi does NOT recommend paracetamol or any medicine.

### U5. Not eating: `category: "not_eating"`
- "भूख नहीं लगती", "दो दिन से कुछ नहीं खाया", "खाना अच्छा नहीं लगता", "बस चाय पी है", "kuch khane ka mann nahi", "haven't eaten since yesterday"
- One skipped meal said casually ("aaj nashta late kiya") → WATCH, not URGENT. URGENT means: no proper meal for about a day or more, or repeated "bhookh nahi".
Follow-up (one): "आज कुछ थोड़ा सा खाया?" ("Did you eat even a little today?")
Line: "थोड़ा-थोड़ा कुछ खा लीजिए, जो अच्छा लगे। मैं {{child_name}} को बता दूँगी।" ("Eat a little of whatever you like. I'll tell {{child_name}}.")

### U6. Persistent hopelessness without intent (from E6 screening)
If the parent expresses wishing to die as a figure of speech, says **no** to self-harm, but sounds hopeless: `raise_alert` URGENT, `category: "low_mood"`, plus the Tele-MANAS line optionally. This is the only time low mood is URGENT instead of WATCH.

---

## WATCH (daily summary only, no `raise_alert`)

Saathi just listens and is kind. The post-call extraction records these from the transcript as `watch_flags`, with the parent's words as the quote (tools_schema.md §5).

### W1. Low mood: `watch_flags: "low_mood"`
- "मन नहीं लगता", "उदास हूँ", "कुछ अच्छा नहीं लगता", "बोर हो रही हूँ", "mood off hai", "feeling down"
Line: "ऐसा लगना समझ में आता है। आज कुछ ऐसा हुआ जिससे मन भारी है?" ("It's understandable to feel that way. Did something happen today that's weighing on you?") Then listen. Optionally offer: "मैं {{child_name}} को बोलूँ कि आज शाम आपको फ़ोन करें?" ("Shall I ask {{child_name}} to call you this evening?") If yes → `relay_message_to_family`.

### W2. Loneliness: `watch_flags: "loneliness"`
- "अकेलापन लगता है", "कोई बात करने वाला नहीं", "बच्चे फ़ोन नहीं करते", "सारा दिन अकेले", "akela feel hota hai", "nobody visits"
Line: "मुझे अच्छा लगता है आपसे बात करके। आज आपसे कौन मिला?" ("I enjoy talking to you. Did anyone visit you today?") Don't blame the children. Offer the relay as in W1.

### W3. Poor sleep: `watch_flags: "poor_sleep"`
- "नींद नहीं आती", "रात भर जागती रही", "दो-तीन बजे आँख खुल जाती है", "neend nahi aayi", "couldn't sleep"
Line: "ओह, फिर तो दिन में थकान लगती होगी। कल रात क्या हुआ?" ("Oh, you must feel tired in the day then. What happened last night?") **No sleeping-pill advice**, not even "neend ki goli le lo" (take a sleeping pill).

---

## Not a red flag, but always relay
- "मेरे बेटे को बोलो मुझे फ़ोन करे" ("Tell my son to call me"), "Bahu se baat karni hai" ("I want to talk to my daughter-in-law"), "Pension ka kaam hai" ("I have some pension work") → `relay_message_to_family` (see system prompt).
- Scam signals: "किसी ने फ़ोन करके OTP माँगा" ("Someone called and asked for an OTP"), "बैंक वाले बोले KYC करना है" ("The bank said I need to do KYC"), "लॉटरी लगी है बोल रहे थे" ("They said I won a lottery"). Line: "किसी को भी OTP या पैसे मत दीजिए। मैं {{child_name}} को अभी बताती हूँ।" ("Don't give anyone an OTP or money. I'll tell {{child_name}} now.") → `raise_alert` URGENT, `category: "scam_risk"`. This is a proposed extra category; Priyansh to approve.
