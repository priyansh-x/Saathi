import { expect, test } from "@playwright/test";

async function paperBg(page: import("@playwright/test").Page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test("desk stays paper-light until Dark is chosen", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  expect(await page.locator("html").getAttribute("class")).not.toMatch(/\bdark\b/);
  const homeBg = await paperBg(page);
  expect(homeBg).toBe("rgb(247, 245, 240)");

  await page.goto("/d/example-kamla");
  await expect(page.getByRole("navigation")).toBeVisible();
  expect(await page.locator("html").getAttribute("class")).not.toMatch(/\bdark\b/);
  expect(await paperBg(page)).toBe("rgb(247, 245, 240)");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("light");

  await page.getByRole("button", { name: /Her profile and display|उनकी प्रोफ़ाइल/ }).click();
  await expect(page.getByText("Appearance")).toBeVisible();
  await expect(page.getByRole("button", { name: "Light" })).toBeVisible();
  await page.getByRole("button", { name: "Dark" }).click();
  await expect.poll(async () => page.locator("html").getAttribute("class")).toMatch(/\bdark\b/);
  const darkBg = await paperBg(page);
  expect(darkBg).not.toBe("rgb(247, 245, 240)");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");

  await page.getByRole("button", { name: "Light" }).click();
  await expect.poll(async () => page.locator("html").getAttribute("class")).not.toMatch(/\bdark\b/);
  expect(await paperBg(page)).toBe("rgb(247, 245, 240)");

  await page.getByRole("button", { name: "Done" }).click();
  await page.goto("/d/example-kamla/history");
  expect(await paperBg(page)).toBe("rgb(247, 245, 240)");
  await page.goto("/d/example-kamla/settings");
  expect(await paperBg(page)).toBe("rgb(247, 245, 240)");
});
