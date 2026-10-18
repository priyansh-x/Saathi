export async function register() {
  const { assertLiveSecrets, assertProductionSecrets } = await import("@/lib/config");
  assertProductionSecrets();
  assertLiveSecrets();
}
