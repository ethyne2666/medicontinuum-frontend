// Browser + Node 20+ compatible helpers (Web Crypto). Demo-grade: frontend-only apps cannot offer real credential security.
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export const sha256 = async (text) => hex(await globalThis.crypto.subtle.digest('SHA-256', enc.encode(text)));
export const normalize = (v) => String(v).trim().toUpperCase().replace(/[\s-]/g, '');

/** One-way fingerprint so licence / government IDs can be de-duplicated without storing them readable. */
export const fingerprint = (kind, value) => sha256(`mc1:${kind}:${normalize(value)}`);
/** Salted by the organization number so identical passwords never produce identical hashes. */
export const hashPassword = (orgNumber, password) => sha256(`mc1:pw:${orgNumber}:${password}`);

export const maskTail = (value, keep = 4) => {
  const v = normalize(value);
  return `${'X'.repeat(Math.max(0, v.length - keep))}${v.slice(-keep)}`;
};

const randInt = (min, max) => {
  const range = max - min;
  const limit = Math.floor(0x100000000 / range) * range; // rejection sampling → no modulo bias
  const a = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(a); } while (a[0] >= limit);
  return min + (a[0] % range);
};

export const newId = () => globalThis.crypto.randomUUID();
export const newPublicId = () => `MC-${[...globalThis.crypto.getRandomValues(new Uint8Array(5))].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

// ---- 16-digit organization number = 15 digits + Luhn check digit (typos are caught) ----
export function luhnCheckDigit(payload) {
  let sum = 0;
  let double = true;
  for (let i = payload.length - 1; i >= 0; i -= 1) {
    let d = Number(payload[i]);
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    double = !double;
  }
  return (10 - (sum % 10)) % 10;
}
export const isValidOrgNumber = (n) => /^\d{16}$/.test(n) && luhnCheckDigit(n.slice(0, 15)) === Number(n[15]);
export const withCheckDigit = (payload15) => payload15 + luhnCheckDigit(payload15);

export function generateOrgNumber(isTaken) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let payload = String(randInt(1, 10)); // never starts with 0
    for (let i = 0; i < 14; i += 1) payload += String(randInt(0, 10));
    const candidate = withCheckDigit(payload);
    if (!isTaken(candidate)) return candidate;
  }
  throw new Error('Could not generate a unique organization number');
}

export const formatOrgNumber = (n) => String(n).replace(/(\d{4})(?=\d)/g, '$1 ');
export const maskOrgNumber = (n) => `•••• •••• •••• ${String(n).slice(-4)}`;
