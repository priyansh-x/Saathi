export type DeskDensity = "comfortable" | "compact";
export type DeskLook = "warm" | "calm";

export type DeskUi = {
  density: DeskDensity;
  look: DeskLook;
};

const KEY = "saathi-desk-ui";

export function readDeskUi(): DeskUi {
  if (typeof window === "undefined") return { density: "comfortable", look: "warm" };
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DeskUi>) : {};
    return {
      density: parsed.density === "compact" ? "compact" : "comfortable",
      look: parsed.look === "calm" ? "calm" : "warm",
    };
  } catch {
    return { density: "comfortable", look: "warm" };
  }
}

export function writeDeskUi(next: DeskUi) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  applyDeskUi(next);
}

export function applyDeskUi(prefs: DeskUi = readDeskUi()) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.density = prefs.density;
  document.documentElement.dataset.look = prefs.look;
}
