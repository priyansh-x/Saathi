import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("installability: manifest and service worker", async ({ page }) => {
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const body = await manifest.json();
  expect(body.display).toBe("standalone");
  await page.goto("/d/example-kamla");
  await expect.poll(async () =>
    page.evaluate(async () => {
      const ready = await navigator.serviceWorker.ready;
      return Boolean(ready.active || ready.waiting || ready.installing);
    }),
  ).toBeTruthy();
});

test("onboarding reaches the family desk", async ({ page }) => {
  const stamp = String(Date.now()).slice(-8);
  await page.goto("/onboard");
  await page.getByLabel("Email").fill(`e2e.${stamp}@example.com`);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Your name").fill("Ananya");
  await page.getByLabel("Your WhatsApp").fill(`98${stamp}`);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Full name").fill("Kamla Test");
  await page.getByLabel("Their phone").fill(`97${stamp}`);
  await page.getByLabel("City").fill("Delhi");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /doesn't take a daily tablet/i }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Looks right" }).click();
  await page.getByRole("button", { name: "Open the family desk" }).click();
  await expect(page).toHaveURL(/\/d\/.+/);
  await expect(page.getByRole("navigation")).toBeVisible();
});

test("Today after a good EXAMPLE call", async ({ page, request }) => {
  const res = await request.post("/api/demo/bolna", { data: { scenario: "good" } });
  expect(res.ok()).toBeTruthy();
  await page.goto("/d/example-kamla");
  await expect(page.getByText(/EXAMPLE|उदाहरण/i)).toBeVisible();
  await expect(page.getByRole("navigation")).toBeVisible();
});

test("red-flag alert to resolved", async ({ page, request }) => {
  const res = await request.post("/api/demo/bolna", { data: { scenario: "chest" } });
  expect(res.ok()).toBeTruthy();
  await page.goto("/d/example-kamla/alerts");
  await page.getByRole("link").filter({ hasText: /chest|pain|Act|Open/i }).first().click();
  await page.getByRole("button", { name: "I'm on it" }).click();
  await page.getByRole("button", { name: "She's OK" }).click();
  await expect(page.getByRole("button", { name: "She's OK" })).toHaveCount(0);
});

test("editing settings", async ({ page }) => {
  await page.goto("/d/example-kamla/settings");
  await page.locator("#callTime").selectOption("09:00");
  await page.getByRole("button", { name: "Save time" }).click();
  await expect(page.getByText("Changes apply from the next call.")).toBeVisible();
});

test("invite link", async ({ page }) => {
  await page.goto("/d/example-kamla/settings");
  await page.getByRole("button", { name: "Invite someone" }).click();
  const url = page.locator("p").filter({ hasText: /\/invite\// });
  await expect(url).toBeVisible();
  const href = await url.innerText();
  const path = href.includes("/invite/") ? href.slice(href.indexOf("/invite/")) : href;
  await page.goto(path);
  await expect(page.getByRole("heading", { name: /Join this family/i })).toBeVisible();
});

test("Hindi Today has a chip with words", async ({ page }) => {
  await page.goto("/d/example-kamla?lang=hi");
  await expect(page.getByText(/उदाहरण|EXAMPLE/i)).toBeVisible();
  await expect(page.getByRole("navigation")).toBeVisible();
});

test("history opens a stored transcript", async ({ page }) => {
  await page.goto("/d/example-kamla/history");
  await page.getByRole("link").filter({ hasText: /answered|उठी|Good|ठीक/i }).first().click();
  await expect(page.getByText(/Summary|सार|conversation|बात/i).first()).toBeVisible({ timeout: 8000 });
});

test("delete everything on EXAMPLE", async ({ page }) => {
  await page.goto("/d/example-kamla/settings?confirm=delete");
  await page.getByRole("button", { name: /Yes, delete everything/i }).click();
  await expect(page).toHaveURL(/\/$/);
});
