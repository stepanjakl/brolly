"use client";

import { useSyncExternalStore } from "react";
import { cityKey } from "@/lib/cityKey";
import { CITIES_KEY, createStore } from "@/lib/storage";
import type { City } from "@/lib/types";

// one store for the whole app; the server never touches it
const store = createStore<City[]>(CITIES_KEY, []);

/** The user's cities, live-updated across components and browser tabs. */
export function useCities(): City[] {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}

// actions close over the store, not render state - stable without useCallback

export function addCity(city: City) {
  const current = store.getSnapshot();
  if (current.some((existing) => cityKey(existing) === cityKey(city))) return;
  store.write([...current, city]);
}

export function removeCity(city: City) {
  store.write(
    store
      .getSnapshot()
      .filter((existing) => cityKey(existing) !== cityKey(city)),
  );
}
