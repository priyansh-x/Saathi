# Product open questions for Priyansh (v0.1, Sat 17 Oct 2026 IST)

Each item has a **recommendation** and **what it blocks**. Proposed defaults are design assumptions, not research findings. Ordered by how soon they block the build (demo target Mon Oct 26).

## A. Decide this weekend (blocks templates and the build)

1. **Is the dashboard in the MVP?**
   Recommendation: **Yes, but thin.** WhatsApp is the product; a magic-link web view with 4 screens: Today, History (calendar), Call detail, Alert detail. Settings shown read-only, with edits done through WhatsApp chat. Skip logins and passwords. It costs ~2–3 dev-days (estimate) and gives judges something to look at. *Blocks:* friend's build plan (M4); whether the briefing template gets a URL button (templates need submitting ~Oct 21).

2. **Neighbour flow in the MVP?**
   Recommendation: **Yes for the demo, in its simplest form:** neighbour opt-in (YES reply) + one alert template with 2 quick-reply buttons + an ack broadcast to the child. **Cut for now:** auto voice calls to the neighbour, "Is she OK?" follow-up, re-alert loops. The neighbour is in the one-line brief ("escalate to child AND a neighbour"), so the demo should show it. *Blocks:* the escalation state machine; 2–3 extra templates.

3. **Pilot languages.**
   Recommendation: **Parent voice: Hindi + Hinglish + English** at launch (matches plan.md decision 2). Add Kannada or Tamil only for a pilot family who needs it, after a native speaker reviews the lines. **Child WhatsApp: English + Hindi templates** (Devanagari). Consider a Hinglish (Roman) template set too, since many urban children may read that faster [A]. *Blocks:* how many templates to submit (each language is a separate template).

4. **Product name.** The PRD defers it; code and copy currently say "Saathi".
   - The name is spoken on every call ("Main Saathi bol rahi hoon"), so it has to be easy to say in every target language and sound like a person, not a company.
   - Before committing, check that it's free (trademark, WhatsApp display-name approval, domain). "Saathi" is a common word and is probably already used by other Indian products and schemes. I haven't checked.
   - Alternatives to test by voice with 2–3 elders: "Saathi", "Sakhi" (female-only), "Apna", "Roz" ("daily").
   - Recommendation: keep "Saathi" for the buildathon and decide after the pilot.
   - *Blocks:* WhatsApp Business display name (Meta reviews it), the intro script, and the template copy (the name appears in footers).

5. **WhatsApp route (plan.md decision 4).** Product copy assumes templates with quick-reply + URL buttons. If the Bolna WhatsApp beta can't do buttons or two-way replies, the ack loop has to fall back to "reply 1 / 2". *Blocks:* final template format.

## B. Decide before onboarding real families (~Oct 23)

6. **Missed-call ladder timings.** Proposed: calls at T, T+10, T+25 → soft notice to child at T+30 → last try T+45 → neighbour + voice call to child at T+60 if nobody has acked. Is 1 hour too slow (worry) or too fast (false alarms, annoyed neighbours)? Recommendation: ship these defaults, make them per-family settings, log every escalation in the pilot.
7. **Auto-escalate to the neighbour on a missed call, or only when the child taps "Ask neighbour"?** Recommendation: auto at T+60 by default, child can turn it off at onboarding. Some families won't want to trouble a neighbour over a phone on silent [A].
8. **Who can change the call time or skip a day?** Recommendation: the parent can, by voice ("kal mat karna", "nau baje karna"), and the child is informed. That respects her autonomy. The alternative is that the child must confirm.
9. **Call recordings and audio playback for the child.** This is sensitive: the parent's voice and health mentions. Recommendation: off unless the parent says yes on the intro call; summaries and short quotes are always shown. Needs a DPDP Act 2023 check (the parent is the data principal and the child can't consent for her). *Blocks:* storage, the dashboard audio player, intro script beat 7.
10. **Consent record.** Is a voice "haan" on the intro call (logged with timestamp and audio snippet) plus written consent from the child enough for the pilot? Recommendation: yes for the pilot, with a one-page explainer (plan.md M3). Get proper legal advice before any paid launch.
11. **Daily "all good" message vs alerts only.** Meela texts families only when something is concerning. We propose a daily 2-line briefing even on good days, on the assumption that Indian families want the daily ritual and that silence makes people anxious [A]. Test in the pilot by asking families after week 1 whether they'd keep it daily.
12. **Siblings.** Default: alerts + weekly summary, with the daily briefing opt-in (each daily template is charged, per Meta's Oct 2026 pricing). OK?
13. **Two parents in one home** (and a shared phone). One call for both, or two? Recommendation for the MVP: one parent profile per phone number. If the spouse answers, Saathi notes it and asks for the parent.

## C. Can wait until after submission

14. **Inbound calls.** Should the parent be able to call Saathi back ("call me back the same number", as Meela does)? This needs a sponsored or KYC'd Indian number (context.md). For the MVP, outbound only.
15. **Emergency auto-calls to the child:** 1 voice call or up to 3? And DTMF/voice ack on the call ("say haan to confirm")?
16. **Neighbour channel fallback:** SMS or voice for neighbours without WhatsApp?
17. **Weekly summary:** day, time, and whether to include a "share with doctor" PDF.
18. **Owner for conversation design** (persona, intro script, red-flag lines). plan.md lists this as unowned. The intro/consent call script in ux_spec.md J2 needs a final version in `voice/`.
19. **Scam-risk alert category** (`scam_risk`) from red_flags.md: approve it as URGENT?

## Assumptions to validate in the pilot (log real answers only)
- Parents pick up an unknown number reliably if the child has told them beforehand and the number is saved.
- Children want a daily message, not alerts only.
- Neighbours will opt in and respond within ~15 minutes.
- Most missed calls are benign (silent phone, out of the house).
- A 2–5 minute call doesn't feel too short or too long for the parent.
