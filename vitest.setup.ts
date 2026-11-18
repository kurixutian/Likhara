// Browser-globals setup for Vitest on Termux:
//  - fake-indexeddb provides IndexedDB (jsdom has none)
//  - this jsdom build exposes no localStorage → minimal in-memory polyfill
import 'fake-indexeddb/auto';
import { beforeEach } from 'vitest';

// React 18 act() support (used directly from 'react' in component tests).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

if (typeof window.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => void store.delete(k),
    setItem: (k, v) => void store.set(k, String(v)),
  };
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
  });
}

beforeEach(async () => {
  window.localStorage.clear();
  await indexedDB.deleteDatabase('likhara_studio');
});
