import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "./storage";

type Fruit = { name: string };
const FALLBACK: Fruit[] = [];

describe("createStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips values through localStorage", () => {
    const store = createStore<Fruit[]>("test:fruits", FALLBACK);
    store.write([{ name: "plum" }]);
    expect(store.getSnapshot()).toEqual([{ name: "plum" }]);
    expect(window.localStorage.getItem("test:fruits")).toBe(
      '[{"name":"plum"}]',
    );
  });

  it("returns the fallback when nothing is stored", () => {
    const store = createStore<Fruit[]>("test:empty", FALLBACK);
    expect(store.getSnapshot()).toBe(FALLBACK);
  });

  it("degrades corrupt JSON to the fallback instead of throwing", () => {
    window.localStorage.setItem("test:corrupt", "{not json!");
    const store = createStore<Fruit[]>("test:corrupt", FALLBACK);
    expect(store.getSnapshot()).toBe(FALLBACK);
  });

  it("keeps snapshot identity stable across reads (useSyncExternalStore contract)", () => {
    const store = createStore<Fruit[]>("test:stable", FALLBACK);
    store.write([{ name: "pear" }]);
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("notifies subscribers on write and stops after unsubscribe", () => {
    const store = createStore<Fruit[]>("test:subs", FALLBACK);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.write([{ name: "fig" }]);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.write([]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reacts to storage events from other tabs", () => {
    const store = createStore<Fruit[]>("test:tabs", FALLBACK);
    const listener = vi.fn();
    store.subscribe(listener);

    // jsdom doesn't fire storage events across "tabs" - simulate the browser doing it.
    window.dispatchEvent(new StorageEvent("storage", { key: "test:tabs" }));
    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
