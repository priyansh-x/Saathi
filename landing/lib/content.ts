/** All marketing copy. Same keys will be used for `hi` later. */
export const domainPlaceholder = "<domain>";

export const content = {
  meta: {
    title: "Saathi — A morning phone call for your parents",
    description:
      "Saathi calls Maa every morning on the phone she already has. You get two lines on WhatsApp. Companionship and reminders — never a doctor.",
  },
  nav: {
    logo: "Saathi",
    glyph: "स",
    links: [
      { href: "#problem", label: "The problem" },
      { href: "#how", label: "How it works" },
      { href: "#safety", label: "Safety" },
      { href: "#setup", label: "Setup" },
      { href: "#faq", label: "FAQ" },
    ],
    cta: "Join the pilot",
    skip: "Skip to content",
  },
  hero: {
    pill: "A morning phone call for your parents",
    h1a: "You live far away.",
    h1b: "calls Maa every morning.",
    h1bLead: "Saathi",
    sub: "In her language, on the phone she already has. You get two lines on WhatsApp.",
    cta: "Join the pilot",
    buildathon: "Built for the Bolna x YC Voice AI Buildathon",
    // ⚑ CONFIRM: only name tech that is actually in the build. Bolna is in. Do not add Sarvam / Plivo until confirmed.
    builtWith: "Built with Bolna voice agents",
    voiceLines: [
      { text: "Namaste Maa, neend achhi aayi?", lang: "HINDI", hi: true },
      { text: "Subah wali BP ki goli le li?", lang: "HINDI", hi: true },
      { text: "Good morning, Papa. Had your tea?", lang: "ENGLISH", hi: false },
      { text: "Rohit ko kuch bolna hai?", lang: "HINGLISH", hi: true },
    ],
  },
  listen: {
    h2: "Listen to a morning call.",
    tag: "EXAMPLE CALL · fictional",
    onCall: "On call · 02:14",
    caller: "Saathi → Maa",
    // ⚑ CONFIRM which languages are live in the pilot. Hindi / Hinglish / English shown as selectable; others disabled + "soon".
    languages: [
      { id: "hi", label: "Hindi", live: true },
      { id: "hinglish", label: "Hinglish", live: true },
      { id: "en", label: "English", live: true },
      { id: "ta", label: "Tamil", live: false },
      { id: "bn", label: "Bengali", live: false },
    ],
    transcripts: {
      hi: [
        { who: "saathi" as const, text: "Namaste Maa! Abhi do minute baat kar sakte hain?" },
        { who: "maa" as const, text: "Haan beta, bolo." },
        { who: "saathi" as const, text: "Aaj tabiyat kaisi hai? Kal ghutne mein dard tha." },
        { who: "maa" as const, text: "Ghutne ka dard aaj kam hai. Subah park tak gayi thi." },
        { who: "saathi" as const, text: "Bahut accha! Subah wali BP ki goli le li?" },
        { who: "maa" as const, text: "Haan, le li." },
      ],
      hinglish: [
        { who: "saathi" as const, text: "Namaste Maa, two minutes?" },
        { who: "maa" as const, text: "Haan beta, bolo." },
        { who: "saathi" as const, text: "Knees better aaj? Kal dard tha." },
        { who: "maa" as const, text: "Haan, park tak walk kiya." },
        { who: "saathi" as const, text: "BP wali goli le li?" },
        { who: "maa" as const, text: "Le li." },
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
      "✅ Maa is doing well today. Picked up at 8:04 AM and took both tablets (BP, sugar). In her words: “Ghutne ka dard aaj kam hai.”",
    briefingMeta: "Saathi · reply to ask anything · 8:06 AM",
    openToday: "Open today",
    messageMaa: "Message Maa",
  },
  problem: {
    eyebrowN: "01",
    eyebrow: "The problem",
    h2a: "Eight worries.",
    h2b: "One far-away child.",
    sub: "None of them come with an answer. Most of them come at night.",
    whyNow:
      "India has 156.7 million people aged 60+ (WHO SEARO, 2024), expected to reach 193 million by 2030 (UNFPA, 2025).",
    // 36% migrated-child stat dropped: original source not confirmed.
    notes: [
      {
        id: "s1",
        text: "WHO South-East Asia, ageing population figures, 2024.",
        href: "https://www.who.int/southeastasia/health-topics/ageing",
      },
      {
        id: "s2",
        text: "UNFPA, India ageing outlook toward 2030, 2025.",
        href: "https://www.unfpa.org/ageing",
      },
    ],
    notifications: [
      "Did she take her BP tablet?",
      "Her phone's been off since 9",
      "She says she's fine. Is she?",
      "Neighbour hasn't seen her today",
      "Two missed calls from Maa",
      "Is she eating properly?",
      "Who checks on her when I travel?",
      "Did she sleep last night?",
    ],
    caption: "One day. Eight guesses. No real answer.",
    closerA: "Everything else got an app.",
    closerB: "Maa still trusts a ringing phone.",
  },
  answer: {
    eyebrowN: "02",
    eyebrow: "The answer",
    h2a: "A companion,",
    h2b: "made for your parents.",
    strikes: ["Not an app.", "Not a gadget.", "Not a doctor."],
    just: "Just a call, every morning.",
    modules: "Morning call · Medicines · Her words · Alerts · Neighbour · Weekly summary",
    header: "Maa · Sat 17 Oct · updated 8:07 AM IST",
    emergency: "Saathi is not an emergency service. Call 112.",
    tabs: [
      {
        id: "good",
        chip: "Good day",
        headline: "Maa is doing well today",
        detail: "Picked up at 8:04 AM · 4 min call · Hindi",
        quote: "Ghutne ka dard aaj kam hai.",
      },
      {
        id: "look",
        chip: "Needs a look",
        headline: "Maa is fine, but missed a medicine",
        detail: "Sugar tablet (morning) not taken. She said: “khatam ho gayi hai”.",
        quote: "khatam ho gayi hai.",
      },
      {
        id: "act",
        chip: "Act now",
        headline: "Maa said she fell",
        detail: "8:09 AM · Sunita ji alerted",
        quote: "Bathroom mein gir gayi, uth nahi pa rahi.",
      },
    ],
  },
  why: {
    eyebrowN: "03",
    eyebrow: "Why it works",
    h2a: "Everyone sees a slice.",
    h2b: "Saathi hears her say it.",
    cards: [
      { title: "WhatsApp sees", body: "Seen 9:14" },
      { title: "Your phone sees", body: "2 missed calls" },
      { title: "The neighbour sees", body: "Her light was on" },
      { title: "The medicine strip sees", body: "3 tablets left" },
    ],
    node: "“Ghutne ka dard kam hai. Dawai le li.” · 8:04 AM",
    captions: [
      "A blue tick is not a morning.",
      "A missed call is not a check-in.",
      "A light on is not a conversation.",
      "A strip is not her voice.",
      "Her words, at 8:04 AM.",
    ],
    close: "That's why your two lines on WhatsApp are worth reading.",
  },
  safety: {
    eyebrowN: "04",
    eyebrow: "Safety",
    h2a: "Nothing gets missed.",
    h2b: "Nothing gets overstated.",
    sub: "A missed call is usually nothing. A missed morning never goes quiet.",
    leftTitle: "A normal morning",
    rightTitle: "A missed morning",
    leftCaption: "One message. Done.",
    leftBubble: "✅ Maa is doing well today. Picked up at 8:04 AM. Took both tablets.",
    leftTime: "8:06 AM",
    steps: [
      "8:00 Call 1, no answer",
      "8:10 Call 2",
      "8:25 Call 3",
      "8:30 Needs a look to you: “Couldn't reach Maa yet (3 tries since 8:00). We'll try again at 8:45.”",
      "8:45 Call 4 (last automatic try)",
      "9:00 Act now: “Still can't reach Maa (4 tries). Sunita ji is being asked to check.”",
    ],
    going: "✅ Sunita ji is going (9:04)",
    clear: "✅ All clear: Sunita ji confirmed Maa is OK (9:18)",
    caption: "EXAMPLE · times are proposed defaults; you choose them.",
    disclaimer:
      "Saathi reminds and listens. It never diagnoses, and it is not an emergency service. In an emergency, call 112.",
  },
  setup: {
    eyebrowN: "05",
    eyebrow: "Setup",
    h2a: "Set up from your phone,",
    h2b: "no app for Maa.",
    sub: "Any phone she has. Even a basic one.",
    // ⚑ CONFIRM before adding a Landline chip.
    phones: ["Basic phone", "Smartphone"],
    rows: [
      "Maa's number · +91 98xxx xxx01",
      "Language · Hindi",
      "Call time · 8:00 AM IST",
      "Medicines · BP tablet (morning), sugar tablet (morning, night)",
      "Neighbour · Sunita ji (waiting for her YES)",
    ],
    voiceTitle: "Tell Maa before the first call",
    voiceBar: "20 s voice note in Hindi",
    steps: [
      { label: "You fill the form", state: "Done" },
      { label: "Maa hears your voice note", state: "Done" },
      { label: "First call: Maa says yes", state: "Waiting" },
      { label: "Daily calls start", state: "" },
    ],
    consent:
      "Maa is asked for her consent on the very first call. She can stop anytime by saying “phone mat karo”.",
  },
  herWay: {
    h3a: "One Saathi.",
    h3b: "Every parent hears it their way.",
    cards: [
      {
        name: "Maa",
        lang: "Hindi",
        time: "8:00 AM",
        line: "Namaste Maa! BP wali goli le li?",
      },
      {
        name: "Papa",
        lang: "English",
        time: "7:30 AM",
        line: "Good morning, Papa. Did you sleep well?",
      },
      {
        name: "Kamla ji",
        lang: "Hinglish",
        time: "9:00 AM",
        line: "Kamla ji, aaj walk pe gayi thi?",
      },
    ],
    caption: "What you call her · her language · her time · her medicine names",
    tag: "EXAMPLE",
  },
  connect: {
    eyebrowN: "06",
    eyebrow: "How it connects",
    h2: "Fits into what you already use.",
    sub: "Maa gets a phone call. You get WhatsApp. Nobody installs anything.",
    maaTitle: "For Maa",
    maa: [
      { icon: "phone", text: "A normal phone call · same number, same time" },
      { icon: "mic", text: "Talk back in plain words · “kal mat karna”" },
      { icon: "message", text: "Pass a message · “Rohit ko bolo phone kare”" },
    ],
    node: "Her words. Her routine. Her family.",
    youTitle: "For you",
    you: [
      { icon: "chat", text: "Daily 2-line briefing" },
      { icon: "bell", text: "Alerts that break through quiet hours" },
      { icon: "layout", text: "Family page from a WhatsApp link, no login" },
      { icon: "users", text: "Siblings and a neighbour, if you add them" },
    ],
    trust: ["Maa says yes first", "Delete her data anytime", "Reminders, not diagnosis"],
  },
  faq: {
    eyebrowN: "07",
    eyebrow: "Questions",
    h2: "The short answers.",
    items: [
      {
        q: "Is Saathi a doctor or a medical service?",
        a: "No. It's a friendly AI voice that keeps Maa company, reminds her about medicines and tells you how she sounded. Medical questions go to her doctor.",
      },
      {
        q: "Is it an emergency service?",
        a: "No. If Maa says something worrying, Saathi tells you and your neighbour straight away, and tells her to call 112. It never replaces 112.",
      },
      {
        q: "Does Maa need a smartphone or an app?",
        a: "No. Any phone that can take a call.",
      },
      {
        q: "Does Maa know it's an AI?",
        a: "Yes. Saathi says so on its very first call and asks her permission before calling daily. She can say “phone mat karo” anytime.",
      },
      {
        q: "Which languages?",
        // ⚑ CONFIRM Hindi, Hinglish and English during the pilot.
        a: "Hindi, Hinglish and English during the pilot. More Indian languages once a native speaker has checked them.",
      },
      {
        q: "What if she doesn't pick up?",
        a: "Saathi tries a few more times. If it still can't reach her, you hear first, then the neighbour you chose is asked to check.",
      },
      {
        q: "Who can hear the calls?",
        // ⚑ CONFIRM with Priyansh before launch.
        a: "You and the family members you add see a short summary. Audio is kept only if Maa agrees to recording. Your neighbour never sees her calls, medicines or mood.",
      },
      {
        q: "What does it cost?",
        // ⚑ CONFIRM with Priyansh before launch. Draft: free pilot. Do not treat as published pricing.
        a: "Nothing during the pilot.",
      },
      {
        q: "When can I try it?",
        a: "We're starting with a small group of families. Join the list and we'll write to you.",
      },
    ],
  },
  finale: {
    h2a: "Give Maa a morning call",
    h2b: "she looks forward to.",
    prompts: [
      "Maa lives alone in Indore…",
      "Papa forgets his night tablet…",
      "I'm in Toronto, they're in Pune…",
    ],
    cta: "Join the pilot",
  },
  footer: {
    signA: "You live your life.",
    signB: "Saathi makes the morning call.",
    email: `hello@${domainPlaceholder}`,
    copy: "© 2026 Saathi",
    privacy: "Privacy",
    terms: "Terms",
    built: "Built for the Bolna x YC Voice AI Buildathon",
    sources: "Sources",
  },
  waitlist: {
    title: "Join the pilot",
    name: "Your name",
    contact: "Your email or WhatsApp number",
    location: "Where you live (city/country)",
    parentCity: "Parent's city",
    parentLang: "Parent's language",
    langs: ["Hindi", "Hinglish", "English", "Other"],
    interest: "I'm interested in the pilot with my parent",
    consent: "We'll only use this to contact you about Saathi.",
    submit: "Join the list",
    thanks: "Thank you. We'll write to you when a pilot spot opens.",
    error: "Something went wrong, please try again.",
    close: "Close",
  },
  legal: {
    privacyTitle: "Privacy",
    privacyBody:
      "Saathi stores waitlist details only to contact you about the pilot. We do not sell this list. You can ask us to delete your entry. The family product deletes Maa's data when you ask. Placeholder page until a domain is bought.",
    termsTitle: "Terms",
    termsBody:
      "Saathi is companionship and reminders. It is not a medical device and not an emergency service. In an emergency call 112. This page is a placeholder.",
  },
} as const;

export type LangId = keyof typeof content.listen.transcripts;
