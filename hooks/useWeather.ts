"use client";

import { useEffect } from "react";
import useSWR, { mutate as globalMutate, useSWRConfig } from "swr";
import { cityKey } from "@/lib/cityKey";
import type { City, Weather } from "@/lib/types";

// The SWR key shape is owned here - anything matching or building weather
// keys goes through these, so the two sides can't drift apart.
const WEATHER_API_PATH = "/api/weather";

// The server caches each location for 10 minutes; the client mirrors that
// window for polling, focus throttling, and the re-add staleness check.
const TTL_MS = 600_000;

// Last fetchedAt seen per city, kept in a module map that survives removal so
// a later re-add can tell whether the shared server cache has gone stale.
const lastFetchedAt = new Map<string, number>();

function weatherKey(city: City): string {
  return `${WEATHER_API_PATH}?lat=${city.lat}&lon=${city.lon}`;
}

// true for any SWR key that weatherKey() produced; the string check matters -
// SWR keys can also be arrays/objects
function isWeatherKey(key: unknown): boolean {
  return typeof key === "string" && key.startsWith(WEATHER_API_PATH);
}

async function fetchWeather(url: string): Promise<Weather> {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // our API routes always answer errors as { error }
    throw new Error(body?.error ?? "Something went wrong");
  }
  return body as Weather;
}

/**
 * Live weather for one city. Each card calls this independently, so every
 * card has its own loading/error state and one failing city never takes the
 * dashboard down. SWR dedupes identical requests across cards.
 */
export function useWeather(city: City) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Weather>(
    weatherKey(city),
    fetchWeather,
    {
      // matches the server cache window - polling faster only re-reads the cache
      refreshInterval: TTL_MS,
      // don't refetch on focus if we revalidated within the window
      focusThrottleInterval: TTL_MS,
    },
  );

  // Keep lastFetchedAt current so a later re-add can judge staleness.
  const key = cityKey(city);
  useEffect(() => {
    if (data) lastFetchedAt.set(key, data.fetchedAt);
  }, [key, data]);

  return {
    weather: data,
    error,
    isLoading,
    isValidating,
    retry: () => void mutate(),
  };
}

/**
 * Drops a removed city's weather from this browser's SWR cache, so re-adding
 * it starts clean. Deliberately client-only: the server cache is shared
 * across all visitors (the rate-limit defence), so one user removing a city
 * must not expire it for everyone - the server entry ages out on its own.
 */
export function forgetWeather(city: City): void {
  void globalMutate(weatherKey(city), undefined, { revalidate: false });
}

/**
 * True when this city was fetched earlier and has since aged past the 10-min
 * window. Never-fetched cities read as not-stale - nothing to refresh yet.
 */
export function isWeatherStale(city: City): boolean {
  const at = lastFetchedAt.get(cityKey(city));
  return at !== undefined && Date.now() - at > TTL_MS;
}

/**
 * Force one city's next fetch upstream: expire just its cache tag, then
 * revalidate its key. A stale re-add would otherwise be served the old numbers
 * once more (stale-while-revalidate).
 */
export async function refreshCity(city: City): Promise<void> {
  await fetch(`${WEATHER_API_PATH}/refresh?lat=${city.lat}&lon=${city.lon}`, {
    method: "POST",
  });
  await globalMutate(weatherKey(city));
}

/**
 * Hard refresh for every city at once: expires the server's weather cache,
 * then revalidates every weather key - each refetch is then a true upstream
 * call. Lives beside the key shape it filters on.
 */
export function useRefreshAllWeather(): () => Promise<void> {
  const { mutate } = useSWRConfig();
  return async () => {
    await fetch(`${WEATHER_API_PATH}/refresh`, { method: "POST" });
    // SWR calls isWeatherKey once per cached key and refetches the matches
    await mutate(isWeatherKey);
  };
}
