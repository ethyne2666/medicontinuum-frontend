// A tiny "database" over the shared registry: read → mutate → compare-and-set, with a local fallback copy.
import { REGISTRY_KEY } from '@shared/constants.js';
import { emptyDb } from '@shared/registry.js';
import { buildSeed } from '@shared/seed.js';
import { hubGet, hubSet } from './hub.js';

const LOCAL_KEY = `${REGISTRY_KEY}.local`;
const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

function readLocal() {
  try { const raw = store()?.getItem(LOCAL_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function writeLocal(db) {
  try { store()?.setItem(LOCAL_KEY, JSON.stringify(db)); } catch { /* quota / private mode */ }
}

/** Latest data: hub (shared with the patient site) when reachable, otherwise the local copy. */
export async function readDb() {
  const local = readLocal();
  const hub = await hubGet();

  if (hub.connected) {
    // Hub is the source of truth, unless we worked offline and are ahead of it → push our copy up.
    if (hub.value && (!local || hub.value.rev >= local.rev)) { writeLocal(hub.value); return hub.value; }
    const candidate = local ?? await buildSeed();
    const res = await hubSet(candidate, hub.value?.rev ?? 0);
    if (res.ok) { writeLocal(candidate); return candidate; }
    if (res.value) { writeLocal(res.value); return res.value; } // someone else wrote first
    return candidate;
  }
  if (local) return local;
  const seeded = await buildSeed();
  writeLocal(seeded);
  return seeded;
}

/**
 * Apply `mutate(db)` atomically. `mutate` may throw (e.g. ApiError) to abort, and may return a value.
 * Retries when another tab/app wrote in between (rev mismatch).
 */
export async function updateDb(mutate) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const db = structuredClone(await readDb());
    const baseRev = db.rev;
    const result = await mutate(db);
    db.rev = baseRev + 1;

    const res = await hubSet(db, baseRev);
    if (res.connected && !res.ok) continue; // conflict → re-read and redo
    writeLocal(db);
    return result;
  }
  throw new Error('The registry is busy. Please try again.');
}

export { emptyDb };
