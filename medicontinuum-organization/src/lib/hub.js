// The two apps run on different ports = different browser origins, so they cannot share localStorage directly.
// The patient site ships a tiny page (/hub.html) that owns the registry. This portal loads it in a hidden
// iframe and talks to it with postMessage. If the patient site isn't running, we fall back to a local copy
// and re-connect automatically later.
export const PATIENT_URL = (import.meta.env?.VITE_PATIENT_URL
  ?? (typeof location !== 'undefined' ? `${location.protocol}//${location.hostname}:5173` : 'http://localhost:5173')).replace(/\/$/, '');

const CONNECT_TIMEOUT = 2500;
const CALL_TIMEOUT = 2000;
const RETRY_AFTER = 5000;

let frame = null;
let ready = null;        // Promise<boolean> for the current attempt
let lastFail = 0;
let seq = 0;
const pending = new Map();
const listeners = new Set();
let status = 'connecting'; // 'connected' | 'local' | 'connecting'

export const hubStatus = () => status;
export function onHubStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function setStatus(s) { if (s !== status) { status = s; listeners.forEach((fn) => fn(s)); } }

const canUseHub = () => typeof document !== 'undefined' && typeof window !== 'undefined' && typeof window.addEventListener === 'function';

function onMessage(e) {
  if (e.origin !== new URL(PATIENT_URL).origin) return;
  const m = e.data;
  if (!m || m.mc !== 'hub') return;
  if (m.ready) { frame?.__ready?.(true); return; }
  const p = pending.get(m.id);
  if (p) { pending.delete(m.id); clearTimeout(p.timer); p.resolve(m); }
}

function connect() {
  if (!canUseHub()) { setStatus('local'); return Promise.resolve(false); }
  if (ready) return ready;
  if (Date.now() - lastFail < RETRY_AFTER) return Promise.resolve(false);

  ready = new Promise((resolve) => {
    window.removeEventListener('message', onMessage);
    window.addEventListener('message', onMessage);
    frame?.remove();
    frame = document.createElement('iframe');
    frame.src = `${PATIENT_URL}/hub.html`;
    frame.title = 'MediContinuum sync';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
    const timer = setTimeout(() => finish(false), CONNECT_TIMEOUT);
    const finish = (ok) => {
      clearTimeout(timer);
      frame.__ready = null;
      if (!ok) { lastFail = Date.now(); ready = null; frame?.remove(); frame = null; }
      setStatus(ok ? 'connected' : 'local');
      resolve(ok);
    };
    frame.__ready = finish;
    document.body.appendChild(frame);
  });
  return ready;
}

function call(msg) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      pending.delete(id);
      lastFail = Date.now(); ready = null; frame?.remove(); frame = null; setStatus('local');
      reject(new Error('hub timeout'));
    }, CALL_TIMEOUT);
    pending.set(id, { resolve, timer });
    frame.contentWindow.postMessage({ mc: 'hub', id, ...msg }, new URL(PATIENT_URL).origin);
  });
}

/** → { connected, value } — value is the registry stored by the patient site (or null if empty). */
export async function hubGet() {
  if (!(await connect())) return { connected: false, value: null };
  try { const r = await call({ op: 'get' }); return { connected: true, value: r.value ?? null }; } catch { return { connected: false, value: null }; }
}

/** Compare-and-set on `rev`. → { connected, ok, value } (value = current hub data on conflict). */
export async function hubSet(value, expectedRev) {
  if (!(await connect())) return { connected: false, ok: false, value: null };
  try { const r = await call({ op: 'set', value, expectedRev }); return { connected: true, ok: Boolean(r.ok), value: r.value ?? null }; } catch { return { connected: false, ok: false, value: null }; }
}

export const startHub = () => { connect(); };
