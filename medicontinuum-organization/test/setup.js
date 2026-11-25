// Minimal browser shims. No `document` → the hub is skipped and the portal runs in local-only mode.
class MemoryStorage {
  #m = new Map();
  getItem(k) { return this.#m.has(k) ? this.#m.get(k) : null; }
  setItem(k, v) { this.#m.set(k, String(v)); }
  removeItem(k) { this.#m.delete(k); }
  clear() { this.#m.clear(); }
}
globalThis.localStorage = new MemoryStorage();
globalThis.window = { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} };
