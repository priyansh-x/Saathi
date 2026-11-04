import { expect, test } from "@playwright/test";

test("desk deep link paints on the right pane with no slide", async ({ page }) => {
  await page.goto("/d/example-kamla/history?lang=en");
  const track = page.locator(".desk-pager-track");
  await expect(track).toHaveAttribute("style", /calc\(-25% \+ 0px\)/);
  const left = await page.locator(".desk-page").nth(1).evaluate((el) => el.getBoundingClientRect().left);
  expect(Math.round(left)).toBe(0);
  await expect(page.locator(".desk-page").nth(0)).toHaveAttribute("inert", "");
});

test("tab tap switches instantly, updates title, re-tap scrolls to top", async ({ page }) => {
  await page.goto("/d/example-kamla?lang=en");
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveTitle("Settings · Saathi");
  await expect(page.locator(".desk-pager-track")).toHaveCSS("transition-property", /all|none|transform/);
  const pane = page.locator(".desk-page").nth(3);
  await pane.evaluate((el) => (el.scrollTop = 600));
  await page.getByRole("link", { name: "Settings" }).click();
  await expect.poll(() => pane.evaluate((el) => el.scrollTop)).toBe(0);
});

test("settings save shows feedback next to the section", async ({ page }) => {
  await page.goto("/d/example-kamla/settings?lang=en");
  const form = page.locator("form", { has: page.locator("#callTime") });
  await form.getByRole("button", { name: "Save time" }).click();
  await expect(form.getByRole("status")).toContainText("Saved");
  expect(page.url()).not.toContain("callTime=");
});

test("sign-in submits on Enter", async ({ page }) => {
  await page.goto("/signin?lang=en");
  await page.locator("#email").fill("nobody@example.com");
  await page.locator("#email").press("Enter");
  await expect(page.getByRole("alert")).toBeVisible();
});

test("dark mode status ink is readable", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saathi-desk-ui", JSON.stringify({ theme: "dark" })));
  await page.goto("/d/example-kamla?lang=en");
  const color = await page.locator(".text-good").first().evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe("rgb(111, 207, 151)");
});
