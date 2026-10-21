# Context: Saathi for the Bolna x YC Voice AI Buildathon

Historical notes from the Oct 2026 buildathon. Current product behaviour lives in the rest of `docs/` and in the code.

## The hackathon
- **Bolna x Y Combinator "Path to YC" Voice AI Buildathon.** Virtual build, any idea, as long as voice is a core part of it.
- **Timeline:** build Oct 15–31, 2026 (submission deadline Oct 31) -> shortlist Nov 3 -> interviews Nov 5–7 -> finalists Nov 8 -> top 3 pitch live at Symphony, Abhyas Hall, The Lalit Ashok, Bengaluru on Nov 20.
- **Prizes:** 1st: ₹50,000 + an interview with YC partner Grey Baker. 2nd: ₹40,000. 3rd: ₹30,000. Travel covered for the top 3.
- **Sponsors / stack options:** Bolna (voice agent platform), Plivo and Exotel (telephony), Sarvam (Indian-language speech-to-text and text-to-speech), Cartesia, Deepgram, Kalpa Labs.
- **What Bolna gives us:** outbound and inbound phone calls, scheduled batch calls with retries, tool and API calls during a call, knowledge bases, mid-call language switching across English and Indian languages, and WhatsApp workflows (beta).
- **Note:** Indian phone numbers need compliance (KYC) verification before going live, so start that early.

## YC Request for Startups: aging population
YC's Fall 2026 Requests for Startups include tech for the aging population, specifically calling for voice interfaces that can hold real conversations with older adults. Many elders won't use apps or chatbots, but they always pick up a phone call.

## The idea: Saathi
A daily AI phone companion for India's aging parents, built on Bolna.
- Calls the parent every day at a time they choose, in their language (Hindi, Kannada, Tamil, etc.), and can switch languages mid-call.
- Chats warmly and remembers past calls (health, family, routine).
- Reminds them to take their medicines and logs whether each dose was taken.
- Listens for red flags such as a fall, chest pain, confusion or low mood, and alerts the children right away.
- Sends the children, often living in another city, a short daily WhatsApp summary.
- Lets the parent ask for things in plain speech ("tell my son to call me").
- Simple family dashboard: mood over time, missed medicines, call history.
- Framed as companionship and reminders, not medical diagnosis.

## Demo goal (2 weeks)
A live call with a real grandparent, a WhatsApp summary arriving, and a red-flag alert firing. Pilot with 5 to 10 real families before Oct 31.
Suggested stack: Bolna + Sarvam + Plivo/Exotel, with a thin backend (FastAPI + Supabase) for schedules, call logs and the dashboard.

## Team and working rules
- Builders: Priyansh Joshi (BITS Pilani EEE undergrad, intern at Samora AI, YC W26, which builds voice agents) and a friend. Priyansh is the decision-maker.
- Shared folder: /workspace/saathi/ (all specs, plans, code notes and pitch drafts live here). Research so far: voice_ideas.md, idea_critique.md.
- Phone numbers: as students you likely can't rent an Indian number (Bolna/Plivo need CIN + GST). For the demo and pilot, use a Bolna trial account: add each test grandparent's number under Verified Numbers and omit from_phone_number in the call API (Bolna's default Indian number, up to 2 concurrent calls, $5 free credit). Ask the organisers about a sponsored number for inbound calls.
- No conflict with Samora AI: Saathi stays out of e-commerce/D2C cart recovery.
- Never send messages, emails or posts to anyone outside this team; draft them for Priyansh to send.
- Don't nag Priyansh with unprompted reminders (e.g. pilot recruitment); report progress when asked or at real milestones.
- Never invent data, quotes, users or metrics. Health framing: companionship and reminders, not diagnosis.
