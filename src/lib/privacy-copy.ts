import { retentionSummaryDays, retentionTranscriptDays } from "@/lib/config";

export const PRIVACY_DRAFT_VERSION = "privacy_draft_v1";

export function privacyCopy(lang: "en" | "hi") {
  const transcript = retentionTranscriptDays();
  const summary = retentionSummaryDays();
  if (lang === "hi") {
    return {
      draft: "मसौदा। कानूनी सलाह नहीं",
      title: "गोपनीयता",
      lead: "साथी साथ और याद दिलाने का काम है, इलाज या आपात सेवा नहीं। आपात में 112 मिलाएँ।",
      sections: [
        {
          heading: "हम क्या रखते हैं",
          body: "सुबह की कॉल का सार, दवा ली या नहीं, और अगर माँ कहें तो एक छोटी बात उनके शब्दों में। पूरी बात (ट्रांस्क्रिप्ट) सिर्फ़ तब जब उन्होंने हाँ कहा हो।",
        },
        {
          heading: "कौन देखता है",
          body: "परिवार का डेस्क जिसे आपने जोड़ा। पड़ोसी को सिर्फ़ वही अलर्ट जो आपने हाँ कहा। साथी की टीम पायलट में गिनती और गेट देखती है, पूरी बात नहीं।",
        },
        {
          heading: "कितने दिन",
          body: `पूरी बात ${transcript} दिन बाद मिट जाती है। सार और उनके शब्द ${summary} दिन बाद। अलर्ट रहेंगे, बिना उनके शब्दों के।`,
        },
        {
          heading: "कैसे मिटाएँ",
          body: "सेटिंग में परिवार का मालिक «माँ का सारा डेटा मिटाएँ» दबा सकता है। सहमति का रिकॉर्ड आप JSON में डाउनलोड कर सकते हैं। कॉल से कुछ नहीं।",
        },
      ],
    };
  }
  return {
    draft: "DRAFT. Not legal advice.",
    title: "Privacy",
    lead: "Saathi reminds and listens. It does not diagnose, and it is not an emergency service. In an emergency call 112.",
    sections: [
      {
        heading: "What we record",
        body: "A short morning summary, whether medicines were taken, and, if she said yes, a line in her words. We keep a full transcript only after her spoken haan.",
      },
      {
        heading: "Who sees it",
        body: "The family desk you invited. A neighbour sees only the alert you opted them into. Saathi ops sees counts and gates during the pilot, never transcripts or quotes.",
      },
      {
        heading: "How long we keep it",
        body: `Transcripts are deleted after ${transcript} days. Summaries and quotes after ${summary} days. Alerts stay, stripped of her words.`,
      },
      {
        heading: "How to delete",
        body: "The family owner can delete everything from Settings. You can also download the consent record (who agreed, when, the text version). Nothing from the calls.",
      },
    ],
  };
}
