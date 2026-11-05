/**
 * Web search and news for the voice agent.
 *
 * With TAVILY_API_KEY (free tier, no card): Tavily, built for agents, returns a short answer.
 * Without a key it still works, for free: DuckDuckGo Instant Answers, then a Wikipedia
 * summary for search; Google News RSS for headlines.
 */
import { clip, fetchJson, fetchWithTimeout, TtlCache } from "@/lib/assist/fetch";

export const TAVILY_URL = "https://api.tavily.com/search";
export const DDG_URL = "https://api.duckduckgo.com/";
export const WIKI_SEARCH_URL = "https://en.wikipedia.org/w/api.php";
export const WIKI_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";
export const GNEWS_URL = "https://news.google.com/rss";

export type SearchProvider = "tavily" | "duckduckgo" | "wikipedia" | "google_news";

export type SearchAnswer = {
  found: boolean;
  answer: string;
  sources: { title: string; url: string }[];
  provider: SearchProvider | "none";
};

export type NewsTopic = "top" | "india" | "world" | "business" | "sports" | "technology" | "entertainment" | "health";

export const NEWS_TOPICS: NewsTopic[] = ["top", "india", "world", "business", "sports", "technology", "entertainment", "health"];

export type Headlines = {
  topic: NewsTopic;
  headlines: { title: string; source: string }[];
  provider: SearchProvider | "none";
};

const ANSWER_MAX = 320;

export function tavilyKey() {
  return (process.env.TAVILY_API_KEY || "").trim();
}

const searchCache = new TtlCache<SearchAnswer>(30 * 60 * 1000);
const newsCache = new TtlCache<Headlines>(15 * 60 * 1000);

export function clearSearchCache() {
  searchCache.clear();
  newsCache.clear();
}

type TavilyResponse = {
  answer?: string | null;
  results?: { title?: string; url?: string; content?: string; source?: string }[];
};

async function tavily(query: string, topic: "general" | "news", maxResults: number) {
  return fetchJson<TavilyResponse>(TAVILY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${tavilyKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      topic,
      search_depth: "basic",
      include_answer: topic === "general",
      max_results: maxResults,
      ...(topic === "news" ? { time_range: "day" } : { country: "india" }),
    }),
  });
}

async function duckDuckGo(query: string): Promise<SearchAnswer | null> {
  const url = `${DDG_URL}?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=saathi`;
  const data = await fetchJson<{ Answer?: string; AbstractText?: string; AbstractSource?: string; AbstractURL?: string; Heading?: string }>(url);
  const text = (data.Answer || data.AbstractText || "").trim();
  if (!text) return null;
  return {
    found: true,
    answer: clip(text, ANSWER_MAX),
    sources: data.AbstractURL ? [{ title: data.AbstractSource || data.Heading || "DuckDuckGo", url: data.AbstractURL }] : [],
    provider: "duckduckgo",
  };
}

async function wikipedia(query: string): Promise<SearchAnswer | null> {
  const searchUrl = `${WIKI_SEARCH_URL}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`;
  const hits = await fetchJson<{ query?: { search?: { title: string }[] } }>(searchUrl);
  const title = hits.query?.search?.[0]?.title;
  if (!title) return null;
  const summary = await fetchJson<{ extract?: string; content_urls?: { desktop?: { page?: string } } }>(
    `${WIKI_SUMMARY_URL}${encodeURIComponent(title.replace(/ /g, "_"))}`,
  );
  const text = (summary.extract || "").trim();
  if (!text) return null;
  return {
    found: true,
    answer: clip(text, ANSWER_MAX),
    sources: [{ title: `Wikipedia: ${title}`, url: summary.content_urls?.desktop?.page || "" }],
    provider: "wikipedia",
  };
}

export async function webSearch(rawQuery: string): Promise<SearchAnswer> {
  const query = rawQuery.replace(/\s+/g, " ").trim().slice(0, 200);
  const key = query.toLowerCase();
  const cached = searchCache.get(key);
  if (cached) return cached;

  let result: SearchAnswer | null = null;
  if (tavilyKey()) {
    const data = await tavily(query, "general", 3);
    const sources = (data.results ?? [])
      .filter((row) => row.url)
      .slice(0, 3)
      .map((row) => ({ title: row.title || row.url!, url: row.url! }));
    const text = (data.answer || data.results?.[0]?.content || "").trim();
    result = text ? { found: true, answer: clip(text, ANSWER_MAX), sources, provider: "tavily" } : null;
  } else {
    // Free path. Each source is optional: a failure in one falls through to the next.
    result = await duckDuckGo(query).catch(() => null);
    if (!result) result = await wikipedia(query).catch(() => null);
  }
  const final = result ?? { found: false, answer: "", sources: [], provider: "none" as const };
  if (final.found) searchCache.set(key, final);
  return final;
}

const GNEWS_TOPIC: Partial<Record<NewsTopic, string>> = {
  world: "WORLD",
  india: "NATION",
  business: "BUSINESS",
  sports: "SPORTS",
  technology: "TECHNOLOGY",
  entertainment: "ENTERTAINMENT",
  health: "HEALTH",
};

function decodeXml(text: string) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

/** Google News RSS titles end in " - Publisher". */
export function parseNewsRss(xml: string, limit = 5) {
  const out: { title: string; source: string }[] = [];
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const item of items) {
    const rawTitle = decodeXml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const source = decodeXml(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? "");
    if (!rawTitle) continue;
    const title = source && rawTitle.endsWith(` - ${source}`) ? rawTitle.slice(0, -(source.length + 3)) : rawTitle;
    out.push({ title: clip(title, 160), source });
    if (out.length >= limit) break;
  }
  return out;
}

export function newsRssUrl(topic: NewsTopic, lang: "en" | "hi") {
  const locale = lang === "hi" ? "hl=hi&gl=IN&ceid=IN:hi" : "hl=en-IN&gl=IN&ceid=IN:en";
  const section = GNEWS_TOPIC[topic];
  return section ? `${GNEWS_URL}/headlines/section/topic/${section}?${locale}` : `${GNEWS_URL}?${locale}`;
}

export async function headlines(topic: NewsTopic = "top", lang: "en" | "hi" = "en", limit = 5): Promise<Headlines> {
  const key = `${topic}:${lang}`;
  const cached = newsCache.get(key);
  if (cached) return cached;
  let result: Headlines;
  if (tavilyKey()) {
    const query = topic === "top" || topic === "india" ? "top news in India today" : `${topic} news India today`;
    const data = await tavily(query, "news", limit);
    result = {
      topic,
      headlines: (data.results ?? []).slice(0, limit).map((row) => ({
        title: clip(row.title || "", 160),
        source: row.source || (row.url ? new URL(row.url).hostname.replace(/^www\./, "") : ""),
      })),
      provider: "tavily",
    };
  } else {
    const res = await fetchWithTimeout(newsRssUrl(topic, lang));
    result = { topic, headlines: parseNewsRss(await res.text(), limit), provider: "google_news" };
  }
  if (result.headlines.length) newsCache.set(key, result);
  return result;
}
