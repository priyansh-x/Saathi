export type DeskDensity = "comfortable" | "compact";
export type DeskLook = "warm" | "calm";
export type DeskAppearance = "light" | "dark";

export type DeskUi = {
  density: DeskDensity;
  look: DeskLook;
  appearance: DeskAppearance;
};

export const DEFAULT_DESK_UI: DeskUi = {
  density: "comfortable",
  look: "warm",
  appearance: "light",
};

const KEY = "saathi-desk-ui";

export function normalizeDeskUi(parsed: Partial<DeskUi> | null | undefined): DeskUi {
  return {
    density: parsed?.density === "compact" ? "compact" : "comfortable",
    look: parsed?.look === "calm" ? "calm" : "warm",
    appearance: parsed?.appearance === "dark" ? "dark" : "light",
  };
}

export function readDeskUi(): DeskUi {
  if (typeof window === "undefined") return { ...DEFAULT_DESK_UI };
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DeskUi>) : {};
    return normalizeDeskUi(parsed);
  } catch {
    return { ...DEFAULT_DESK_UI };
  }
}

export function writeDeskUi(next: DeskUi) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  applyDeskUi(next);
}

export function applyDeskUi(prefs: DeskUi = readDeskUi()) {
  if (typeof document === "undefined") return;
  const dark = prefs.appearance === "dark";
  const root = document.documentElement;
  root.dataset.density = prefs.density;
  root.dataset.look = prefs.look;
  root.dataset.appearance = prefs.appearance;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

/** First-paint boot: paper/light unless this phone already chose dark. */
export const DESK_UI_BOOT =
  '(()=>{try{var p=JSON.parse(localStorage.getItem("saathi-desk-ui")||"{}");var dark=p&&p.appearance==="dark";var r=document.documentElement;r.classList.toggle("dark",!!dark);r.dataset.appearance=dark?"dark":"light";r.style.colorScheme=dark?"dark":"light";}catch(e){document.documentElement.classList.remove("dark");document.documentElement.dataset.appearance="light";document.documentElement.style.colorScheme="light";}})();';
