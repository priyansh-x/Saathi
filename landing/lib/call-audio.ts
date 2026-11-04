export type CallLang = "hi" | "en";

export const callAudio = {
  hi: {
    src: "/audio/call-hi.mp3",
    duration: 28.992,
    lines: [
      { who: "saathi" as const, text: "Namaste Maa! Abhi do minute baat kar sakte hain?", start: 0, end: 4.752 },
      { who: "maa" as const, text: "Haan beta, bolo.", start: 5.202, end: 8.082 },
      { who: "saathi" as const, text: "Aaj tabiyat kaisi hai? Kal ghutne mein dard tha.", start: 8.532, end: 13.332 },
      { who: "maa" as const, text: "Ghutne ka dard aaj kam hai. Subah park tak gayi thi.", start: 13.782, end: 19.878 },
      { who: "saathi" as const, text: "Bahut accha. Subah wali BP ki goli le li?", start: 20.328, end: 25.56 },
      { who: "maa" as const, text: "Haan, le li.", start: 26.01, end: 28.482 },
    ],
  },
  en: {
    src: "/audio/call-en.mp3",
    duration: 26.232,
    lines: [
      { who: "saathi" as const, text: "Good morning. Have you got two minutes?", start: 0, end: 3.96 },
      { who: "maa" as const, text: "Yes, beta. Tell me.", start: 4.41, end: 8.61 },
      { who: "saathi" as const, text: "How are the knees today? Yesterday they hurt.", start: 9.06, end: 13.404 },
      { who: "maa" as const, text: "Better. I walked to the park this morning.", start: 13.854, end: 18.87 },
      { who: "saathi" as const, text: "Did you take the morning BP tablet?", start: 19.32, end: 22.44 },
      { who: "maa" as const, text: "Yes, I took it.", start: 22.89, end: 25.722 },
    ],
  },
} as const;

let occupying: HTMLAudioElement | null = null;

export function occupyAudio(el: HTMLAudioElement | null) {
  if (occupying && occupying !== el) occupying.pause();
  occupying = el;
}

export function lineAt(lang: CallLang, time: number) {
  const lines = callAudio[lang].lines;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (time >= lines[i].start) return { index: i, line: lines[i] };
  }
  return { index: 0, line: lines[0] };
}
