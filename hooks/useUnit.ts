"use client";

import { useSyncExternalStore } from "react";
import { UNIT_KEY, createStore } from "@/lib/storage";
import type { Unit } from "@/lib/units";

const store = createStore<Unit>(UNIT_KEY, "c");

/** The persisted °C/°F preference (defaults to °C). */
export function useUnit(): Unit {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}

export function setUnit(unit: Unit) {
  store.write(unit);
}
