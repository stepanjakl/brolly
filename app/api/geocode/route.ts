import type { NextRequest } from "next/server";
import { cityKey } from "@/lib/cityKey";
import { jsonError, OPENWEATHER_HOST } from "@/lib/openweather";
import type { City } from "@/lib/types";

// Proxies OpenWeather's geocoding endpoint for the city search. Same rationale
// as /api/weather: the key stays server-side, and since cities don't move,
// results cache for a full day.

const UPSTREAM = `${OPENWEATHER_HOST}/geo/1.0/direct`;

type OpenWeatherPlace = {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return jsonError("q must be at least 2 characters", 400);
  }

  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    return jsonError("Weather service is not configured", 500);
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${UPSTREAM}?q=${encodeURIComponent(q)}&limit=5&appid=${key}`,
      {
        next: { revalidate: 86400 },
      },
    );
  } catch {
    return jsonError("City search is unreachable", 502);
  }

  if (!upstream.ok) {
    return jsonError("City search is unavailable", 502);
  }

  const places = (await upstream.json()) as OpenWeatherPlace[];
  // OpenWeather often returns the same place twice from different sources;
  // duplicates would collide as React keys downstream
  const seen = new Set<string>();
  const results: City[] = [];
  for (const { name, country, state, lat, lon } of places) {
    const city: City = { name, country, ...(state ? { state } : {}), lat, lon };
    const placeKey = cityKey(city);
    if (seen.has(placeKey)) continue;
    seen.add(placeKey);
    results.push(city);
  }

  return Response.json(results);
}
