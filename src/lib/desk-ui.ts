export type DeskDensity = "comfortable" | "compact";
export type DeskLook = "warm" | "calm";
export type DeskTheme = "light" | "dark" | "system";
export type DeskTypeSize = "regular" | "large";
export type DeskMotion = "full" | "reduce";

export type DeskUi = {
  density: DeskDensity;
  look: DeskLook;
  theme: DeskTheme;
  typeSize: DeskTypeSize;
  motion: DeskMotion;
};

export const DESK_UI_KEY = "saathi-desk-ui";

export const DESK_UI_DEFAULTS: DeskUi = {
  density: "comfortable",
  look: "warm",
  theme: "system",
  typeSize: "regular",
  motion: "full",
};

const KEY = DESK_UI_KEY;

export function parseDeskUi(raw: unknown): DeskUi {
  const parsed = raw && typeof raw === "object" ? (raw as Partial<DeskUi>) : {};
  return {
    density: parsed.density === "compact" ? "compact" : "comfortable",
    look: parsed.look === "calm" ? "calm" : "warm",
    theme: parsed.theme === "dark" || parsed.theme === "light" ? parsed.theme : "system",
    typeSize: parsed.typeSize === "large" ? "large" : "regular",
    motion: parsed.motion === "reduce" ? "reduce" : "full",
  };
}

export function readDeskUi(): DeskUi {
  if (typeof window === "undefined") return { ...DESK_UI_DEFAULTS };
  try {
    const raw = window.localStorage.getItem(KEY);
    return parseDeskUi(raw ? JSON.parse(raw) : {});
  } catch {
    return { ...DESK_UI_DEFAULTS };
  }
}

export function writeDeskUi(next: DeskUi) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  applyDeskUi(next);
}

export function themeIsDark(theme: DeskTheme, darkQuery = false) {
  return theme === "dark" || (theme === "system" && darkQuery);
}

export function applyDeskUi(prefs: DeskUi = readDeskUi()) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const darkQuery =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = themeIsDark(prefs.theme, darkQuery);
  root.dataset.density = prefs.density;
  root.dataset.look = prefs.look;
  root.dataset.theme = prefs.theme;
  root.dataset.typeSize = prefs.typeSize;
  root.dataset.motion = prefs.motion;
  root.classList.toggle("dark", dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#1A1816" : "#F7F5F0");
}

/** Runs before paint so the first frame matches saved display prefs. */
export const DESK_UI_BOOT = `(function(){try{var p={};try{p=JSON.parse(localStorage.getItem("${DESK_UI_KEY}")||"{}")||{};}catch(e){}var d=document.documentElement;d.dataset.density=p.density==="compact"?"compact":"comfortable";d.dataset.look=p.look==="calm"?"calm":"warm";d.dataset.typeSize=p.typeSize==="large"?"large":"regular";d.dataset.motion=p.motion==="reduce"?"reduce":"full";var theme=p.theme==="dark"||p.theme==="light"?p.theme:"system";d.dataset.theme=theme;var dark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",dark);}catch(e){}})();`;
