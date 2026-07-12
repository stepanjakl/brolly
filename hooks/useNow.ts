"use client";

import { useSyncExternalStore } from "react";

// A shared 30-second clock. Rendering Date.now() directly would be impure and
// freeze the moment a card mounts - this keeps "updated X min ago" and each
// city's local clock ticking. One interval serves every subscriber.

let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(() => {
    now = Date.now();
    for (const notify of listeners) notify();
  }, 30_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** The current time in ms, refreshed every 30 seconds. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => now,
  );
}
