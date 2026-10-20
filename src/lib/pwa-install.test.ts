import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isInAppBrowser, isIosLike } from "@/lib/pwa-install";

describe("pwa install targeting", () => {
  it("treats iPhone Safari as iOS", () => {
    assert.equal(
      isIosLike(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
      true,
    );
  });

  it("spots WhatsApp in-app on iPhone", () => {
    assert.equal(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/24.0",
      ),
      true,
    );
  });

  it("treats iPadOS desktop UA as iOS when it has touch", () => {
    assert.equal(isIosLike("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15", 5), true);
    assert.equal(isIosLike("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15", 0), false);
  });

  it("spots Instagram in-app", () => {
    assert.equal(isInAppBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Instagram 192.0"), true);
  });

  it("leaves iPhone Safari as not in-app", () => {
    assert.equal(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
      false,
    );
  });
});
