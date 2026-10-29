import type { Lang } from "@/lib/i18n/messages";
import { demoMorningLines } from "@/lib/demo-lines";
import { exampleWhatsappPreviews } from "@/lib/demo-walk";

export const RECORD_LINE_MS = 2800;
export const RECORD_SCENE_IDS = ["call", "meds", "brief", "alert", "going", "ok", "summary"] as const;
export type RecordSceneId = (typeof RECORD_SCENE_IDS)[number];

export type RecordLine = {
  speaker: "agent" | "parent";
  hi: string;
  en: string;
  atMs: number;
};

export type RecordScene = {
  id: RecordSceneId;
  ms: number;
  title: string;
  kind: RecordSceneId;
  lines?: RecordLine[];
  meds?: { name: string; status: string }[];
  wa?: { title: string; body: string }[];
  body?: string;
  footer?: string;
};

const COPY = {
  en: {
    call: "The morning call",
    meds: "Medicines",
    brief: "WhatsApp briefing",
    alert: "Red-flag alert",
    going: "I'm going",
    ok: "Maa is OK",
    summary: "One EXAMPLE morning",
    amlo: "Amlodipine 5mg, morning",
    amloStatus: "Taken",
    met: "Metformin 500mg, afternoon",
    metStatus: "Not asked yet",
    toRohit: "To Rohit",
    toSunita: "To Sunita ji",
    goingBody: "Sunita ji taps I'm going. First ack wins. Rohit is told someone is on it.",
    okBody: "Rohit marks Maa is OK. The act-now banner leaves the desk.",
    summaryBody:
      "Saathi called Kamla, briefed Rohit, and when it was urgent, Sunita ji went. Companionship and reminders, never diagnosis.",
    emergency: "In an emergency call 112.",
    briefingBody:
      "Kamla slept well, took Amlodipine, and sounded steady. Metformin is the afternoon tablet, not asked yet.",
  },
  hi: {
    call: "सुबह की कॉल",
    meds: "दवा",
    brief: "व्हाट्सऐप ब्रीफिंग",
    alert: "रेड फ़्लैग अलर्ट",
    going: "मैं जा रही हूँ",
    ok: "माँ ठीक हैं",
    summary: "एक EXAMPLE सुबह",
    amlo: "एम्लोडिपिन 5mg, सुबह",
    amloStatus: "ले ली",
    met: "मेटफॉर्मिन 500mg, दोपहर",
    metStatus: "अभी नहीं पूछा",
    toRohit: "रोहित को",
    toSunita: "सुनीता जी को",
    goingBody: "सुनीता जी ने कहा: मैं जा रही हूँ। पहला जवाब जीतता है। रोहित को पता चलता है कोई जा रहा है।",
    okBody: "रोहित ने लिखा माँ ठीक हैं। अभी-देखें पट्टी हट गई।",
    summaryBody:
      "साथी ने कमला से बात की, रोहित को बताया, और ज़रूरत पड़ी तो सुनीता जी गईं। साथ और याददिलानी, निदान नहीं।",
    emergency: "आपात में 112 मिलाएँ।",
    briefingBody: "कमला ठीक सोईं, एम्लोडिपिन ले लीं, आवाज़ स्थिर थी। मेटफॉर्मिन दोपहर की गोली है, अभी नहीं पूछा।",
  },
} as const;

export function recordCallLines(): RecordLine[] {
  return demoMorningLines().map((line, i) => ({
    ...line,
    atMs: i * RECORD_LINE_MS,
  }));
}

export function buildRecordScenes(lang: Lang = "en"): RecordScene[] {
  const t = COPY[lang];
  const previews = exampleWhatsappPreviews();
  const lines = recordCallLines();
  const callMs = lines.length * RECORD_LINE_MS + 1600;
  const briefing = previews.missed_soft_en
    .replace("Needs a look", "Good morning")
    .replace("No answer yet.", "Neend theek thi. Amlodipine le li.");

  return [
    {
      id: "call",
      kind: "call",
      ms: callMs,
      title: t.call,
      lines,
    },
    {
      id: "meds",
      kind: "meds",
      ms: 5200,
      title: t.meds,
      meds: [
        { name: t.amlo, status: t.amloStatus },
        { name: t.met, status: t.metStatus },
      ],
    },
    {
      id: "brief",
      kind: "brief",
      ms: 7000,
      title: t.brief,
      body: t.briefingBody,
      wa: [{ title: `${t.toRohit} · EN`, body: briefing }],
    },
    {
      id: "alert",
      kind: "alert",
      ms: 7000,
      title: t.alert,
      wa: [
        { title: `${t.toRohit} · EN`, body: previews.safety_en },
        { title: `${t.toSunita} · हिं`, body: previews.responder_hi },
      ],
    },
    {
      id: "going",
      kind: "going",
      ms: 5600,
      title: t.going,
      body: t.goingBody,
      wa: [{ title: `${t.toRohit} · EN`, body: previews.ack_en }],
    },
    {
      id: "ok",
      kind: "ok",
      ms: 5200,
      title: t.ok,
      body: t.okBody,
    },
    {
      id: "summary",
      kind: "summary",
      ms: 9000,
      title: t.summary,
      body: t.summaryBody,
      footer: t.emergency,
    },
  ];
}

export function stepRecordIndex(index: number, delta: number, length: number) {
  return Math.max(0, Math.min(length - 1, index + delta));
}

export function visibleRecordLines(lines: RecordLine[], elapsedMs: number) {
  return lines.filter((line) => line.atMs <= elapsedMs);
}

/** Stretch beat times to a real recording's duration. Leave them alone if duration is missing. */
export function scaleLineTimes(lines: RecordLine[], durationMs: number) {
  if (!lines.length || !Number.isFinite(durationMs) || durationMs < 1000) return lines;
  const span = (lines[lines.length - 1]?.atMs ?? 0) + RECORD_LINE_MS;
  if (span <= 0) return lines;
  const factor = durationMs / span;
  return lines.map((line) => ({ ...line, atMs: Math.round(line.atMs * factor) }));
}
