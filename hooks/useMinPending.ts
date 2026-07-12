"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Debounces the END of a pending state: once `pending` turns true, the result
 * stays true for at least `minMs` even if the work finishes sooner. Fast
 * responses otherwise flick skeletons/spinners for a single frame. The start
 * is not delayed - the rising edge is latched during render.
 */
export function useMinPending(pending: boolean, minMs = 400): boolean {
  const [held, setHeld] = useState(pending);
  const startedAt = useRef<number | null>(null);

  // derive-state-from-props pattern: held is true in the same render
  const [prevPending, setPrevPending] = useState(pending);
  if (pending !== prevPending) {
    setPrevPending(pending);
    if (pending) setHeld(true);
  }

  // falling edge releases via a timer for whatever remains of the minimum
  useEffect(() => {
    if (pending) {
      startedAt.current = Date.now();
      return;
    }
    if (startedAt.current === null) return; // never went pending
    const remaining = startedAt.current + minMs - Date.now();
    startedAt.current = null;
    const timer = setTimeout(() => setHeld(false), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [pending, minMs]);

  return held;
}
