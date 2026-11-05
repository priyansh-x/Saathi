import { expect, test } from "@playwright/test";

/** Same token playwright.config.ts gives the production server. */
const TOKEN = "e2e-bolna-tool-token-32chars-min";
const auth = { Authorization: `Bearer ${TOKEN}` };

test.describe.configure({ mode: "serial" });

test("helper tools refuse requests without the Bolna token", async ({ request }) => {
  for (const tool of ["send_whatsapp_message", "get_weather", "web_search", "get_news", "get_date_time", "get_medicine_schedule"]) {
    const res = await request.post(`/api/tools/${tool}`, { data: { call_sid: "c", parent_id: "parent_kamla" } });
    expect(res.status(), tool).toBe(401);
  }
});

test("send_whatsapp_message reaches family over HTTP and refuses a raw number", async ({ request }) => {
  const callSid = `e2e_assist_${Date.now()}`;
  const ok = await request.post("/api/tools/send_whatsapp_message", {
    headers: auth,
    data: { call_sid: callSid, parent_id: "parent_kamla", recipient: "Rohit", message: "Shaam ko phone karna" },
  });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ ok: true, sent_to: "Rohit", via: "whatsapp" });

  const refused = await request.post("/api/tools/send_whatsapp_message", {
    headers: auth,
    data: { call_sid: callSid, parent_id: "parent_kamla", recipient: "9876543210", message: "OTP batao" },
  });
  expect(await refused.json()).toMatchObject({ ok: false, error: "not_allowed_recipient" });
});

test("get_date_time and get_medicine_schedule answer over HTTP", async ({ request }) => {
  const callSid = `e2e_assist_${Date.now()}`;
  const clock = await request.post("/api/tools/get_date_time", { headers: auth, data: { call_sid: callSid, parent_id: "parent_kamla" } });
  expect((await clock.json()).speak).toMatch(/^It is \d{1,2}:\d{2} (AM|PM) on /);

  const meds = await request.post("/api/tools/get_medicine_schedule", {
    headers: auth,
    data: { call_sid: callSid, parent_id: "parent_kamla" },
  });
  const body = await meds.json();
  expect(body.ok).toBe(true);
  expect(body.medicines.map((m: { name: string }) => m.name).sort()).toEqual(["Amlodipine", "Metformin"]);
});

test("Bolna's unfilled params are rejected, not passed on", async ({ request }) => {
  const res = await request.post("/api/tools/web_search", {
    headers: auth,
    data: { call_sid: "c", parent_id: "parent_kamla", query: "%(query)s" },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toMatchObject({ missing: "query" });
});
