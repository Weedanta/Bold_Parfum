/**
 * Pembungkus localStorage / sessionStorage untuk useSyncExternalStore.
 *
 * Membaca storage di dalam useEffect lalu setState memicu render berjenjang dan
 * membuat nilai awal tidak pernah benar pada render pertama. Storage sebenarnya
 * adalah external store, dan React punya kait khusus untuk itu, termasuk
 * menangani hidrasi lewat snapshot server.
 *
 * getSnapshot wajib mengembalikan nilai yang stabil secara referensi, jadi hasil
 * parse di-cache dan hanya dihitung ulang saat string mentahnya berubah.
 */

type Listener = () => void;

export type BrowserStore<T> = {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (next: T) => void;
  clear: () => void;
};

export function createBrowserStore<T>(options: {
  key: string;
  area: "local" | "session";
  parse: (raw: string | null) => T;
  empty: T;
}): BrowserStore<T> {
  const { key, area, parse, empty } = options;

  let cache: T = empty;
  let cachedRaw: string | null | undefined;
  const listeners = new Set<Listener>();
  let watching = false;

  function storage() {
    return area === "local" ? window.localStorage : window.sessionStorage;
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== key) return;
    cachedRaw = undefined;
    emit();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      // Satu listener window saja, dipasang saat pelanggan pertama masuk.
      if (!watching) {
        window.addEventListener("storage", onStorage);
        watching = true;
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && watching) {
          window.removeEventListener("storage", onStorage);
          watching = false;
        }
      };
    },

    getSnapshot() {
      const raw = storage().getItem(key);
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cache = parse(raw);
      }
      return cache;
    },

    getServerSnapshot() {
      return empty;
    },

    set(next) {
      const raw = JSON.stringify(next);
      storage().setItem(key, raw);
      cachedRaw = raw;
      cache = next;
      emit();
    },

    clear() {
      storage().removeItem(key);
      cachedRaw = null;
      cache = empty;
      emit();
    },
  };
}
