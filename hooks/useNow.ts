"use client";

import { useSyncExternalStore } from "react";

// A shared 30-second clock. Rendering Date.now() directly would be impure and
// freeze the moment a card mounts - this keeps "updated X min ago" and each
// city's local clock ticking. One interval serves every subscriber.

let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function tick() {
  now = Date.now();
  for (const notify of listeners) notify();
}

// Inactive tabs and sleep throttle setInterval, so the clock drifts behind and
// "X min ago" under-reports until the next tick. Snap it back when the page is
// active again; the 30s tick is the backstop for wake events that fire neither.
function resync() {
  if (document.visibilityState === "visible") tick();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    // The clock froze when the last card unmounted; reset so a re-add doesn't
    // render a stale age (useSyncExternalStore re-reads before paint).
    now = Date.now();
    timer = setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
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
