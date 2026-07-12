import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// test globals are off (explicit imports), so Testing Library won't auto-clean
afterEach(cleanup);

// Node 25+ ships a global localStorage that shadows jsdom's and doesn't work
// without --localstorage-file; replace it with a tiny in-memory Storage so
// tests behave the same on every Node version.
class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

Object.defineProperty(window, "localStorage", {
  value: new MemoryStorage(),
  configurable: true,
});

// jsdom has no ResizeObserver; React Aria's Popover expects one
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver ??=
  NoopResizeObserver as unknown as typeof ResizeObserver;
