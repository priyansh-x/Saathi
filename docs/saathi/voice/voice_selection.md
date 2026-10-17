# Voice selection: Sarvam vs Cartesia for Hindi elder-friendly calls

Researched 17 Oct 2026 (IST) from public docs. Voice names and IDs below come from the cited pages. **No listening tests have been run yet.** The recommendation is a starting shortlist, to be confirmed by ear on a real phone line (8 kHz) with the team and pilot families.

## What matters for Saathi's voice
1. **Clarity on a phone line for older ears**: unhurried, mid-to-low pitch, clear consonants, not breathy or "ad-like".
2. **Warmth without sounding salesy**: "companion" or "customer-warm" styles over "ads", "sales" or "recovery".
3. **Natural Hindi and Hinglish**, plus correct Indian names (Pihu, Sushila, Telma, Metformin).
4. **Kannada/Tamil coverage** for the regional-language demo.
5. **Pace control** (target 0.85–0.9×) and low latency in Bolna.

## Side-by-side

| | **Sarvam Bulbul** (via Bolna) | **Cartesia Sonic** (via Bolna) |
|---|---|---|
| Models on Bolna | `bulbul:v4-flash` (newest, lower first-audio latency than v3, 9 languages) and `bulbul:v3` (all 11 incl. Malayalam, Odia) [1] | `sonic-3`, `sonic-3.5`, `sonic-3.6` (recommended for production) [2] |
| Indian languages | 10 Indian + English. v4 Flash has no Malayalam/Odia voices; use v3 for those [1][3] | 44 languages incl. hi, kn, ta, te, ml, mr, bn, gu, pa; Odia/Urdu not yet selectable in Bolna [2][4] |
| Hindi voice depth | 129 v4 Flash Hindi voices incl. 13 Hindi-English (`_enhi_`) code-mixed ones [1]; dedicated **companion** personas (below) [5] | Hindi voices in public third-party listings: "Hindi Narrator Woman", "Hindi Narrator Man", "Hindi Calm Man", "Hindi Reporter Man", "Hinglish Speaking Lady", "Indian Lady", "Indian Man", "Indian Customer Support Lady" [6][7]. Cartesia's own featured agent picks are English voices [8]. Many voices accept a `standard-hindi` accent [9] |
| Kannada / Tamil voices | Thin: Kannada 4 (`chaitra_kn_conversation`, `chetan_kn_conversation`, `chaitra_kn_narration`, `suchitra_kn_narration`); Tamil 4, all male narration/ads (`gokul_ta_narration`, `vijay_ta_narration`, `aravind_ta_ads`, `aravind_ta_suspense`) [1][5]. Bolna's 16 v3 voices work in every language [1] | Tamil and Kannada supported by Sonic 3.6 [4]; specific native voices not verified here (need Cartesia/Bolna voice list) |
| Hinglish | Native via `_enhi_` personas. **Write Hindi in Devanagari, English in Latin**; romanised Hindi "significantly reduces output quality" [3][10] | Sonic 3.6 has expanded support for Latin-script Hindi, Devanagari, and Devanagari + English loanwords; set `language: hi` [4][11] |
| Script sensitivity in Bolna | On v4 Flash the spoken language follows the **script of the text**, not the `language` field [1] | Language follows `language`/`locale`; one language per request, except Hinglish, where mixing is supported [12] |
| Pace / prosody | Bolna exposes `speed` 0.5–2.0 only (no temperature/dict) [1]. Sarvam's API also has pitch/loudness on v4 Flash and recommends pace 0.8–0.9 for accessibility content [10] | Bolna exposes speaking rate and volume [2] |
| Telephony | Sarvam supports 8 kHz output [10] | Fast enough for live phone calls per Bolna [2] |
| Voice cloning | Not exposed via Bolna (Bolna custom-voice upload is ElevenLabs/Cartesia only) [13] | Custom voice upload/cloning supported in Bolna [13]. **Don't** clone a family member's voice for the demo; it conflicts with "never pretend to be the child" |
| Sponsor angle | Sarvam is a buildathon sponsor (context.md) | Cartesia is a buildathon sponsor (context.md) |

**Lifecycle note:** Sarvam announced Bulbul **v3 end-of-life on Sarvam's own Voice Agents product on 10 Nov 2026** (v3 stays on Sarvam's TTS API) [14]. Bolna still lists v3 [1]. Start on v4 Flash anyway, so the demo isn't affected if Bolna follows.

## Shortlist to audition

### Sarvam `bulbul:v4-flash`, Hindi (primary candidates)
All IDs are from Sarvam's voice catalog [5]. Style labels come from the ID; the voice quality judgements are pending listening.
| Voice ID | Style | Why it's on the list |
|---|---|---|
| `roopa_hi_companion` | companion | Companion style is the closest match to Saathi |
| `shalini_hi_companion` | companion | Same; second female option |
| `suman_hi_companion` | companion | Same; third female option |
| `ritu_hi_customer_warm` | customer, warm | "Warm" variant of a mainstream voice |
| `aparna_hi_customer` | customer | Sarvam's #1 expert pick for Hindi "customer care & empathetic support" [10] |
| `ratan_hi_latenight_warm` | latenight, warm (male) | Male option if a family prefers a male voice (switch `agent_gender`) |
Hinglish (urban parents): `shalini_enhi_companion`, `simran_enhi_companion`, `ishita_enhi_companion`, `sanchita_enhi_companion`, `shubh_enhi_companion` (male) [5].
Kannada: `chaitra_kn_conversation` (F), `chetan_kn_conversation` (M) [5].
Tamil: no conversational/female v4 voice found in the catalog, so audition Bolna's v3 voices in Tamil (e.g. `priya`, `kavya`, `ritu`, tagged "Conversational" female [1]) against Cartesia Tamil.

### Cartesia `sonic-3.6` (comparison / fallback)
| Voice | ID (from third-party listing; confirm in Bolna's dropdown) |
|---|---|
| Hindi Narrator Woman | `c1abd502-9231-4558-a054-10ac950c356d` [6][7] |
| Hindi Calm Man | `ac7ee4fa-25db-420d-bfff-f590d740aeb2` [6][7] |
| Hinglish Speaking Lady | `95d51f79-c397-46f9-b49a-23763d3eaa2d` [7] |
| Indian Customer Support Lady | `ff1bb1a9-c582-4570-9670-5f46169d0fc8` [6] |
These names/IDs come from SignalWire's and Interactly's Cartesia catalogs, not Cartesia's own docs. Before relying on them, check in Bolna's Languages tab (or Cartesia `GET /voices?language=hi-IN` with our key [9]).

## Recommendation
1. **Primary: Sarvam `bulbul:v4-flash` for Hindi/Hinglish.**
   - It has the deepest Hindi catalog, including **companion-style personas** built for exactly this tone.
   - It handles native Hinglish and Indian names, and gives the strongest "made for India" story with a sponsor.
   - Start with `roopa_hi_companion` vs `shalini_hi_companion` vs `ritu_hi_customer_warm` at speed **0.85–0.9**.
   - The LLM must output Devanagari + Latin English (already in the system prompt).
2. **Kannada: Sarvam `chaitra_kn_conversation`.** **Tamil: A/B Sarvam v3 (female conversational) vs Cartesia sonic-3.6.** Bolna allows a different provider, model and voice per language on one multilingual agent [13], so mixing providers is fine.
3. **Keep Cartesia `sonic-3.6` as the fallback/A-B for Hindi**, particularly if Sarvam latency or line quality disappoints, or if the LLM keeps slipping into romanised Hindi (which Cartesia tolerates better [11]).
4. **How to decide (about 1 hour, before the pilot):**
   - Render the same 6 lines (greeting, memory question, medicine question, praise, the EMERGENCY line, goodbye) in each shortlisted voice.
   - Play them over a real phone call at 8 kHz, not laptop speakers.
   - Rate clarity, warmth and "would Nani like this?" with 2–3 elders from the team's own families.
   - Record only what they actually say; don't summarise it into a score you didn't measure.
   - Pick one female default and one male alternative per language.
5. Check pronunciation of medicine names (Telma, Metformin, Ecosprin…) and family names. Bolna doesn't expose Sarvam's pronunciation dictionary [1], so fix tricky words in the `medicines` text the backend sends (e.g. a Devanagari spelling).

## Sources
1. Bolna, Sarvam TTS: https://www.bolna.ai/docs/sarvam-voice
2. Bolna, Cartesia: https://www.bolna.ai/docs/cartesia
3. Sarvam, Bulbul model page: https://docs.sarvam.ai/api/getting-started/models/bulbul.mdx
4. Cartesia, Sonic 3.6: https://docs.cartesia.ai/build-with-cartesia/tts-models/latest
5. Sarvam, Voices catalog: https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/voices.md
6. SignalWire, Cartesia voice table (third-party): https://signalwire.com/docs/platform/voice/tts/cartesia
7. Interactly, vendor voices incl. Cartesia Hindi (third-party): https://docs-dev.interactly.ai/vendors/voices
8. Cartesia, Choosing a Voice: https://docs.cartesia.ai/build-with-cartesia/capability-guides/choosing-a-voice
9. Cartesia, List Voices / Add Accents API: https://docs.cartesia.ai/api-reference/voices/list · https://docs.cartesia.ai/api-reference/voices/add-accents
10. Sarvam, Bulbul v4 Flash best practices: https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/best-practices.md
11. Cartesia, Advanced capabilities (Hinglish): https://docs.cartesia.ai/build-with-cartesia/capability-guides/advanced-capabilities
12. Cartesia, Multilingual voices: https://docs.cartesia.ai/build-with-cartesia/capability-guides/multilingual-voices
13. Bolna, Audio/Languages tab: https://www.bolna.ai/docs/agent-setup/audio-tab
14. Sarvam, Voice Agents voice & language (v3 EOL notice): https://docs.sarvam.ai/voice-agents/build/voice-language
Also used: Bolna supported languages and auto-detection: https://www.bolna.ai/docs/customizations/supported-languages
