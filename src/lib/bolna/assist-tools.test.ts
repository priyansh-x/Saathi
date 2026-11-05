/**
 * Helper tools the parent can ask for mid-call. Every outside service (Open-Meteo, Tavily,
 * DuckDuckGo, Wikipedia, Google News) is stubbed, so these run offline and deterministic.
 * Requests go through the real route handlers, so auth and body checks are covered too.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { closeDb, query } from "@/lib/db/client";
import { seed } from "@/lib/db/seed";
import { clearSearchCache, parseNewsRss } from "@/lib/assist/search";
import { clearWeatherCache, skyWords, weatherAdvice } from "@/lib/assist/weather";
import { ASSIST_LIMITS, istClock, matchRecipient, medicineScheduleTool, type Reachable } from "@/lib/bolna/assist-tools";
import { buildBolnaAgent } from "@/lib/bolna/agent-config";
import { buildCallContext } from "@/lib/bolna/call-context";
import type { Contact } from "@/lib/db/types";
import { POST as sendRoute } from "@/app/api/tools/send_whatsapp_message/route";
import { POST as weatherRoute } from "@/app/api/tools/get_weather/route";
import { POST as searchRoute } from "@/app/api/tools/web_search/route";
import { POST as newsRoute } from "@/app/api/tools/get_news/route";
import { POST as dateRoute } from "@/app/api/tools/get_date_time/route";
import { POST as medsRoute } from "@/app/api/tools/get_medicine_schedule/route";

process.env.MOCK_BOLNA = "1";
process.env.MOCK_WHATSAPP = "1";
process.env.MOCK_EMAIL = "1";
process.env.SAATHI_KILL_SWITCH = "0";
process.env.BOLNA_TOOL_TOKEN = "assist-test-token";

const PARENT = "parent_kamla";
let callN = 0;
const newCall = () => `call_assist_${Date.now()}_${++callN}`;

type Route = { handle: (req: Request) => Promise<Response> };
async function call(route: Route, body: Record<string, string>, token: string | null = "assist-test-token") {
  const res = await route.handle(
    new Request("http://saathi.test/api/tools/x", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, json: (await res.json()) as Record<string, unknown> & { speak?: string } };
}

// --- fetch stub ---------------------------------------------------------------
type Handler = (url: URL, init?: RequestInit) => Response | Promise<Response>;
let routes: [string, Handler][] = [];
let seen: { url: string; init?: RequestInit }[] = [];
const realFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function stub(prefix: string, handler: Handler) {
  routes.push([prefix, handler]);
}

beforeEach(() => {
  routes = [];
  seen = [];
  clearWeatherCache();
  clearSearchCache();
  delete process.env.TAVILY_API_KEY;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    seen.push({ url: url.toString(), init });
    const hit = routes.find(([prefix]) => url.toString().startsWith(prefix));
    if (!hit) throw new TypeError(`unexpected fetch ${url}`);
    return hit[1](url, init);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

before(async () => {
  await seed();
});

after(async () => {
  await closeDb();
});

// --- send_whatsapp_message ---------------------------------------------------------

function contact(over: Partial<Contact>): Contact {
  return {
    id: "c",
    parent_id: PARENT,
    role: "child",
    full_name: "X",
    first_name: "X",
    phone: "+910000000000",
    locale: "en",
    email: null,
    is_owner: false,
    ...over,
  };
}

describe("matchRecipient", () => {
  const rohit = contact({ id: "r", full_name: "Rohit Sharma", first_name: "Rohit" });
  const priya = contact({ id: "p", full_name: "Priya Sharma", first_name: "Priya" });
  const sunita = contact({ id: "s", role: "neighbour", full_name: "Sunita Verma", first_name: "Sunita" });
  const one: Reachable[] = [
    { contact: rohit, label: "Rohit" },
    { contact: sunita, label: "Sunita (neighbour)" },
  ];
  const two: Reachable[] = [...one, { contact: priya, label: "Priya" }];

  it("matches a first name, a full name, and a name with ji", () => {
    for (const said of ["Rohit", "rohit sharma", "Rohit ji", "ROHIT."]) {
      const m = matchRecipient(said, one);
      assert.equal(m.kind, "ok", said);
      if (m.kind === "ok") assert.equal(m.contact.id, "r");
    }
  });

  it("maps neighbour words, in English and Hindi, to the neighbour", () => {
    for (const said of ["neighbour", "padosi", "पड़ोसी", "Sunita"]) {
      const m = matchRecipient(said, one);
      assert.equal(m.kind === "ok" && m.contact.id, "s", said);
    }
  });

  it("maps 'beta' to the only child, and asks which one when there are two", () => {
    const single = matchRecipient("beta", one);
    assert.equal(single.kind === "ok" && single.contact.id, "r");
    const many = matchRecipient("beta", two);
    assert.equal(many.kind, "ambiguous");
    if (many.kind === "ambiguous") assert.deepEqual(many.options.sort(), ["Priya", "Rohit"]);
  });

  it("refuses a stranger or a phone number and lists who can be reached", () => {
    for (const said of ["Mr Gupta", "9876543210", "bank manager", ""]) {
      const m = matchRecipient(said, one);
      assert.equal(m.kind, "unknown", said);
      if (m.kind === "unknown") assert.deepEqual(m.options, ["Rohit", "Sunita (neighbour)"]);
    }
  });
});

describe("send_whatsapp_message", () => {
  beforeEach(async () => {
    await seed();
  });

  it("sends to a family member as parent_relay and says so", async () => {
    const callSid = newCall();
    const { status, json: res } = await call(sendRoute, {
      call_sid: callSid,
      parent_id: PARENT,
      recipient: "Rohit",
      message: "Shaam ko phone karna",
    });
    assert.equal(status, 200);
    assert.equal(res.ok, true);
    assert.equal(res.sent_to, "Rohit");
    assert.equal(res.via, "whatsapp");
    const rows = await query<{ template: string; body: string; to_phone: string }>(
      `select template, body, to_phone from outbound_messages where id like $1`,
      [`%ask_${callSid}%`],
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.template, "parent_relay");
    assert.match(rows[0]!.body, /Shaam ko phone karna/);
  });

  it("reaches the neighbour only after they said yes", async () => {
    const first = await call(sendRoute, { call_sid: newCall(), parent_id: PARENT, recipient: "padosi", message: "Kal aana" });
    assert.equal(first.json.sent_to, "Sunita");

    await query(`update consents set granted = false where parent_id = $1 and kind = 'neighbour_whatsapp'`, [PARENT]);
    const refused = await call(sendRoute, { call_sid: newCall(), parent_id: PARENT, recipient: "Sunita", message: "Kal aana" });
    assert.equal(refused.json.ok, false);
    assert.equal(refused.json.error, "not_allowed_recipient");
    assert.deepEqual(refused.json.can_message, ["Rohit"]);
  });

  it("never messages a number or a stranger, and sends nothing", async () => {
    const callSid = newCall();
    for (const recipient of ["9876543210", "+91 98765 43210", "Bank wale"]) {
      const res = await call(sendRoute, { call_sid: callSid, parent_id: PARENT, recipient, message: "OTP 123456" });
      assert.equal(res.json.error, "not_allowed_recipient", recipient);
      assert.match(String(res.json.speak), /Rohit/);
    }
    const rows = await query<{ n: number }>(`select count(*)::int as n from outbound_messages where id like $1`, [`%${callSid}%`]);
    assert.equal(rows[0]!.n, 0);
  });

  it("skips anyone who sent STOP", async () => {
    await query(`update contacts set whatsapp_opted_out_at = '2026-11-05T09:00:00+05:30' where id = 'contact_rohit'`);
    const res = await call(sendRoute, { call_sid: newCall(), parent_id: PARENT, recipient: "Rohit", message: "Hello" });
    assert.equal(res.json.error, "not_allowed_recipient");
  });

  it("does not send twice when Bolna retries the same request", async () => {
    const callSid = newCall();
    const body = { call_sid: callSid, parent_id: PARENT, recipient: "Rohit", message: "Dawai le li" };
    const a = await call(sendRoute, body);
    const b = await call(sendRoute, body);
    assert.equal(a.json.ok, true);
    assert.equal(b.json.replay, true);
    const rows = await query<{ n: number }>(`select count(*)::int as n from outbound_messages where id like $1`, [`%ask_${callSid}%`]);
    assert.equal(rows[0]!.n, 1);
  });

  it(`stops after ${ASSIST_LIMITS.send_whatsapp_message} messages in one call`, async () => {
    const callSid = newCall();
    for (let i = 0; i < ASSIST_LIMITS.send_whatsapp_message; i++) {
      const res = await call(sendRoute, { call_sid: callSid, parent_id: PARENT, recipient: "Rohit", message: `Message ${i}` });
      assert.equal(res.json.ok, true, `message ${i}`);
    }
    const over = await call(sendRoute, { call_sid: callSid, parent_id: PARENT, recipient: "Rohit", message: "One more" });
    assert.equal(over.json.error, "limit_reached");
  });

  it("rejects empty and over-long messages", async () => {
    const empty = await call(sendRoute, { call_sid: newCall(), parent_id: PARENT, recipient: "Rohit", message: "   " });
    assert.equal(empty.status, 400);
    const long = await call(sendRoute, { call_sid: newCall(), parent_id: PARENT, recipient: "Rohit", message: "a".repeat(501) });
    assert.equal(long.json.error, "message_too_long");
  });

  it("only acts for the household in parent_id", async () => {
    const res = await call(sendRoute, { call_sid: newCall(), parent_id: "parent_nobody", recipient: "Rohit", message: "Hi" });
    assert.equal(res.json.error, "not_allowed_recipient");
    assert.deepEqual(res.json.can_message, []);
  });
});

// --- route auth and body ----------------------------------------------------------------

describe("tool routes", () => {
  const all: [string, Route, Record<string, string>][] = [
    ["send_whatsapp_message", sendRoute, { recipient: "Rohit", message: "Hi" }],
    ["get_weather", weatherRoute, { day: "today" }],
    ["web_search", searchRoute, { query: "x" }],
    ["get_news", newsRoute, { topic: "top" }],
    ["get_date_time", dateRoute, {}],
    ["get_medicine_schedule", medsRoute, {}],
  ];

  it("refuses requests without the Bolna tool token", async () => {
    for (const [name, route, extra] of all) {
      const missing = await call(route, { call_sid: "c", parent_id: PARENT, ...extra }, null);
      assert.equal(missing.status, 401, name);
      const wrong = await call(route, { call_sid: "c", parent_id: PARENT, ...extra }, "not-the-token");
      assert.equal(wrong.status, 401, name);
    }
  });

  it("needs call_sid and parent_id, and treats Bolna's unfilled params as missing", async () => {
    for (const [name, route, extra] of all) {
      const res = await call(route, { call_sid: "c", parent_id: "%(parent_id)s", ...extra });
      assert.equal(res.status, 400, name);
      assert.equal(res.json.missing, "parent_id", name);
    }
    const none = await call(searchRoute, { call_sid: "c", parent_id: PARENT, query: "None" });
    assert.equal(none.json.missing, "query");
  });

  it("has a route file for every tool the agent registers", () => {
    const agent = buildBolnaAgent(process.cwd(), "https://saathi.test", {});
    const params = agent.agent_config.tasks[0]!.tools_config.api_tools.tools_params;
    for (const [name, value] of Object.entries(params)) {
      const suffix = new URL(value.url).pathname;
      assert.ok(existsSync(path.join(process.cwd(), "src/app", suffix, "route.ts")), `${name} → ${suffix}`);
    }
    for (const [name] of all) assert.ok(params[name], `${name} is registered with Bolna`);
  });
});

// --- get_weather -----------------------------------------------------------------------

function stubWeather(opts: { geo?: unknown; forecast?: unknown } = {}) {
  stub("https://geocoding-api.open-meteo.com/", () =>
    json(
      opts.geo ?? {
        results: [
          { name: "Delhi", latitude: 39.7, longitude: -105.1, country_code: "US", admin1: "Colorado" },
          { name: "Delhi", latitude: 28.65, longitude: 77.23, country_code: "IN", admin1: "Delhi" },
        ],
      },
    ),
  );
  stub("https://api.open-meteo.com/", () =>
    json(
      opts.forecast ?? {
        current: { temperature_2m: 31.4, apparent_temperature: 34.2, relative_humidity_2m: 40, weather_code: 1 },
        daily: {
          time: ["2026-11-05", "2026-11-06"],
          weather_code: [1, 63],
          temperature_2m_max: [36.2, 29.6],
          temperature_2m_min: [21.1, 18.4],
          precipitation_probability_max: [5, 80],
          uv_index_max: [8.5, 3],
        },
      },
    ),
  );
}

describe("get_weather", () => {
  it("defaults to the parent's city, prefers the Indian match, and gives a spoken summary", async () => {
    stubWeather();
    const { json: res } = await call(weatherRoute, { call_sid: newCall(), parent_id: PARENT, day: "today" });
    assert.equal(res.ok, true);
    assert.equal(res.place, "Delhi");
    assert.equal(res.high_c, 36);
    assert.equal(res.now_c, 31);
    assert.match(String(res.speak), /Today in Delhi: partly cloudy, 31°C now, high 36°C, low 21°C, 5% chance of rain/);
    assert.match(String(res.speak), /drink plenty of water/);
    const forecastCall = seen.find((row) => row.url.startsWith("https://api.open-meteo.com/"));
    assert.match(forecastCall!.url, /latitude=28\.65&longitude=77\.23/);
    assert.match(forecastCall!.url, /timezone=Asia%2FKolkata/);
  });

  it("answers for tomorrow and for a city she names, with an umbrella tip", async () => {
    stubWeather({ geo: { results: [{ name: "Varanasi", latitude: 25.3, longitude: 83.0, country_code: "IN", admin1: "Uttar Pradesh" }] } });
    const { json: res } = await call(weatherRoute, { call_sid: newCall(), parent_id: PARENT, city: "Varanasi", day: "tomorrow" });
    assert.equal(res.place, "Varanasi, Uttar Pradesh");
    assert.equal(res.rain_chance_pct, 80);
    assert.equal(res.now_c, null);
    assert.match(String(res.speak), /^Tomorrow in Varanasi: rain/);
    assert.match(String(res.speak), /carry an umbrella/);
  });

  it("caches a city's forecast instead of fetching again in the same call", async () => {
    stubWeather();
    const callSid = newCall();
    await call(weatherRoute, { call_sid: callSid, parent_id: PARENT, day: "today" });
    await call(weatherRoute, { call_sid: callSid, parent_id: PARENT, day: "tomorrow" });
    assert.equal(seen.length, 2, seen.map((s) => s.url).join("\n"));
  });

  it("says when it cannot find a place, and apologises when the service is down", async () => {
    stub("https://geocoding-api.open-meteo.com/", () => json({}));
    const unknown = await call(weatherRoute, { call_sid: newCall(), parent_id: PARENT, city: "Zzyzx", day: "today" });
    assert.equal(unknown.json.error, "unknown_city");

    routes = [];
    stub("https://geocoding-api.open-meteo.com/", () => json({ error: true }, 503));
    const down = await call(weatherRoute, { call_sid: newCall(), parent_id: PARENT, city: "Pune", day: "today" });
    assert.equal(down.status, 200);
    assert.equal(down.json.ok, false);
    assert.equal(down.json.error, "lookup_failed");
    assert.match(String(down.json.speak), /could not get that/);
  });

  it("words weather codes and only gives practical tips", () => {
    assert.equal(skyWords(0), "clear sky");
    assert.equal(skyWords(95), "thunderstorm");
    assert.equal(skyWords(45), "foggy");
    assert.deepEqual(weatherAdvice({ high: 25, low: 15, rain: 10 }), []);
    assert.deepEqual(weatherAdvice({ high: 40, low: 28, rain: 0 }), ["very hot: drink water and avoid going out at midday"]);
    assert.ok(weatherAdvice({ high: 18, low: 8, rain: 0 }).some((tip) => tip.startsWith("cold")));
  });
});

// --- web_search -----------------------------------------------------------------------

describe("web_search", () => {
  it("without a key answers for free from DuckDuckGo", async () => {
    stub("https://api.duckduckgo.com/", () =>
      json({ AbstractText: "Diwali is the festival of lights, celebrated in October or November.", AbstractSource: "Wikipedia", AbstractURL: "https://en.wikipedia.org/wiki/Diwali" }),
    );
    const { json: res } = await call(searchRoute, { call_sid: newCall(), parent_id: PARENT, query: "when is diwali" });
    assert.equal(res.ok, true);
    assert.equal(res.found, true);
    assert.equal(res.provider, "duckduckgo");
    assert.match(String(res.speak), /festival of lights/);
    assert.ok(!seen.some((row) => row.url.includes("tavily")));
  });

  it("falls back to a Wikipedia summary when DuckDuckGo has nothing or is down", async () => {
    stub("https://api.duckduckgo.com/", () => json({}, 500));
    stub("https://en.wikipedia.org/w/api.php", () => json({ query: { search: [{ title: "Sachin Tendulkar" }] } }));
    stub("https://en.wikipedia.org/api/rest_v1/page/summary/", (url) => {
      assert.match(url.pathname, /Sachin_Tendulkar$/);
      return json({ extract: "Sachin Tendulkar is an Indian former cricketer.", content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Sachin_Tendulkar" } } });
    });
    const { json: res } = await call(searchRoute, { call_sid: newCall(), parent_id: PARENT, query: "who is sachin tendulkar" });
    assert.equal(res.provider, "wikipedia");
    assert.match(String(res.answer), /former cricketer/);
  });

  it("uses Tavily with the key in the header when TAVILY_API_KEY is set", async () => {
    process.env.TAVILY_API_KEY = "tvly-test";
    stub("https://api.tavily.com/search", (_url, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("authorization"), "Bearer tvly-test");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.query, "India vs Australia score today");
      assert.equal(body.include_answer, true);
      assert.ok(!("api_key" in body), "key never goes in the body");
      return json({ answer: "India won by 6 wickets.", results: [{ title: "Match report", url: "https://example.com/m" }] });
    });
    const { json: res } = await call(searchRoute, { call_sid: newCall(), parent_id: PARENT, query: "India vs Australia score today" });
    assert.equal(res.provider, "tavily");
    assert.equal(res.speak, "India won by 6 wickets.");
    assert.deepEqual(res.sources, ["Match report"]);
  });

  it("says it found nothing rather than guessing", async () => {
    stub("https://api.duckduckgo.com/", () => json({}));
    stub("https://en.wikipedia.org/w/api.php", () => json({ query: { search: [] } }));
    const { json: res } = await call(searchRoute, { call_sid: newCall(), parent_id: PARENT, query: "qwxz nonsense" });
    assert.equal(res.ok, true);
    assert.equal(res.found, false);
    assert.match(String(res.speak), /could not find/);
  });

  it("keeps the spoken answer short", async () => {
    stub("https://api.duckduckgo.com/", () => json({ AbstractText: "Long sentence about the topic. ".repeat(60) }));
    const { json: res } = await call(searchRoute, { call_sid: newCall(), parent_id: PARENT, query: "long" });
    assert.ok(String(res.answer).length <= 321, String(String(res.answer).length));
    assert.match(String(res.answer), /\.$/, "ends on a full sentence");
  });

  it(`stops after ${ASSIST_LIMITS.web_search} searches in one call`, async () => {
    stub("https://api.duckduckgo.com/", () => json({ Answer: "42" }));
    const callSid = newCall();
    for (let i = 0; i < ASSIST_LIMITS.web_search; i++) {
      assert.equal((await call(searchRoute, { call_sid: callSid, parent_id: PARENT, query: `q${i}` })).json.ok, true);
    }
    assert.equal((await call(searchRoute, { call_sid: callSid, parent_id: PARENT, query: "one more" })).json.error, "limit_reached");
  });
});

// --- get_news -----------------------------------------------------------------------------

const RSS = `<?xml version="1.0"?><rss><channel>
<item><title>Monsoon withdraws from Delhi - The Hindu</title><source url="https://thehindu.com">The Hindu</source></item>
<item><title><![CDATA[India &amp; Japan sign rail deal - NDTV]]></title><source url="https://ndtv.com">NDTV</source></item>
<item><title>Sensex closes higher - Mint</title><source url="https://livemint.com">Mint</source></item>
<item><title>Fourth story - BBC</title><source url="https://bbc.com">BBC</source></item>
</channel></rss>`;

describe("get_news", () => {
  it("reads headlines from Google News for free, in the parent's language, without publisher suffixes", async () => {
    stub("https://news.google.com/rss", (url) => {
      assert.match(url.search, /hl=hi&gl=IN&ceid=IN:hi/);
      return new Response(RSS);
    });
    const { json: res } = await call(newsRoute, { call_sid: newCall(), parent_id: PARENT, topic: "top" });
    assert.equal(res.ok, true);
    assert.deepEqual((res.headlines as string[]).slice(0, 2), ["Monsoon withdraws from Delhi", "India & Japan sign rail deal"]);
    assert.equal(res.speak, "Top news: Monsoon withdraws from Delhi. India & Japan sign rail deal. Sensex closes higher.");
  });

  it("maps topics to sections and ignores unknown topics", async () => {
    stub("https://news.google.com/rss", () => new Response(RSS));
    await call(newsRoute, { call_sid: newCall(), parent_id: PARENT, topic: "sports" });
    assert.match(seen[0]!.url, /\/headlines\/section\/topic\/SPORTS\?/);
    clearSearchCache();
    const { json: res } = await call(newsRoute, { call_sid: newCall(), parent_id: PARENT, topic: "gossip" });
    assert.equal(res.topic, "top");
  });

  it("uses Tavily news when a key is set", async () => {
    process.env.TAVILY_API_KEY = "tvly-test";
    stub("https://api.tavily.com/search", (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.topic, "news");
      return json({ results: [{ title: "Budget session begins", url: "https://www.example.in/a" }] });
    });
    const { json: res } = await call(newsRoute, { call_sid: newCall(), parent_id: PARENT, topic: "india" });
    assert.equal(res.provider, "tavily");
    assert.deepEqual(res.headlines, ["Budget session begins"]);
  });

  it("parses RSS defensively", () => {
    assert.deepEqual(parseNewsRss("<rss></rss>"), []);
    assert.equal(parseNewsRss(RSS, 2).length, 2);
  });
});

// --- get_date_time and get_medicine_schedule -----------------------------------------------

describe("get_date_time", () => {
  it("gives Indian time, weekday in English and Hindi, and the date", () => {
    const clock = istClock(new Date("2026-11-05T10:45:00Z"));
    assert.equal(clock.weekday, "Thursday");
    assert.equal(clock.weekday_hi, "गुरुवार");
    assert.equal(clock.date, "5 November 2026");
    assert.equal(clock.time, "4:15 PM");
  });

  it("answers through the route", async () => {
    const { json: res } = await call(dateRoute, { call_sid: newCall(), parent_id: PARENT });
    assert.equal(res.ok, true);
    assert.match(String(res.speak), /^It is \d{1,2}:\d{2} (AM|PM) on \w+day, \d{1,2} \w+ \d{4}\.$/);
  });
});

describe("get_medicine_schedule", () => {
  beforeEach(async () => {
    await seed();
  });

  it("splits later-today from earlier doses and never says to take a missed one now", async () => {
    // 10:00 IST: Amlodipine (08:45) is earlier, Metformin (13:30) is later.
    await query(`delete from dose_logs where parent_id = $1`, [PARENT]);
    const res = await medicineScheduleTool({ call_sid: newCall(), parent_id: PARENT }, 10 * 60);
    assert.equal(res.ok, true);
    if (!("speak" in res)) throw new Error("no speak");
    assert.equal(res.speak, "Later today: Metformin at 13:30. Not marked as taken yet from earlier: Amlodipine.");
    assert.doesNotMatch(res.speak, /take (it )?now|still to take/i);
  });

  it("counts a dose logged today as taken", async () => {
    await query(`delete from dose_logs where parent_id = $1`, [PARENT]);
    const callSid = newCall();
    const { logMedicine } = await import("@/lib/bolna/tools");
    await logMedicine({ call_sid: callSid, parent_id: PARENT, medicine_id: "med_amlo", status: "taken" });
    const res = await medicineScheduleTool({ call_sid: callSid, parent_id: PARENT }, 10 * 60);
    if (!("speak" in res)) throw new Error("no speak");
    assert.equal(res.speak, "Later today: Metformin at 13:30.");
    const amlo = res.medicines.find((m) => m.name === "Amlodipine");
    assert.equal(amlo?.status, "taken");
  });

  it("answers through the route", async () => {
    const { status, json: res } = await call(medsRoute, { call_sid: newCall(), parent_id: PARENT });
    assert.equal(status, 200);
    assert.equal(res.ok, true);
  });
});

// --- call context ------------------------------------------------------------------------

describe("family_contacts in the call context", () => {
  it("lists exactly who send_whatsapp_message accepts", async () => {
    await seed();
    assert.equal((await buildCallContext(PARENT)).family_contacts, "Rohit, Sunita (neighbour)");
    await query(`update consents set granted = false where parent_id = $1 and kind = 'neighbour_whatsapp'`, [PARENT]);
    assert.equal((await buildCallContext(PARENT)).family_contacts, "Rohit");
  });
});
