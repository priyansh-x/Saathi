/**
 * Weather from Open-Meteo: free, no API key, worldwide.
 * https://open-meteo.com/en/docs and https://open-meteo.com/en/docs/geocoding-api
 */
import { clip, fetchJson, TtlCache } from "@/lib/assist/fetch";

export const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
export const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

type GeoResult = { name: string; latitude: number; longitude: number; admin1?: string; country_code?: string };

type Forecast = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    uv_index_max?: number[];
  };
};

export type WeatherDay = "today" | "tomorrow";

export type WeatherReport = {
  place: string;
  day: WeatherDay;
  date: string;
  sky: string;
  now_c: number | null;
  feels_like_c: number | null;
  humidity_pct: number | null;
  high_c: number | null;
  low_c: number | null;
  rain_chance_pct: number | null;
  advice: string[];
  summary: string;
};

/** WMO weather interpretation codes, in plain words. */
export function skyWords(code: number | undefined) {
  if (code == null) return "unknown";
  if (code === 0) return "clear sky";
  if (code <= 2) return "partly cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "foggy";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain showers";
  if (code >= 85 && code <= 86) return "snow showers";
  if (code >= 95) return "thunderstorm";
  return "unsettled";
}

/** Practical, non-medical advice an elder can act on. */
export function weatherAdvice(args: { high: number | null; low: number | null; rain: number | null; code?: number; uv?: number | null }) {
  const out: string[] = [];
  if (args.rain != null && args.rain >= 50) out.push("carry an umbrella");
  if (args.code != null && args.code >= 95) out.push("stay indoors during the storm");
  if (args.high != null && args.high >= 38) out.push("very hot: drink water and avoid going out at midday");
  else if (args.high != null && args.high >= 34) out.push("hot: drink plenty of water");
  if (args.low != null && args.low <= 10) out.push("cold: wear something warm, especially in the morning");
  if (args.code === 45 || args.code === 48) out.push("foggy: walk carefully");
  if (args.uv != null && args.uv >= 8) out.push("strong sun: wear a cap or use an umbrella outside");
  return out;
}

const round = (n: number | undefined | null) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null);

const geoCache = new TtlCache<GeoResult | null>(24 * 60 * 60 * 1000);
const forecastCache = new TtlCache<Forecast>(20 * 60 * 1000);

export function clearWeatherCache() {
  geoCache.clear();
  forecastCache.clear();
}

export async function geocodeCity(city: string): Promise<GeoResult | null> {
  const key = city.trim().toLowerCase();
  const cached = geoCache.get(key);
  if (cached !== undefined) return cached;
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(city.trim())}&count=5&language=en&format=json`;
  const data = await fetchJson<{ results?: GeoResult[] }>(url);
  const rows = data.results ?? [];
  // Families are in India; prefer an Indian match over a same-named town abroad.
  const hit = rows.find((row) => row.country_code === "IN") ?? rows[0] ?? null;
  geoCache.set(key, hit);
  return hit;
}

export async function getWeather(city: string, day: WeatherDay = "today"): Promise<WeatherReport | null> {
  const place = await geocodeCity(city);
  if (!place) return null;
  const key = `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;
  let forecast = forecastCache.get(key);
  if (!forecast) {
    const url =
      `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max" +
      "&timezone=Asia%2FKolkata&forecast_days=2";
    forecast = await fetchJson<Forecast>(url);
    forecastCache.set(key, forecast);
  }
  const i = day === "tomorrow" ? 1 : 0;
  const d = forecast.daily ?? {};
  const code = d.weather_code?.[i] ?? (i === 0 ? forecast.current?.weather_code : undefined);
  const high = round(d.temperature_2m_max?.[i]);
  const low = round(d.temperature_2m_min?.[i]);
  const rain = round(d.precipitation_probability_max?.[i]);
  const uv = d.uv_index_max?.[i] ?? null;
  const now = i === 0 ? round(forecast.current?.temperature_2m) : null;
  const feels = i === 0 ? round(forecast.current?.apparent_temperature) : null;
  const humidity = i === 0 ? round(forecast.current?.relative_humidity_2m) : null;
  const sky = skyWords(code);
  const advice = weatherAdvice({ high, low, rain, code, uv });
  const parts = [
    `${day === "tomorrow" ? "Tomorrow" : "Today"} in ${place.name}: ${sky}`,
    now != null ? `${now}°C now` : null,
    high != null && low != null ? `high ${high}°C, low ${low}°C` : null,
    rain != null ? `${rain}% chance of rain` : null,
  ].filter(Boolean);
  const summary = clip(`${parts.join(", ")}.${advice.length ? ` Tip: ${advice.join("; ")}.` : ""}`, 280);
  return {
    place: place.admin1 && place.admin1 !== place.name ? `${place.name}, ${place.admin1}` : place.name,
    day,
    date: d.time?.[i] ?? "",
    sky,
    now_c: now,
    feels_like_c: feels,
    humidity_pct: humidity,
    high_c: high,
    low_c: low,
    rain_chance_pct: rain,
    advice,
    summary,
  };
}
