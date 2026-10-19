import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { APP_ID, APP_NAME, BRAND, EMULATOR_DEV_URL, PAPER } from "./brand";

export type CapEnv = { SAATHI_APP_URL?: string } | NodeJS.ProcessEnv;

export function resolveServerUrl(env: CapEnv, opts: { dev: boolean }): string {
  const raw = (env.SAATHI_APP_URL || "").trim().replace(/\/$/, "");
  if (opts.dev) {
    const url = raw || EMULATOR_DEV_URL;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("SAATHI_APP_URL must be a URL.");
    }
    const okHttp =
      parsed.protocol === "http:" && (parsed.hostname === "10.0.2.2" || parsed.hostname === "localhost");
    const okHttps = parsed.protocol === "https:";
    if (!okHttp && !okHttps) {
      throw new Error("--dev only allows http://10.0.2.2:43147 (or localhost) or https.");
    }
    if (parsed.protocol === "http:" && parsed.hostname !== "10.0.2.2" && parsed.hostname !== "localhost") {
      throw new Error("--dev http is only for 10.0.2.2.");
    }
    return url.replace(/\/$/, "");
  }
  if (!raw) throw new Error("SAATHI_APP_URL is required (https). Pass --dev for the emulator.");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("SAATHI_APP_URL must be a URL.");
  }
  if (parsed.protocol !== "https:") throw new Error("SAATHI_APP_URL must be https unless --dev.");
  if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
    throw new Error("SAATHI_APP_URL cannot be localhost unless --dev.");
  }
  return raw;
}

export function buildCapacitorConfig(env: CapEnv, opts: { dev: boolean }) {
  const url = resolveServerUrl(env, opts);
  const host = new URL(url).hostname;
  return {
    appId: APP_ID,
    appName: APP_NAME,
    webDir: "native/www",
    server: {
      url,
      androidScheme: "https",
      cleartext: opts.dev,
      allowNavigation: [host],
      errorPath: "offline.html",
    },
    plugins: {
      SplashScreen: {
        launchShowDuration: 400,
        launchAutoHide: true,
        backgroundColor: PAPER,
        androidSplashResourceName: "splash",
        androidScaleType: "CENTER",
      },
      StatusBar: {
        backgroundColor: PAPER,
        style: "DARK",
      },
    },
    android: {
      backgroundColor: PAPER,
    },
    brand: BRAND,
  };
}

export function isDevArg(argv = process.argv, env: Record<string, string | undefined> = process.env) {
  // Capacitor CLI rejects unknown flags (`npx cap sync --dev` fails). Use CAP_DEV=1.
  return argv.includes("--dev") || env.CAP_DEV === "1";
}

export const ANDROID_OFFLINE_ASSETS_DIR = path.join(
  process.cwd(),
  "android/app/src/main/assets/public",
);

/** Stamp data-host onto the copied offline page. Call after `cap sync` — sync copies webDir over assets/public. */
export function writeOfflineHost(serverUrl: string, destDir = ANDROID_OFFLINE_ASSETS_DIR) {
  const src = path.join(process.cwd(), "native/www/offline.html");
  mkdirSync(destDir, { recursive: true });
  const html = readFileSync(src, "utf8");
  const host = new URL(serverUrl).hostname;
  const next = html.replace(/data-host="[^"]*"/, `data-host="${host}"`);
  writeFileSync(path.join(destDir, "offline.html"), next);
}
