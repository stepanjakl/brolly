// A tiny localStorage store shaped for useSyncExternalStore. Two gotchas make
// it non-trivial: getSnapshot must return the SAME reference until the data
// changes (or React loops), so parses are cached on the raw string; and the
// "storage" event only fires in OTHER tabs, so same-tab writes notify local
// subscribers directly.

type Listener = () => void;

export type Store<T> = {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  write: (value: T) => void;
};

export function createStore<T>(key: string, fallback: T): Store<T> {
  let cached: T = fallback;
  let cachedRaw: string | null = null;
  const listeners = new Set<Listener>();

  function emit() {
    for (const listener of listeners) listener();
  }

  function getSnapshot(): T {
    const raw = window.localStorage.getItem(key);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    try {
      cached = raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      cached = fallback; // corrupt data degrades to the default, never crashes
    }
    return cached;
  }

  function write(value: T) {
    window.localStorage.setItem(key, JSON.stringify(value));
    emit();
  }

  function subscribe(listener: Listener) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) emit();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    subscribe,
    getSnapshot,
    // no localStorage on the server - render the default, hydrate real data after
    getServerSnapshot: () => fallback,
    write,
  };
}

// versioned keys: if the stored shape changes, bump v1 and old data is ignored
export const CITIES_KEY = "brolly:v1:cities";
export const UNIT_KEY = "brolly:v1:unit";
