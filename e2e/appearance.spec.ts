import { expect, test } from "@playwright/test";

const PAPER = "rgb(247, 245, 240)";

async function bodyBg(page: import("@playwright/test").Page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test("desk stays paper-light on a dark phone until Dark is chosen", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/d/example-kamla");
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  expect(await bodyBg(page)).toBe(PAPER);

  await page.getByRole("button", { name: "Display, alerts, and a short guide" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "true");

  await dialog.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  expect(await bodyBg(page)).not.toBe(PAPER);

  await dialog.getByRole("button", { name: "Match phone" }).click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);

  await dialog.getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  await dialog.getByRole("button", { name: "Done" }).click();

  await page.goto("/d/example-kamla/settings");
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  expect(await bodyBg(page)).toBe(PAPER);
});
