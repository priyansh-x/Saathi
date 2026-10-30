/** All marketing copy. Same keys will be used for `hi` later. */

export const content = {
  meta: {
    title: "Saathi: a morning phone call for your parents",
    description:
      "Most of India's elders will not download an app, but they always pick up the phone. Saathi is a warm morning call on the phone they already own. You get two lines on WhatsApp.",
  },
  nav: {
    logo: "Saathi",
    glyph: "स",
    links: [
      { href: "#listen", label: "Hear it" },
      { href: "#people", label: "How it works" },
      { href: "#desk", label: "Family desk" },
      { href: "#faq", label: "FAQ" },
    ],
    cta: "Family desk",
    skip: "Skip to content",
  },
  hero: {
    h1: "Your parents won't download an app. They'll always pick up the phone.",
    sub: "Saathi is a warm morning call to an aging parent, on the phone they already own, in their language. You get two lines on WhatsApp.",
    cta: "Open the family desk",
    secondary: "Hear a morning call",
    trust: [
      "Any phone, including a basic one",
      "Hindi and English today. More languages soon.",
      "Companionship, never diagnosis",
    ],
    callTitle: "Saathi",
    callStatus: "On a morning call",
    callClock: "02:14",
    callLine: "Namaste Maa, neend achhi aayi?",
    callLineLang: "Hindi",
    example: "Example",
    briefingLabel: "What lands on WhatsApp",
  },
  listen: {
    h2: "Hear a morning call.",
    sub: "A short companion call. Then two lines on WhatsApp.",
    tag: "Example call",
    caller: "Saathi to Maa",
    languages: [
      { id: "hi", label: "Hindi", live: true },
      { id: "en", label: "English", live: true },
      { id: "mr", label: "Marathi", live: false },
      { id: "ta", label: "Tamil", live: false },
      { id: "kn", label: "Kannada", live: false },
    ],
    transcripts: {
      hi: [
        { who: "saathi" as const, text: "Namaste Maa! Abhi do minute baat kar sakte hain?" },
        { who: "maa" as const, text: "Haan beta, bolo." },
        { who: "saathi" as const, text: "Aaj tabiyat kaisi hai? Kal ghutne mein dard tha." },
        { who: "maa" as const, text: "Ghutne ka dard aaj kam hai. Subah park tak gayi thi." },
        { who: "saathi" as const, text: "Bahut accha. Subah wali BP ki goli le li?" },
        { who: "maa" as const, text: "Haan, le li." },
      ],
      en: [
        { who: "saathi" as const, text: "Good morning. Have you got two minutes?" },
        { who: "maa" as const, text: "Yes, beta. Tell me." },
        { who: "saathi" as const, text: "How are the knees today? Yesterday they hurt." },
        { who: "maa" as const, text: "Better. I walked to the park this morning." },
        { who: "saathi" as const, text: "Did you take the morning BP tablet?" },
        { who: "maa" as const, text: "Yes, I took it." },
      ],
    },
    briefing:
      'Saathi update for Rohit: spoke with Kamla at 8:04 AM IST. Medicines: took both tablets (BP, sugar). Kamla said: "Ghutne ka dard aaj kam hai." No concerns today.',
    briefingFooter: "Reply STOP to opt out.",
    briefingTime: "8:06 AM",
    soon: "soon",
    callClock: "02:14",
    example: "Example",
    toYou: "Then this lands",
  },
  people: {
    h2: "Three people. One morning.",
    sub: "The parent never installs anything.",
    items: [
      {
        who: "Parent",
        title: "Just answers the phone",
        body: "A scheduled morning call on the phone they already own, any phone, including a basic one. Hindi or English today. The call checks they are up, asks about sleep, each medicine by name, mood, and red flags such as chest pain or a fall.",
      },
      {
        who: "Child",
        title: "Two lines, then the desk",
        body: "After the call, a short WhatsApp briefing. If something is wrong, an instant Act now WhatsApp and a push to the phone. The family desk on the web or Android holds Today, History, Alerts, Settings, summaries and transcripts.",
      },
      {
        who: "Neighbour",
        title: "Only when needed",
        body: "A neighbour is asked only if the family opted them in. They get a WhatsApp when a call is missed after the full retry, or when a red flag is raised. They do not see medicines, mood, or the transcript.",
      },
    ],
    toolsTitle: "On the call today",
    tools: [
      { title: "Medicine check", body: "Each tablet by name. Logged, never prescribed." },
      { title: "Safety alerts", body: "Emergency and urgent tiers, in the parent's words." },
      { title: "Memory notes", body: "A short note carried into the next morning." },
      { title: "A message home", body: "The parent can relay a line to the family on WhatsApp." },
      { title: "Refill request", body: "Can raise a refill. Mock partner only. No real pharmacy is named." },
    ],
  },
  safety: {
    h2: "When something is wrong",
    sub: "A calm ladder. The family hears first.",
    emergencyTitle: "A red flag on the call",
    emergencySteps: [
      "The call tells the parent to call 112, or someone nearby.",
      "Saathi never dials 112, and never diagnoses.",
      "The child gets an instant Act now WhatsApp and a push.",
      "If a neighbour has opted in, they get a WhatsApp too.",
    ],
    missedTitle: "If the parent does not pick up",
    missedSteps: [
      "Saathi rings again at 10 minutes, then at 25.",
      "At 30 minutes the child gets a WhatsApp that the call was missed, and when the next ring is.",
      "One last ring at 45 minutes.",
      "At 60 minutes this becomes an Act now alert for the child, and for an opted-in neighbour.",
    ],
    disclaimer: "Saathi is not an emergency service. Call 112.",
  },
  desk: {
    h2: "The family desk",
    sub: "Today, History, Alerts and Settings. Call summaries and transcripts. Web and Android.",
    exampleCta: "Open the example household",
    exampleNote: "Labelled Example. Test data only.",
    shots: [
      {
        src: "/images/desk/today-en.png",
        alt: "Example family desk Today screen, showing an Act now chest-pain alert for Maa and morning medicines.",
        label: "Today",
      },
      {
        src: "/images/desk/alerts-en.png",
        alt: "Example family desk Alerts screen, listing chest pain, a fall, and missed calls. All labelled Example.",
        label: "Alerts",
      },
      {
        src: "/images/desk/history-en.png",
        alt: "Example family desk History screen, with seven days of answered and missed morning calls.",
        label: "History",
      },
    ],
    waTitle: "The Act now WhatsApp",
    waBody:
      'Saathi alert for Rohit: on today\'s call at 8:09, Kamla said "Bathroom mein gir gayi, uth nahi pa rahi." Please call Kamla now. If you cannot reach them, call 112. Saathi is a companion call, not a medical service.',
    waTime: "8:09 AM",
    waTag: "Example WhatsApp",
  },
  why: {
    h2: "Why voice, why now",
    facts: [
      {
        stat: "156.7 million",
        body: "people in India aged 60 and over (WHO South-East Asia, 2024).",
        href: "https://www.who.int/southeastasia/health-topics/ageing",
        source: "WHO SEARO, 2024",
      },
      {
        stat: "193 million",
        body: "expected by 2030 (UNFPA, 2025). Most of them will not download an app. They will pick up a ringing phone.",
        href: "https://www.unfpa.org/ageing",
        source: "UNFPA, 2025",
      },
    ],
    close: "Voice is the interface they already trust.",
  },
  bet: {
    kicker: "Our bet",
    h2: "Once a parent trusts that voice, it can grow.",
    body: "Today Saathi is one small daily habit: a morning companion call. Our bet is that the same voice becomes a personal agent that gets real things done for them, entirely over a phone call. Asking for a refill. Booking a visit. Calling the family. The parent still never installs anything.",
    close: "Companionship, never diagnosis.",
  },
  privacy: {
    h2: "Privacy and consent",
    items: [
      {
        title: "The parent says yes",
        body: "The first call asks for consent, in their language. It says the call is recorded, that a short update goes to the family, and that they can say stop anytime.",
      },
      {
        title: "Used only for the family",
        body: "Summaries, medicine logs, alerts and transcripts are for the family desk you invite. We do not sell this data.",
      },
      {
        title: "Stop anytime",
        body: "The family can pause morning calls from Settings. The parent can refuse the daily call. Neighbours see only the alert they opted into.",
      },
      {
        title: "Kept for a limited time",
        body: "Transcripts are deleted after 30 days. Summaries and quotes after 90 days. Alerts stay, without the parent's words.",
      },
    ],
  },
  faq: {
    h2: "Questions families ask",
    items: [
      {
        q: "Does my parent need an app or a smartphone?",
        a: "No. Saathi calls the phone they already own, including a basic phone. They never install anything. The child uses WhatsApp and the family desk on the web or Android.",
      },
      {
        q: "Is Saathi a doctor or an emergency service?",
        a: "No. It is a companion call that reminds and listens. It never diagnoses, never changes a dose, and never dials 112. In an emergency it tells the parent to call 112 or someone nearby, and it tells the family. You should still call 112.",
      },
      {
        q: "Which languages work today?",
        a: "Hindi and English. Marathi, Tamil and Kannada are on the setup form and will follow. Hinglish is not a separate mode.",
      },
      {
        q: "What if they do not pick up?",
        a: "Saathi rings again at 10 and 25 minutes. At 30 minutes the child gets a WhatsApp. There is one last ring at 45 minutes. At 60 minutes the child gets an Act now alert, and so does a neighbour if they have opted in.",
      },
      {
        q: "Who can hear the call?",
        a: "The family you add sees a summary, and a transcript when the parent agreed to recording. A neighbour never sees the call, the medicines or the mood. They only get the alert they opted into.",
      },
      {
        q: "Can we stop?",
        a: "Yes. Pause morning calls from the family desk, or the parent can refuse the daily call. You can delete the parent's data from Settings.",
      },
    ],
  },
  finale: {
    h2: "Start with one morning call.",
    sub: "Most of India's elders will not download an app, but they always pick up the phone. That is where Saathi begins.",
    cta: "Open the family desk",
    secondary: "Join the list",
    contact: "Email or WhatsApp number",
    lang: "Parent's language",
    consent: "Contact me only about Saathi.",
    thanks: "You are on the list. We will write when there is a spot.",
    error: "Something went wrong. Please try again.",
    more: "Tell us a little more",
  },
  footer: {
    sign: "The parent never installs anything.",
    copy: "© 2026 Saathi",
    privacy: "Privacy",
    terms: "Terms",
    github: "GitHub",
    githubHref: "https://github.com/priyansh-x/Saathi",
    credit: "Started at the Bolna x YC Voice AI Buildathon, Oct 2026.",
    disclaimer:
      "Saathi reminds and listens. It never diagnoses, and it is not an emergency service. In an emergency, call 112.",
  },
  waitlist: {
    title: "Join the list",
    intro: "A few details help us match you with the right group. This form never emails, texts or dials anyone.",
    name: "Your name",
    contact: "Your email or WhatsApp number",
    location: "Where you live (city/country)",
    parentCity: "Parent's city",
    parentLang: "Parent's language",
    langs: ["Hindi", "Hinglish", "English", "Other"],
    interest: "I'm interested in trying this with my parent",
    consent: "We'll only use this to contact you about Saathi.",
    submit: "Join the list",
    thanks: "Thank you. We will write to you when a spot opens.",
    error: "Something went wrong, please try again.",
    close: "Close",
  },
  legal: {
    privacyTitle: "Privacy",
    privacyBody:
      "The waitlist stores only what you type, so we can contact you about Saathi. We do not sell that list. You can ask us to delete your entry. On the family desk, data is used only for that family. Transcripts are deleted after 30 days, summaries after 90. The family owner can delete the parent's data from Settings. Saathi is not an emergency service. In an emergency, call 112.",
    termsTitle: "Terms",
    termsBody:
      "Saathi is companionship and reminders. It is not a medical device and not an emergency service. It never diagnoses and never dials 112. In an emergency, call 112.",
  },
} as const;

export type LangId = keyof typeof content.listen.transcripts;
