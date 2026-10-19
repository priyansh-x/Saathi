import type { CapacitorConfig } from "@capacitor/cli";
import { buildCapacitorConfig, isDevArg } from "./src/brand/capacitor-config";

const built = buildCapacitorConfig(process.env, { dev: isDevArg() });

const config: CapacitorConfig = {
  appId: built.appId,
  appName: built.appName,
  webDir: built.webDir,
  server: built.server,
  android: { backgroundColor: built.android.backgroundColor },
  plugins: built.plugins,
};

export default config;
