export async function register() {
  const { assertLiveSecrets } = await import("@/lib/config");
  assertLiveSecrets();
}
