/**
 * Helper tools the parent can use during a call: message family on WhatsApp, weather,
 * web search, news, the date and time, and today's medicines.
 *
 * Every tool:
 * - is scoped to the household in parent_id (recipients come from that family only),
 * - is capped per call so a confused loop or a scammer on the line cannot spam,
 * - answers with a short `speak` line the agent can say as-is, plus the data behind it,
 * - never throws to Bolna: an outage becomes { ok: false, error } and the agent apologises.
 */
import { query } from "@/lib/db/client";
import { contactsFor, medicinesWithTimes } from "@/lib/db/queries";
import type { Contact } from "@/lib/db/types";
import { AssistFetchError } from "@/lib/assist/fetch";
import { headlines, NEWS_TOPICS, webSearch, type NewsTopic } from "@/lib/assist/search";
import { getWeather, type WeatherDay } from "@/lib/assist/weather";
import { neighbourOptedIn } from "@/lib/neighbour";
import { istDayKey, minutesNowIst, parseHhMm } from "@/lib/time";
import { rememberTool, sha } from "@/lib/bolna/tools";

export const ASSIST_LIMITS = {
  send_whatsapp_message: 5,
  get_weather: 6,
  web_search: 8,
  get_news: 4,
  get_date_time: 10,
  get_medicine_schedule: 6,
} as const;

export type AssistTool = keyof typeof ASSIST_LIMITS;

export const WHATSAPP_MESSAGE_MAX = 500;

type Base = { call_sid: string; parent_id: string };

async function overLimit(callSid: string, tool: AssistTool) {
  const rows = await query<{ n: number }>(
    `select count(*)::int as n from tool_call_logs where call_sid = $1 and tool = $2`,
    [callSid, tool],
  );
  return (rows[0]?.n ?? 0) >= ASSIST_LIMITS[tool];
}

/** Log the call; refuse past the per-call cap. Replays of the same request do not count twice. */
async function admit(tool: AssistTool, input: Base, naturalKey: string, payload: unknown) {
  const seen = await query<{ id: string }>(
    `select id from tool_call_logs where call_sid = $1 and tool = $2 and natural_key = $3`,
    [input.call_sid, tool, naturalKey],
  );
  if (!seen[0] && (await overLimit(input.call_sid, tool))) return { ok: false as const, error: "limit_reached" as const };
  const remembered = await rememberTool({
    callSid: input.call_sid,
    parentId: input.parent_id,
    tool,
    naturalKey,
    payload,
  });
  return { ok: true as const, replay: !remembered.fresh };
}

async function parentRow(parentId: string) {
  const rows = await query<{ first_name: string; address_term: string | null; city: string; languages: string; call_time: string }>(
    `select first_name, address_term, city, languages, call_time from parents where id = $1`,
    [parentId],
  );
  return rows[0] ?? null;
}

function lookupFailed(err: unknown) {
  const reason = err instanceof AssistFetchError ? err.reason : "error";
  return {
    ok: false as const,
    error: reason === "timeout" ? ("timeout" as const) : ("lookup_failed" as const),
    speak: "Sorry, I could not get that right now. Shall we try again later?",
  };
}

// ---------------------------------------------------------------------------
// send_whatsapp_message
// ---------------------------------------------------------------------------

const NEIGHBOUR_WORDS = ["neighbour", "neighbor", "padosi", "padosan", "पड़ोसी", "पड़ोसन", "पडोसी"];
const CHILD_WORDS = ["beta", "beti", "bahu", "son", "daughter", "child", "बेटा", "बेटी", "बहू", "बच्चे", "bachche"];
const HONORIFICS = /\b(ji|जी|bhaiya|bhai|didi|beta|beti)\b/giu;

function norm(text: string) {
  return text
    .toLowerCase()
    .replace(/[.,!?'"“”‘’()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type Reachable = { contact: Contact; label: string };

/** Who this parent may message: family members who have not sent STOP, and a neighbour who said yes. */
export async function reachableContacts(parentId: string): Promise<Reachable[]> {
  const contacts = await contactsFor(parentId);
  const out: Reachable[] = [];
  for (const contact of contacts) {
    if (contact.whatsapp_opted_out_at) continue;
    if (contact.role === "child") out.push({ contact, label: contact.first_name });
  }
  const neighbour = contacts.find((c) => c.role === "neighbour" && !c.whatsapp_opted_out_at);
  if (neighbour && (await neighbourOptedIn(parentId))) out.push({ contact: neighbour, label: `${neighbour.first_name} (neighbour)` });
  return out;
}

export type RecipientMatch =
  | { kind: "ok"; contact: Contact }
  | { kind: "ambiguous"; options: string[] }
  | { kind: "unknown"; options: string[] };

export function matchRecipient(spoken: string, reachable: Reachable[]): RecipientMatch {
  const options = reachable.map((row) => row.label);
  const said = norm(spoken);
  if (!said) return { kind: "unknown", options };
  const bare = norm(said.replace(HONORIFICS, " "));

  const byName = reachable.filter(({ contact }) => {
    const first = norm(contact.first_name);
    const full = norm(contact.full_name);
    return bare === first || bare === full || bare.split(" ").includes(first) || (bare.length > 2 && full.includes(bare));
  });
  if (byName.length === 1) return { kind: "ok", contact: byName[0]!.contact };
  if (byName.length > 1) return { kind: "ambiguous", options: byName.map((row) => row.label) };

  if (NEIGHBOUR_WORDS.some((word) => said.includes(word))) {
    const neighbour = reachable.find((row) => row.contact.role === "neighbour");
    return neighbour ? { kind: "ok", contact: neighbour.contact } : { kind: "unknown", options };
  }
  if (CHILD_WORDS.some((word) => said.split(" ").includes(word))) {
    const kids = reachable.filter((row) => row.contact.role === "child");
    if (kids.length === 1) return { kind: "ok", contact: kids[0]!.contact };
    if (kids.length > 1) return { kind: "ambiguous", options: kids.map((row) => row.label) };
  }
  return { kind: "unknown", options };
}

export async function sendWhatsappToContact(input: Base & { recipient: string; message: string }) {
  const message = (input.message || "").replace(/\s+/g, " ").trim();
  if (!message) return { ok: false as const, error: "empty_message" as const };
  if (message.length > WHATSAPP_MESSAGE_MAX) {
    return { ok: false as const, error: "message_too_long" as const, max_chars: WHATSAPP_MESSAGE_MAX };
  }
  const reachable = await reachableContacts(input.parent_id);
  const match = matchRecipient(input.recipient || "", reachable);
  if (match.kind === "unknown") {
    return {
      ok: false as const,
      error: "not_allowed_recipient" as const,
      can_message: match.options,
      speak: match.options.length
        ? `I can only send messages to ${match.options.join(", ")}.`
        : "There is nobody I can message for you yet.",
    };
  }
  if (match.kind === "ambiguous") {
    return { ok: false as const, error: "which_person" as const, options: match.options };
  }
  const to = match.contact;
  const naturalKey = `${input.call_sid}:${to.id}:${sha(message)}`;
  const admitted = await admit("send_whatsapp_message", input, naturalKey, { to: to.id, message });
  if (!admitted.ok) return { ...admitted, speak: "I have already sent several messages on this call." };

  const parent = await parentRow(input.parent_id);
  const who = parent?.address_term?.trim() || parent?.first_name || "Maa";
  const { sendFamilyMessage } = await import("@/lib/whatsapp/send");
  const sent = await sendFamilyMessage({
    parentId: input.parent_id,
    toPhone: to.phone,
    locale: to.locale === "hi" ? "hi" : "en",
    intended: "parent_relay",
    vars: [who, message, parent?.call_time || "today"],
    freeText: `${who}: ${message}`,
    idempotencyKey: `ask_${naturalKey.replace(/[^a-zA-Z0-9_:]/g, "")}`,
  });
  const status = String(sent.status);
  const reached = sent.ok && !status.startsWith("blocked") && !status.startsWith("failed") && status !== "undelivered";
  return {
    ok: reached,
    sent_to: to.first_name,
    via: reached ? sent.channel : ("none" as const),
    replay: admitted.replay || status === "duplicate",
    ...(reached ? {} : { error: "not_delivered" as const }),
    speak: reached
      ? sent.channel === "whatsapp"
        ? `Sent to ${to.first_name} on WhatsApp.`
        : `WhatsApp did not go through, so I sent it to ${to.first_name} another way.`
      : `I could not reach ${to.first_name} right now. I will let the family know.`,
  };
}

// ---------------------------------------------------------------------------
// get_weather
// ---------------------------------------------------------------------------

export async function weatherTool(input: Base & { city?: string; day?: string }) {
  const parent = await parentRow(input.parent_id);
  const city = (input.city || "").trim() || parent?.city || "";
  if (!city) return { ok: false as const, error: "no_city" as const };
  const day: WeatherDay = input.day === "tomorrow" ? "tomorrow" : "today";
  const admitted = await admit("get_weather", input, `${input.call_sid}:${day}:${sha(city.toLowerCase())}`, { city, day });
  if (!admitted.ok) return admitted;
  try {
    const report = await getWeather(city, day);
    if (!report) return { ok: false as const, error: "unknown_city" as const, city };
    return { ok: true as const, ...report, speak: report.summary };
  } catch (err) {
    return lookupFailed(err);
  }
}

// ---------------------------------------------------------------------------
// web_search
// ---------------------------------------------------------------------------

export async function searchTool(input: Base & { query: string }) {
  const q = (input.query || "").replace(/\s+/g, " ").trim();
  if (q.length < 2) return { ok: false as const, error: "empty_query" as const };
  const admitted = await admit("web_search", input, `${input.call_sid}:${sha(q.toLowerCase())}`, { query: q });
  if (!admitted.ok) return admitted;
  try {
    const result = await webSearch(q);
    if (!result.found) {
      return { ok: true as const, found: false, provider: result.provider, speak: "I could not find a clear answer to that." };
    }
    return {
      ok: true as const,
      found: true,
      answer: result.answer,
      sources: result.sources.map((s) => s.title),
      provider: result.provider,
      speak: result.answer,
    };
  } catch (err) {
    return lookupFailed(err);
  }
}

// ---------------------------------------------------------------------------
// get_news
// ---------------------------------------------------------------------------

export async function newsTool(input: Base & { topic?: string }) {
  const topic: NewsTopic = NEWS_TOPICS.includes(input.topic as NewsTopic) ? (input.topic as NewsTopic) : "top";
  const parent = await parentRow(input.parent_id);
  const lang = (parent?.languages || "hi").split(",")[0]?.trim() === "en" ? "en" : "hi";
  const admitted = await admit("get_news", input, `${input.call_sid}:${topic}`, { topic });
  if (!admitted.ok) return admitted;
  try {
    const news = await headlines(topic, lang, 5);
    if (!news.headlines.length) return { ok: true as const, found: false, topic, speak: "I could not get the news right now." };
    return {
      ok: true as const,
      found: true,
      topic,
      headlines: news.headlines.map((h) => h.title),
      provider: news.provider,
      speak: `Top ${topic === "top" ? "" : `${topic} `}news: ${news.headlines.slice(0, 3).map((h) => h.title).join(". ")}.`,
    };
  } catch (err) {
    return lookupFailed(err);
  }
}

// ---------------------------------------------------------------------------
// get_date_time
// ---------------------------------------------------------------------------

const WEEKDAY_HI = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];

export function istClock(now = new Date()) {
  const zone = "Asia/Kolkata";
  const weekday = new Intl.DateTimeFormat("en-IN", { timeZone: zone, weekday: "long" }).format(now);
  const date = new Intl.DateTimeFormat("en-IN", { timeZone: zone, day: "numeric", month: "long", year: "numeric" }).format(now);
  const time = new Intl.DateTimeFormat("en-IN", { timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true })
    .format(now)
    .replace(/\s?(am|pm)$/i, (m) => ` ${m.trim().toUpperCase()}`);
  const dayIndex = new Date(now.toLocaleString("en-US", { timeZone: zone })).getDay();
  return { weekday, weekday_hi: WEEKDAY_HI[dayIndex]!, date, time, day_key: istDayKey(now) };
}

export async function dateTimeTool(input: Base, now = new Date()) {
  const admitted = await admit("get_date_time", input, `${input.call_sid}:${now.getTime()}`, {});
  if (!admitted.ok) return admitted;
  const clock = istClock(now);
  return { ok: true as const, ...clock, speak: `It is ${clock.time} on ${clock.weekday}, ${clock.date}.` };
}

// ---------------------------------------------------------------------------
// get_medicine_schedule
// ---------------------------------------------------------------------------

/**
 * Never phrased as "take it now": a dose missed earlier is only reported as not marked,
 * so the agent never nudges a late or double dose (system prompt, medicine rules).
 */
export async function medicineScheduleTool(input: Base, nowMinutes = minutesNowIst()) {
  const admitted = await admit("get_medicine_schedule", input, `${input.call_sid}:${Date.now()}`, {});
  if (!admitted.ok) return admitted;
  const meds = await medicinesWithTimes(input.parent_id);
  const logged = await query<{ medicine_id: string; status: string }>(
    `select medicine_id, status from dose_logs where parent_id = $1 and schedule_date = $2`,
    [input.parent_id, istDayKey()],
  );
  const statusOf = new Map(logged.map((row) => [row.medicine_id, row.status]));
  const items = meds.map((med) => ({
    name: med.name,
    time: med.time_local || "",
    with_meals: med.meal,
    status: (statusOf.get(med.id) as "taken" | "not_taken" | "not_sure" | undefined) ?? "not_asked_yet",
  }));
  if (!items.length) return { ok: true as const, medicines: [], speak: "There are no medicines on the list for today." };
  const open = items.filter((m) => m.status !== "taken");
  const later = open.filter((m) => m.time && parseHhMm(m.time) > nowMinutes);
  const earlier = open.filter((m) => !later.includes(m));
  const lines: string[] = [];
  if (later.length) lines.push(`Later today: ${later.map((m) => `${m.name} at ${m.time}`).join(", ")}.`);
  if (earlier.length) lines.push(`Not marked as taken yet from earlier: ${earlier.map((m) => m.name).join(", ")}.`);
  return {
    ok: true as const,
    medicines: items.map((m) => ({ ...m, due: later.includes(m) ? ("later_today" as const) : ("earlier" as const) })),
    speak: lines.length ? lines.join(" ") : "All of today's medicines are marked as taken.",
  };
}
