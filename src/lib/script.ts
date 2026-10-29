import { firstMedicine, firstName } from "@/lib/names";
import type { CallFlag, CallOutcome, Household } from "@/lib/types";

export type Choice = {
  id: string;
  hi: string;
  en: string;
  flags: CallFlag[];
};

export type Beat = {
  id: string;
  hi: string;
  en: string;
  choices: Choice[];
};

export function buildBeats(household: Household): Beat[] {
  const parent = firstName(household.parentName);
  const child = firstName(household.childName);
  const med = firstMedicine(household.medicines);
  const neighbor = firstName(household.neighborName);

  return [
    {
      id: "hello",
      hi: `नमस्ते ${parent} जी, मैं सुबह की साथी बोल रही हूँ. ${child} ने कहा था बात कर लूँ। सो के उठे?`,
      en: `Namaste ${parent} ji. This is the morning check-in. ${child} asked me to call. Did you sleep well?`,
      choices: [
        {
          id: "slept",
          hi: "हाँ बेटी, ठीक से सोई।",
          en: "Yes beti, I slept well.",
          flags: ["well"],
        },
        {
          id: "restless",
          hi: "रात को दर्द था, कम सोई।",
          en: "I had pain at night. I slept little.",
          flags: ["pain"],
        },
      ],
    },
    {
      id: "meds",
      hi: `अच्छा। ${med} ले ली? नाश्ते के बाद वाली।`,
      en: `Good. Did you take ${med}? The one after breakfast.`,
      choices: [
        {
          id: "took",
          hi: "हाँ, ले ली।",
          en: "Yes, I took it.",
          flags: ["meds_taken"],
        },
        {
          id: "forgot",
          hi: "अरे, भूल गई। अभी लेती हूँ।",
          en: "I forgot. I’ll take it now.",
          flags: ["meds_skipped"],
        },
      ],
    },
    {
      id: "body",
      hi: "आज शरीर कैसा है? चक्कर, सीने में दर्द, या कुछ और?",
      en: "How does the body feel: dizziness, chest pain, or anything else?",
      choices: [
        {
          id: "fine",
          hi: "सब ठीक है। थोड़ी कमजोरी है बस।",
          en: "All fine. Just a little weakness.",
          flags: ["well"],
        },
        {
          id: "pain",
          hi: "घुटने सूजे हुए हैं, चलने में तकलीफ है।",
          en: "My knees are swollen. Walking is hard.",
          flags: ["pain"],
        },
        {
          id: "fall",
          hi: "सुबह बाथरूम में फिसल गई। उठ गई हूँ, लेकिन डर लग रहा है।",
          en: "I slipped in the bathroom this morning. I got up, but I’m scared.",
          flags: ["fall"],
        },
      ],
    },
    {
      id: "day",
      hi: `${child} पूछ रही थी. आज घर में कोई आएगा?`,
      en: `${child} asked: is anyone coming home today?`,
      choices: [
        {
          id: "visitor",
          hi: `${neighbor} शाम को चाय को आएगी।`,
          en: `${neighbor} will come for tea in the evening.`,
          flags: ["well"],
        },
        {
          id: "alone",
          hi: "आज कोई नहीं। थोड़ा मन भारी है।",
          en: "Nobody today. I feel a bit heavy.",
          flags: ["lonely"],
        },
      ],
    },
  ];
}

export function closingLine(household: Household, flags: CallFlag[]) {
  const parent = firstName(household.parentName);
  const child = firstName(household.childName);
  if (flags.includes("fall")) {
    return {
      hi: `${parent} जी, आप बैठिए। मैं अभी ${child} और पड़ोस को फोन करती हूँ। अकेली मत उठिए।`,
      en: `${parent} ji, please sit. I am calling ${child} and the neighbour now. Don’t get up alone.`,
    };
  }
  if (flags.includes("meds_skipped")) {
    return {
      hi: `गोली ले लीजिए, मैं दोपहर को एक बार और पूछ लूँगी। ${child} को बता देती हूँ। राम राम।`,
      en: `Please take the tablet. I’ll check again this afternoon. I’ll tell ${child}. Ram ram.`,
    };
  }
  return {
    hi: `ठीक है ${parent} जी। ${child} को कह देती हूँ आपने बात की। अगर कुछ चाहिए तो इसी नंबर पर घंटी बजा दीजिए। राम राम।`,
    en: `Alright ${parent} ji. I’ll tell ${child} we spoke. If you need anything, ring this number. Ram ram.`,
  };
}

export function outcomeFrom(flags: CallFlag[]): CallOutcome {
  if (flags.includes("fall")) return "emergency";
  if (flags.includes("meds_skipped") || flags.includes("pain") || flags.includes("lonely")) {
    return "watch";
  }
  return "ok";
}

export function summarise(
  household: Household,
  flags: CallFlag[],
  outcome: CallOutcome,
): { hi: string; en: string } {
  const who = household.parentName;
  if (outcome === "missed") {
    return {
      hi: `${who} ने दो बार कॉल नहीं उठाई। ${household.neighborName} से कहा गया दरवाज़ा खटखटाएँ।`,
      en: `${who} did not pick up twice. ${household.neighborName} was asked to knock.`,
    };
  }
  if (flags.includes("fall")) {
    return {
      hi: `${who} ने बताया सुबह बाथरूम में फिसल गईं। उठ गई हैं, डर लग रहा है।`,
      en: `${who} said she slipped in the bathroom this morning. She got up and is frightened.`,
    };
  }
  const en: string[] = [];
  const hi: string[] = [];
  if (flags.includes("meds_taken")) {
    en.push("took the morning tablet");
    hi.push("सुबह की गोली ले ली");
  }
  if (flags.includes("meds_skipped")) {
    en.push("had forgotten the tablet, said she will take it now");
    hi.push("गोली भूल गईं, अभी लेने को कहा");
  }
  if (flags.includes("pain")) {
    en.push("pain or poor sleep");
    hi.push("दर्द या नींद कम");
  }
  if (flags.includes("lonely")) {
    en.push("home alone today, mood heavy");
    hi.push("आज अकेली, मन भारी");
  }
  if (flags.includes("well") && !flags.includes("pain") && !flags.includes("lonely")) {
    en.push("sounded steady");
    hi.push("आवाज़ स्थिर लगी");
  }
  return {
    hi: `${who}: ${hi.join(" · ") || "सुबह की बात हुई।"}.`,
    en: `${who}: ${en.join("; ") || "morning check-in completed"}.`,
  };
}

