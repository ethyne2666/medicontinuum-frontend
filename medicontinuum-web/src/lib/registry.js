// Patient-site side of the shared registry. Reads the data the Organization portal writes through /hub.html
// (same origin → plain localStorage). No network, no backend.
import { REGISTRY_KEY } from '@shared/constants.js';
import { activeEntities, publicView, readLocalRegistry } from '@shared/registry.js';
import { buildSeed } from '@shared/seed.js';

let seeding = null;

/** First run: write the sample Kalyani registry (organizations, doctors, shares) so the page isn't empty. */
export function ensureSeeded() {
  if (readLocalRegistry()) return Promise.resolve();
  seeding ??= buildSeed().then((seed) => {
    // re-check: the portal (via the hub) may have written while we were hashing
    if (!readLocalRegistry()) {
      try { localStorage.setItem(REGISTRY_KEY, JSON.stringify(seed)); } catch { /* ignore */ }
    }
  }).finally(() => { seeding = null; });
  return seeding;
}

export async function listPublicOrganisations() {
  await ensureSeeded();
  const db = readLocalRegistry();
  if (!db) throw new Error('Could not read the organisation registry from this browser.');
  const items = activeEntities(db).map(publicView).sort((a, b) => a.name.localeCompare(b.name));
  return { items, total: items.length, asOf: new Date().toISOString(), rev: db.rev };
}

/** Fires immediately when the portal (in another tab) changes the registry. */
export function onRegistryChange(fn) {
  const handler = (e) => { if (e.key === REGISTRY_KEY || e.key === null) fn(); };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
