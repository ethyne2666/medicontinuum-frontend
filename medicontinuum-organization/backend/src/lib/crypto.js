import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { config } from '../config.js';

const normalize = (v) => String(v).trim().toUpperCase().replace(/[\s-]/g, '');

/** Keyed hash so licence / government IDs can be de-duplicated without being stored in clear. */
export const fingerprint = (kind, value) =>
  createHmac('sha256', config.idPepper).update(`${kind}:${normalize(value)}`).digest('hex');

export const maskTail = (value, keep = 4) => {
  const v = normalize(value);
  return `${'X'.repeat(Math.max(0, v.length - keep))}${v.slice(-keep)}`;
};

export const newPublicId = () => `MC-${randomBytes(5).toString('hex').toUpperCase()}`;

// ---- 16-digit organization number (15 random digits + Luhn check digit) ----
export function luhnCheckDigit(payload) {
  let sum = 0;
  let double = true;
  for (let i = payload.length - 1; i >= 0; i -= 1) {
    let d = Number(payload[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidOrgNumber(n) {
  return /^\d{16}$/.test(n) && luhnCheckDigit(n.slice(0, 15)) === Number(n[15]);
}

export function generateOrgNumber(isTaken) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let payload = String(randomInt(1, 10)); // never starts with 0
    for (let i = 0; i < 14; i += 1) payload += String(randomInt(0, 10));
    const candidate = payload + luhnCheckDigit(payload);
    if (!isTaken(candidate)) return candidate;
  }
  throw new Error('Could not generate a unique organization number');
}

export const formatOrgNumber = (n) => n.replace(/(\d{4})(?=\d)/g, '$1 ');
export const maskOrgNumber = (n) => `•••• •••• •••• ${n.slice(-4)}`;
