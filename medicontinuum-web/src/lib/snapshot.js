// A plain-object picture of the patient's current data. Feeds the chatbot, the AI summary and the PDF.
import { PRESCRIPTIONS, PROFILE, USER, WEEK } from '@/data/mock';
import { daysUntil } from '@/utils/date';
import { isExpiring, isLow } from '@/utils/inventory';
import { doseAmount } from '@/store/patientStore';

export function buildSnapshot(state, now = new Date()) {
  const { doses, inventory, log } = state;
  const count = (s) => doses.filter((d) => d.status === s).length;
  const taken = count('TAKEN');
  const percent = doses.length ? Math.round((taken / doses.length) * 100) : 0;

  const perDay = {}; // units of each medicine scheduled per day
  doses.forEach((d) => { perDay[d.medicine] = (perDay[d.medicine] ?? 0) + doseAmount(d); });

  const stock = {};
  inventory.forEach((b) => { stock[b.medicine] = (stock[b.medicine] ?? 0) + b.quantity; });
  const supply = Object.entries(stock).map(([medicine, quantity]) => ({
    medicine, quantity, perDay: perDay[medicine] ?? 0,
    daysLeft: perDay[medicine] ? Math.floor(quantity / perDay[medicine]) : null,
  }));

  const active = PRESCRIPTIONS.filter((p) => p.status === 'ACTIVE');
  const prevDays = WEEK.slice(0, -1);
  return {
    generatedAt: now.toISOString(),
    patient: { name: USER.name, email: USER.email, globalUserId: USER.globalUserId, ...PROFILE },
    doses, taken, skipped: count('SKIPPED'), pending: count('PENDING'), percent,
    week: WEEK, weekAverage: prevDays.length ? Math.round(prevDays.reduce((n, d) => n + d.percent, 0) / prevDays.length) : null,
    inventory, supply,
    low: inventory.filter(isLow),
    expiring: inventory.filter((i) => isExpiring(i)).map((i) => ({ ...i, daysLeft: daysUntil(i.expiryDate) })).sort((a, b) => a.daysLeft - b.daysLeft),
    prescriptions: PRESCRIPTIONS,
    activePrescriptions: active,
    endingSoon: active.flatMap((p) => p.items.map((it) => ({ ...it, doctor: p.doctor, daysLeft: daysUntil(it.endDate) }))).filter((it) => it.daysLeft >= 0 && it.daysLeft <= 14),
    log: log.slice(0, 15),
  };
}
