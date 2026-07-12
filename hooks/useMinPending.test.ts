import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMinPending } from "./useMinPending";

describe("useMinPending", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("holds a fast-finishing pending state for the minimum duration", () => {
    const { result, rerender } = renderHook(
      ({ pending }) => useMinPending(pending, 400),
      { initialProps: { pending: true } },
    );
    expect(result.current).toBe(true);

    act(() => void vi.advanceTimersByTime(50));
    rerender({ pending: false });
    expect(result.current).toBe(true); // still held

    act(() => void vi.advanceTimersByTime(360));
    expect(result.current).toBe(false);
  });

  it("releases on the next tick when pending outlives the minimum", () => {
    const { result, rerender } = renderHook(
      ({ pending }) => useMinPending(pending, 400),
      { initialProps: { pending: true } },
    );
    act(() => void vi.advanceTimersByTime(500));
    rerender({ pending: false });
    act(() => void vi.advanceTimersByTime(0));
    expect(result.current).toBe(false);
  });

  it("stays false when pending never starts", () => {
    const { result } = renderHook(() => useMinPending(false, 400));
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current).toBe(false);
  });
});
