# Saathi credits and budget (estimate)

Drafted Sat 17 Oct 2026, 10:30 AM IST. Every figure below is an **estimate** built from the rates in `engineering/bolna_api_notes.md`. None of it is measured spend. Re-check against the Bolna wallet ("remaining minutes") after the first 5 test calls.

## 1. What credits we actually have

| Source | What's published | Status |
|---|---|---|
| Bolna trial account | $5 free credit; Verified Numbers only; up to 2 concurrent calls (bolna_api_notes.md §10) | ✅ documented |
| Buildathon sponsor credits (Plivo, Exotel, Sarvam, Cartesia, Deepgram, Kalpa Labs) | Bolna's buildathon post names these sponsors as giving credits ([TipRanks summary of the post](https://www.tipranks.com/news/private-companies/bolna-launches-buildathon-to-deepen-engagement-in-voice-ai-ecosystem)). I found **no published amounts and no claim process**. | **Unconfirmed. Priyansh to confirm** (organiser Discord/email/Luma) |
| Symphony summit registration (20 Nov, Bengaluru) | "$100 in Bolna credits, a free 3-month Wispr Flow subscription and 2,500 in Sarvam credits" ([bolna.ai/symphony](https://www.bolna.ai/symphony)). Bolna's LinkedIn says this goes to the first 200 attendees at the door. Top-10 buildathon teams get Symphony tickets. | Arrives **after** the 31 Oct submission, so it can't fund the build. Whether buildathon participants get it earlier is **unconfirmed** |
| Meta WhatsApp Cloud API test number | Free; up to 5 verified recipients (notes §9) | ✅ per notes (third-party quotes of Meta docs) |

Plan on **$5 of Bolna credit plus whatever Priyansh tops up** until sponsor credits are confirmed in writing.

## 2. Voice cost (Bolna)

**Known rate:** $0.06/min (₹5.52/min) Voice-AI flat rate. It includes Sarvam STT/TTS and the preferred LLMs (e.g. `gpt-4.1-mini`) (notes §4).
**Unknown:** telephony and platform fee are billed **separately** and I couldn't find the trial figure (notes §4). The numbers below are **Voice-AI only**, so real spend is higher. Read the true per-minute cost off the wallet after the first calls.

Assumptions (labelled estimates):
- Dev/QA: the 10 scripts in voice/test_scripts.md, each run 3–6 times, plus tool and webhook debugging.
- Demo filming: staged red-flag call, missed-call run, real grandparent call, plus retakes.
- Pilot: 1 call/day, Oct 24–31 = **8 days**.
- Alert calls: short (~1 min) Bolna calls to the child on EMERGENCY.
- Missed/no-answer attempts are treated as ~0 billed minutes. **Verify on trial first.**

| Bucket | Low case | High case |
|---|---|---|
| Dev/QA | 30 calls × 3 min = 90 min | 60 calls × 4 min = 240 min |
| Demo filming | 8 calls × 4 min = 32 min | 15 calls × 5 min = 75 min |
| Pilot | 5 families × 8 days × 3 min = 120 min | 10 families × 8 days × 5 min = 400 min |
| Alert calls to child | 10 × 1 min = 10 min | 20 × 1 min = 20 min |
| **Total minutes** | **252 min** | **735 min** |
| **× $0.06/min** | **≈ $15.12 (≈ ₹1,391)** | **≈ $44.10 (≈ ₹4,057)** |

- The $5 trial credit ≈ 5 / 0.06 ≈ **83 Voice-AI minutes**, fewer once telephony is added. That covers roughly the dev/QA bucket, not the pilot.
- **Gap to fund:** ≈ $10–40 Voice-AI-only, plus telephony. Either Priyansh tops up the wallet or sponsor credits arrive.
- Trial constraint: every pilot parent's number has to be added as a Verified Number. The maximum count isn't verified (notes §10). With 2 concurrent calls, stagger pilot call times by ≥10 min.

## 3. Other providers (only if credits make them free)
- Bolna's docs list Deepgram `nova-2/nova-3` (ASR) and Cartesia `sonic-*` (TTS) as preferred models, already **inside** the $0.06/min rate (raw docs snapshot `_research/pages/pricing__preferred-models.md`; not yet in bolna_api_notes.md, so **verify in the wallet's Add Funds → Show models panel**). Used through Bolna, Deepgram/Cartesia credits save nothing. BYOK keys are billed at variable rates (same page), so plugging our own credited key in saves money only if Bolna then drops that component. **Unverified.**
- Default: **Sarvam via Bolna** (saaras:v4 + bulbul:v4-flash). Cartesia sonic-3.6 stays a voice-quality A/B only (voice/voice_selection.md).
- Plivo/Exotel credits only matter if we buy a number. Indian numbers need DLT/KYC (CIN) (notes §10). Not planned for the buildathon.

## 4. WhatsApp
- **Meta Cloud API test number: ₹0.** Limit is 5 verified recipients. 5 pilot families × (child + neighbour) = 10 recipients, which exceeds 5. Options: a spare SIM registered as a second test number on the same Meta app (notes §9), or only children get WhatsApp and neighbours get an email/SMS fallback. **Priyansh to decide.**
- If we move to a real WABA number: utility templates are charged per message from 1 Oct 2026. The only rate in our notes is AiSensy's quoted India utility rate of **₹0.145/msg** (notes §9, external, not Meta's direct rate). Estimate: 10 families × 8 days × ~1.5 msgs ≈ 120 msgs ≈ **₹17**. Negligible.
- Email fallback: any free transactional email tier (e.g. Resend). **Limits not checked.**

## 5. Hosting and data
- Next.js app on a free hobby tier (e.g. Vercel) + Supabase free tier: **₹0 expected**. Free-tier limits (cron frequency, project pausing on inactivity) are **not verified here**. Check before relying on them for the daily scheduler.
- A public HTTPS URL is required for Bolna tool calls and webhooks. If our host has an IP allowlist, it must include Bolna's IPs 13.203.39.153, 13.126.9.249 and 13.202.133.53 (notes §7).

## 6. Spend controls (also in the Cursor master prompt)
- `MOCK_BOLNA=1` and `MOCK_WHATSAPP=1` by default in dev and tests. Real calls need an explicit flag plus the allowlist.
- `CALL_BUDGET_MINUTES_DAILY` (suggest 20 in dev, 60 in pilot) and `MAX_CALL_SECONDS` (suggest 300). The backend refuses to dial once today's estimated minutes reach the cap.
- Test calls: ≤3 min, against Priyansh's own verified number.
- `GET /user/me` returns the wallet balance (notes §1). Show it on an internal `/admin` status line and stop dialling below a floor (e.g. $1).
