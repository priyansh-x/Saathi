import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveServerUrl } from "../../src/brand/capacitor-config";

const RELEASE_ENV = [
  "ANDROID_KEYSTORE_PATH",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_ALIAS",
  "ANDROID_KEY_PASSWORD",
] as const;

export function parseAndroidBuildArgs(argv: string[]) {
  const release = argv.includes("release") || argv.includes("--release");
  const bundle = argv.includes("--aab") || argv.includes("bundle");
  const dev = argv.includes("--dev");
  return { release, bundle, dev };
}

export function validateAndroidBuildEnv(
  env: Record<string, string | undefined>,
  opts: { release: boolean; dev: boolean },
): string {
  if (opts.release && opts.dev) {
    throw new Error("android:release cannot use --dev (http emulator URL).");
  }
  resolveServerUrl(env, { dev: opts.dev });
  if (opts.release) {
    for (const name of RELEASE_ENV) {
      if (!env[name]?.trim()) throw new Error(`Missing ${name} for a signed release.`);
    }
    const store = env.ANDROID_KEYSTORE_PATH!.trim();
    if (!existsSync(store)) throw new Error(`Keystore not found: ${store}`);
  }
  return resolveServerUrl(env, { dev: opts.dev });
}

function run(command: string, args: string[], cwd?: string, env?: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, { stdio: "inherit", cwd, env: env ?? process.env, shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  const opts = parseAndroidBuildArgs(process.argv.slice(2));
  const url = validateAndroidBuildEnv(process.env, opts);
  console.log(`SAATHI_APP_URL=${url}${opts.dev ? " (--dev)" : ""}`);

  const env = { ...process.env };
  if (opts.dev) env.CAP_DEV = "1";
  run("npx", ["cap", "sync", "android"], undefined, env);

  const task = opts.release ? (opts.bundle ? "bundleRelease" : "assembleRelease") : "assembleDebug";
  run("./gradlew", [task, "--no-daemon"], path.join(process.cwd(), "android"));

  const apk = opts.release
    ? opts.bundle
      ? "android/app/build/outputs/bundle/release/app-release.aab"
      : "android/app/build/outputs/apk/release/app-release.apk"
    : "android/app/build/outputs/apk/debug/app-debug.apk";
  const abs = path.resolve(apk);
  if (!existsSync(abs)) {
    console.error(`Build finished but ${abs} is missing.`);
    process.exit(1);
  }
  console.log(`APK: ${abs}`);
}

const isMain = /scripts\/android\/build\.ts$/.test(process.argv[1] || "");
if (isMain) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
