import type { NextRequest } from "next/server";
import {
  jsonError,
  OPENWEATHER_HOST,
  WEATHER_TAG,
  weatherTag,
} from "@/lib/openweather";
import type { Weather } from "@/lib/types";

// Proxies OpenWeather's current-weather endpoint. Two reasons to proxy:
// the API key stays on the server, and responses cache for 10 minutes in
// Next's data cache shared across ALL visitors - the free tier's rate-limit
// defence.

const UPSTREAM = `${OPENWEATHER_HOST}/data/2.5/weather`;

// the slice of the response we actually read
type OpenWeatherCurrent = {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{ id: number; description: string; icon: string }>;
  wind?: { speed: number };
  sys: { sunrise: number; sunset: number };
  timezone: number;
};

// Missing params must fail loudly: Number(null) is 0, which would silently
// fetch weather for the Gulf of Guinea (0,0).
function parseCoords(
  request: NextRequest,
): { lat: number; lon: number } | null {
  const latRaw = request.nextUrl.searchParams.get("lat");
  const lonRaw = request.nextUrl.searchParams.get("lon");
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (
    !latRaw ||
    !lonRaw ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return null;
  }
  return { lat, lon };
}

export async function GET(request: NextRequest) {
  const coords = parseCoords(request);
  if (!coords) {
    return jsonError("Valid lat and lon query params are required", 400);
  }
  const { lat, lon } = coords;

  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    return jsonError("Weather service is not configured", 500);
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${UPSTREAM}?lat=${lat}&lon=${lon}&units=metric&appid=${key}`,
      {
        // one upstream call per location per 10 min, app-wide. The per-city
        // tag lets a single stale city be refreshed without expiring the rest.
        next: { revalidate: 600, tags: [WEATHER_TAG, weatherTag(lat, lon)] },
      },
    );
  } catch {
    return jsonError("Weather service is unreachable", 502);
  }

  if (!upstream.ok) {
    // never forward upstream error bodies - they can leak key/account details
    return upstream.status === 404
      ? jsonError("No weather data for this location", 404)
      : jsonError("Weather service is unavailable", 502);
  }

  const data = (await upstream.json()) as OpenWeatherCurrent;
  const conditions = data.weather?.[0];

  // The upstream Date header survives the cache, so cached responses report
  // when the data was truly fetched (Date.now() here would lie - route code
  // runs per request).
  const fetchedAt = new Date(
    upstream.headers.get("date") ?? Date.now(),
  ).getTime();

  const weather: Weather = {
    tempC: data.main.temp,
    feelsLikeC: data.main.feels_like,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windMs: data.wind?.speed ?? 0,
    conditionId: conditions?.id ?? 800,
    description: conditions?.description ?? "unknown",
    isDay: (conditions?.icon ?? "d").endsWith("d"),
    timezoneOffset: data.timezone,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    fetchedAt,
  };

  return Response.json(weather);
}
