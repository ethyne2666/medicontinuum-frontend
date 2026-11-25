// One small store shared by Dashboard, Adherence, Inventory, the chatbot, the AI summary and the PDF report.
// Persisted in localStorage so a dose logged by voice/photo/text shows up everywhere (and survives a reload).
import { useSyncExternalStore } from 'react';
import { DOSES, INVENTORY } from '@/data/mock';

const KEY = 'mc.patient.v1';
const MAX_LOG = 200;
const today = () => new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
const fresh = () => ({ day: today(), doses: DOSES.map((d) => ({ ...d })), inventory: INVENTORY.map((i) => ({ ...i })), log: [] });
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw);
    if (!Array.isArray(s.doses) || !Array.isArray(s.inventory)) return fresh();
    // new day → the schedule starts over; stock and history carry on
    if (s.day !== today()) return { ...s, day: today(), doses: DOSES.map((d) => ({ ...d, status: 'PENDING' })), log: s.log ?? [] };
    return { ...s, log: s.log ?? [] };
  } catch { return fresh(); }
}

let state = load();
const listeners = new Set();

function commit(next) {
  state = next;
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify(state)); } catch { /* quota / private mode */ }
  listeners.forEach((l) => l());
}
const subscribe = (l) => {
  listeners.add(l);
  const onStorage = (e) => { if (e.key === KEY) { state = load(); l(); } };
  globalThis.addEventListener?.('storage', onStorage);
  return () => { listeners.delete(l); globalThis.removeEventListener?.('storage', onStorage); };
};

export const getPatientState = () => state;
export const usePatient = () => useSyncExternalStore(subscribe, getPatientState, getPatientState);

// ---------- helpers ----------
export const doseAmount = (dose) => Math.max(1, parseFloat(dose.dose) || 1);
const sameMed = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Take `qty` units of a medicine from stock, earliest-expiring batch first. Pure. */
export function takeFromStock(inventory, medicine, qty) {
  let remaining = qty;
  const order = inventory.filter((b) => sameMed(b.medicine, medicine) && b.quantity > 0)
    .sort((a, b) => String(a.expiryDate).localeCompare(String(b.expiryDate)));
  const next = inventory.map((b) => ({ ...b }));
  for (const batch of order) {
    if (remaining <= 0) break;
    const target = next.find((b) => b.id === batch.id);
    const used = Math.min(target.quantity, remaining);
    target.quantity -= used;
    remaining -= used;
  }
  const left = next.filter((b) => sameMed(b.medicine, medicine)).reduce((n, b) => n + b.quantity, 0);
  return { inventory: next, used: qty - remaining, short: remaining, left };
}

const logEntry = (e) => ({ id: newId(), ts: new Date().toISOString(), ...e });
const pushLog = (log, entry) => [entry, ...log].slice(0, MAX_LOG);

// ---------- actions ----------
export const patientActions = {
  /** Mark a scheduled dose. Marking TAKEN also deducts it from stock. */
  markDose(id, status, source = 'button') {
    const dose = state.doses.find((d) => d.id === id);
    if (!dose || dose.status === status) return null;
    let { inventory, log } = state;
    let result = { used: 0, short: 0, left: null };
    if (status === 'TAKEN') {
      result = takeFromStock(inventory, dose.medicine, doseAmount(dose));
      inventory = result.inventory;
    }
    log = pushLog(log, logEntry({ medicine: dose.medicine, qty: doseAmount(dose), status, source, doseId: id }));
    commit({ ...state, doses: state.doses.map((d) => (d.id === id ? { ...d, status } : d)), inventory, log });
    return { dose, ...result };
  },

  /**
   * Log "I took <medicine>" from chat / voice / photo. If it matches a pending dose today, that dose is
   * ticked off; otherwise it is recorded as an extra intake. Either way the stock goes down.
   */
  recordIntake({ medicine, qty, source = 'text' }) {
    const pending = state.doses.filter((d) => sameMed(d.medicine, medicine) && d.status === 'PENDING')
      .sort((a, b) => a.time.localeCompare(b.time))[0];
    if (pending) {
      const r = patientActions.markDose(pending.id, 'TAKEN', source);
      return { matchedDose: true, dose: pending, ...r };
    }
    const amount = qty ?? 1;
    const r = takeFromStock(state.inventory, medicine, amount);
    commit({ ...state, inventory: r.inventory, log: pushLog(state.log, logEntry({ medicine, qty: amount, status: 'EXTRA', source })) });
    return { matchedDose: false, ...r };
  },

  skipDose(medicine, source = 'text') {
    const pending = state.doses.find((d) => sameMed(d.medicine, medicine) && d.status === 'PENDING');
    if (!pending) return null;
    patientActions.markDose(pending.id, 'SKIPPED', source);
    return pending;
  },

  consumeBatch(id) {
    const batch = state.inventory.find((b) => b.id === id);
    if (!batch || batch.quantity <= 0) return;
    commit({
      ...state,
      inventory: state.inventory.map((b) => (b.id === id ? { ...b, quantity: b.quantity - 1 } : b)),
      log: pushLog(state.log, logEntry({ medicine: batch.medicine, qty: 1, status: 'EXTRA', source: 'manual' })),
    });
  },

  addBatch(batch) {
    commit({ ...state, inventory: [{ ...batch, id: newId() }, ...state.inventory] });
  },

  reset() { commit(fresh()); },
};

export const stockOf = (inventory, medicine) =>
  inventory.filter((b) => sameMed(b.medicine, medicine)).reduce((n, b) => n + b.quantity, 0);
