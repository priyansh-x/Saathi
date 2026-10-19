import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAndroidBuildArgs, validateAndroidBuildEnv, withCapDev } from "./build";

describe("android build env", () => {
  it("refuses a release without a keystore env", () => {
    assert.throws(
      () =>
        validateAndroidBuildEnv({ SAATHI_APP_URL: "https://family.example" }, { release: true, dev: false }),
      /ANDROID_KEYSTORE_PATH/,
    );
  });

  it("refuses --dev on release", () => {
    assert.throws(
      () => validateAndroidBuildEnv({ SAATHI_APP_URL: "https://family.example" }, { release: true, dev: true }),
      /cannot use --dev/,
    );
  });

  it("requires https SAATHI_APP_URL for a debug APK", () => {
    assert.throws(() => validateAndroidBuildEnv({}, { release: false, dev: false }), /SAATHI_APP_URL/);
    assert.equal(
      validateAndroidBuildEnv({ SAATHI_APP_URL: "https://family.example" }, { release: false, dev: false }),
      "https://family.example",
    );
  });

  it("parses --dev and release flags", () => {
    assert.deepEqual(parseAndroidBuildArgs(["debug", "--dev"]), { release: false, bundle: false, dev: true });
    assert.deepEqual(parseAndroidBuildArgs(["release", "--aab"]), { release: true, bundle: true, dev: false });
  });

  it("passes CAP_DEV=1 to cap sync and gradle", () => {
    const env = withCapDev({ SAATHI_APP_URL: "http://10.0.2.2:43147" }, true);
    assert.equal(env.CAP_DEV, "1");
    assert.equal(withCapDev({}, false).CAP_DEV, undefined);
  });
});
