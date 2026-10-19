import { buildCapacitorConfig, isDevArg, writeOfflineHost } from "./src/brand/capacitor-config";

type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  server: { url: string; androidScheme?: string; cleartext?: boolean; allowNavigation?: string[]; errorPath?: string };
  android?: { backgroundColor?: string };
  plugins?: Record<string, unknown>;
};

const built = buildCapacitorConfig(process.env, { dev: isDevArg() });
writeOfflineHost(built.server.url);

const config: CapacitorConfig = {
  appId: built.appId,
  appName: built.appName,
  webDir: built.webDir,
  server: built.server,
  android: { backgroundColor: built.android.backgroundColor },
  plugins: built.plugins,
};

export default config;
