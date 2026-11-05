/**
 * Live check of the helper tools' outside services (no stubs, real network):
 * Open-Meteo weather, web search (Tavily if TAVILY_API_KEY is set, else DuckDuckGo/Wikipedia),
 * and news (Tavily or Google News RSS). Unit tests stub these; this proves the real
 * responses still parse. Run: npm run assist:smoke
 */
import { headlines, tavilyKey, webSearch } from "../../src/lib/assist/search";
import { getWeather } from "../../src/lib/assist/weather";

type Check = { name: string; run: () => Promise<string> };

const checks: Check[] = [
  {
    name: "weather: Delhi today",
    run: async () => {
      const w = await getWeather("Delhi", "today");
      if (!w || w.high_c == null) throw new Error("no forecast");
      return w.summary;
    },
  },
  {
    name: "weather: Varanasi tomorrow",
    run: async () => {
      const w = await getWeather("Varanasi", "tomorrow");
      if (!w || w.high_c == null) throw new Error("no forecast");
      return w.summary;
    },
  },
  {
    name: `search (${tavilyKey() ? "tavily" : "free"}): who is Sachin Tendulkar`,
    run: async () => {
      const r = await webSearch("Sachin Tendulkar");
      if (!r.found) throw new Error("nothing found");
      return `[${r.provider}] ${r.answer}`;
    },
  },
  {
    name: `search (${tavilyKey() ? "tavily" : "free"}): Diwali`,
    run: async () => {
      const r = await webSearch("Diwali festival");
      if (!r.found) throw new Error("nothing found");
      return `[${r.provider}] ${r.answer}`;
    },
  },
  {
    name: "news: top, Hindi",
    run: async () => {
      const n = await headlines("top", "hi", 3);
      if (!n.headlines.length) throw new Error("no headlines");
      return `[${n.provider}] ${n.headlines.map((h) => h.title).join(" | ")}`;
    },
  },
  {
    name: "news: sports, English",
    run: async () => {
      const n = await headlines("sports", "en", 3);
      if (!n.headlines.length) throw new Error("no headlines");
      return `[${n.provider}] ${n.headlines.map((h) => h.title).join(" | ")}`;
    },
  },
];

async function main() {
  let failed = 0;
  for (const check of checks) {
    const started = Date.now();
    try {
      const out = await check.run();
      console.log(`PASS ${check.name} (${Date.now() - started} ms)\n     ${out}`);
    } catch (err) {
      failed++;
      console.log(`FAIL ${check.name} (${Date.now() - started} ms): ${(err as Error).message}`);
    }
  }
  if (failed) process.exit(1);
}

main();
