/** Locks a key after `max` failures for `lockMs`. In-memory: fine for one process. */
export class FailureLimiter {
  constructor({ max = 5, lockMs = 15 * 60 * 1000 } = {}) {
    this.max = max;
    this.lockMs = lockMs;
    this.map = new Map();
  }
  retryAfterMs(key) {
    const rec = this.map.get(key);
    if (!rec?.lockedUntil) return 0;
    const left = rec.lockedUntil - Date.now();
    if (left <= 0) { this.map.delete(key); return 0; }
    return left;
  }
  fail(key) {
    const rec = this.map.get(key) ?? { count: 0, lockedUntil: 0 };
    rec.count += 1;
    if (rec.count >= this.max) rec.lockedUntil = Date.now() + this.lockMs;
    this.map.set(key, rec);
  }
  reset(key) { this.map.delete(key); }
}
