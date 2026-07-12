"use client";

import useSWR from "swr";
import type { City, Weather } from "@/lib/types";

function weatherKey(city: City): string {
  return `/api/weather?lat=${city.lat}&lon=${city.lon}`;
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
      refreshInterval: 600_000,
    },
  );

  return {
    weather: data,
    error,
    isLoading,
    isValidating,
    retry: () => void mutate(),
  };
}
