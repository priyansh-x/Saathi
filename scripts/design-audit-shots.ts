/**
 * Capture 390px EN/HI screenshots for docs/saathi/product/design_audit.md
 * Usage: AUDIT_BASE=http://127.0.0.1:43177 npx tsx scripts/design-audit-shots.ts
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.AUDIT_BASE || "http://127.0.0.1:43177";
const OUT = path.join(process.cwd(), "docs/saathi/product/audit-shots");

async function shot(page: Page, name: string) {
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

async function goto(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await context.addInitScript(() => {
    const hide = () => {
      document.querySelectorAll("nextjs-portal, [data-nextjs-toast]").forEach((el) => el.remove());
    };
    hide();
    setInterval(hide, 250);
  });
  const page = await context.newPage();

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const callPath = `/d/example-kamla/calls/call_${today}`;

  await goto(page, `${BASE}/d/example-kamla`);
  await shot(page, "today-en");
  await goto(page, `${BASE}/d/example-kamla?lang=hi`);
  await shot(page, "today-hi");

  await goto(page, `${BASE}/d/example-kamla/alerts`);
  await shot(page, "alerts-en");
  await goto(page, `${BASE}/d/example-kamla/alerts?lang=hi`);
  await shot(page, "alerts-hi");

  await goto(page, `${BASE}/d/example-kamla/history`);
  await shot(page, "history-en");
  await goto(page, `${BASE}/d/example-kamla/history?lang=hi`);
  await shot(page, "history-hi");

  await goto(page, `${BASE}${callPath}?from=today`);
  await shot(page, "call-en");
  await goto(page, `${BASE}${callPath}?lang=hi&from=today`);
  await shot(page, "call-hi");

  await goto(page, `${BASE}/d/example-kamla/settings`);
  await shot(page, "settings-en");
  await goto(page, `${BASE}/d/example-kamla/settings?lang=hi`);
  await shot(page, "settings-hi");

  await goto(page, `${BASE}/onboard`);
  await shot(page, "setup-sign-en");
  await page.getByLabel("Email").fill("audit.child@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Your name").waitFor();
  await shot(page, "setup-you-en");
  await page.getByLabel("Your name").fill("Ananya");
  await page.getByLabel("Your WhatsApp").fill("+910000000001");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Full name").waitFor();
  await shot(page, "setup-parent-en");
  await page.getByLabel("Full name").fill("Kamla Test");
  await page.getByLabel("Their phone").fill("+910000000005");
  await page.getByLabel("City").fill("Delhi");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("When should Saathi ring").waitFor();
  await shot(page, "setup-morning-en");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Morning tablets").waitFor();
  await shot(page, "setup-meds-en");
  await page.getByRole("button", { name: /doesn't take a daily tablet/i }).click();
  await page.getByText("Someone who can knock").waitFor();
  await shot(page, "setup-neighbour-en");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByText("Tell").waitFor();
  await shot(page, "setup-consent-en");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Looks right" }).click();
  await page.getByText("Saathi will call").waitFor();
  await shot(page, "setup-done-en");
  const deskUrl = page.url();

  if (deskUrl.includes("/d/")) {
    // stay on done screen; capture empty today after opening
  }

  await goto(page, `${BASE}/d/example-kamla/settings`);
  const inviteBtn = page.getByRole("button", { name: /Invite/i });
  if (await inviteBtn.count()) {
    await inviteBtn.click();
    await page.locator("text=/invite/").first().waitFor({ timeout: 8000 });
    await shot(page, "invite-created-en");
    const href = await page.locator("p").filter({ hasText: "/invite/" }).innerText();
    const pathOnly = href.slice(href.indexOf("/invite/"));
    await goto(page, `${BASE}${pathOnly}`);
    await shot(page, "invite-join-en");
  }

  await goto(page, `${BASE}/privacy`);
  await shot(page, "privacy-en");
  await goto(page, `${BASE}/privacy?lang=hi`);
  await shot(page, "privacy-hi");

  await goto(page, `${BASE}/demo`);
  await shot(page, "demo-en");
  await goto(page, `${BASE}/demo?lang=hi`);
  await shot(page, "demo-hi");
  await goto(page, `${BASE}/demo?lang=hi&step=call`);
  await shot(page, "demo-call-hi");

  await goto(page, `${BASE}/demo?step=red`);
  await shot(page, "demo-red-en");
  await goto(page, `${BASE}/demo?record=1`);
  await shot(page, "demo-record-en");

  await goto(page, `${BASE}/`);
  await shot(page, "home-en");

  await goto(page, `${BASE}/d/expired-token`);
  await shot(page, "expired-en");
  await goto(page, `${BASE}/d/expired-token?lang=hi`);
  await shot(page, "expired-hi");

  await goto(page, `${BASE}/onboard`);
  if (await page.getByLabel("Email").count()) {
    await page.getByLabel("Email").fill("rohit@example.invalid");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(500);
  }
  await goto(page, `${BASE}/ops`);
  await shot(page, "ops-en");

  await page.request.post(`${BASE}/api/demo/bolna`, { data: { scenario: "chest" } });
  await goto(page, `${BASE}/d/example-kamla`);
  await shot(page, "today-act-en");
  await goto(page, `${BASE}/d/example-kamla?lang=hi`);
  await shot(page, "today-act-hi");
  await goto(page, `${BASE}/d/example-kamla/alerts/alert_${today}?from=today`);
  await shot(page, "alert-detail-en");
  await goto(page, `${BASE}/d/example-kamla/alerts/alert_${today}?lang=hi&from=today`);
  await shot(page, "alert-detail-hi");

  await page.request.post(`${BASE}/api/demo/bolna`, { data: { scenario: "missed" } });
  await goto(page, `${BASE}/d/example-kamla`);
  await shot(page, "today-missed-en");
  await goto(page, `${BASE}/d/example-kamla?lang=hi`);
  await shot(page, "today-missed-hi");

  await page.request.post(`${BASE}/api/demo/bolna`, { data: { scenario: "good" } });
  await goto(page, `${BASE}/d/example-kamla`);
  await shot(page, "today-good-en");
  await goto(page, `${BASE}/d/example-kamla?lang=hi`);
  await shot(page, "today-good-hi");

  // empty-ish: onboarded family if we have a token from done
  if (deskUrl.includes("/d/")) {
    await goto(page, deskUrl);
    await shot(page, "today-empty-new-family");
  }

  console.log("wrote shots to", OUT);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
