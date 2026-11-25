import { REGISTRY_KEY } from './constants.js';
import { maskOrgNumber } from './crypto.js';

export const emptyDb = () => ({ rev: 0, entities: [], shares: [] });

export const activeEntities = (db) => (db?.entities ?? []).filter((e) => e.status === 'ACTIVE');

const publicFields = (e) => ({
  publicId: e.publicId, kind: e.kind, orgType: e.orgType, name: e.name,
  specialization: e.specialization, city: e.city, state: e.state, country: e.country,
});

/** What ANYONE (the patient site) may see. Never the full number, email, licence, government ID or hash. */
export const publicView = (e) => ({
  ...publicFields(e),
  phone: e.kind === 'ORGANIZATION' ? e.phone : null,
  address: e.kind === 'ORGANIZATION' ? e.address : null,
  numberHint: maskOrgNumber(e.orgNumber),
  doctors: (e.doctors ?? []).map(({ id, name, specialization }) => ({ id, name, specialization })),
  sample: Boolean(e.sample),
  registeredAt: e.activatedAt,
});

/** Logged-in peers (the portal directory). Contact details are only released on an accepted share. */
export const peerView = publicFields;

/** Read the registry straight from this origin's localStorage (used by the patient site). */
export function readLocalRegistry(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(REGISTRY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
