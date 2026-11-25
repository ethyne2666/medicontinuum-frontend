// "AI summary" without a server: a transparent rule-based analyst over the patient's own data.
// (Optionally the text can be polished by Gemini — see lib/gemini.js. The facts always come from here.)
import { humanize } from '@/utils/date';

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

export function generateSummary(s) {
  const insights = [];
  const actions = [];
  const add = (tone, title, text) => insights.push({ tone, title, text });

  // adherence
  const trend = s.weekAverage == null ? null : s.percent - s.weekAverage;
  const tone = s.percent >= 80 ? 'green' : s.percent >= 50 ? 'amber' : 'red';
  add(tone, 'Adherence today',
    `${s.taken} of ${s.doses.length} doses taken (${s.percent}%)${s.skipped ? `, ${plural(s.skipped, 'dose')} skipped` : ''}.` +
    (s.weekAverage != null ? ` Your average over the previous six days was ${s.weekAverage}%${trend >= 5 ? ', so today is ahead of your usual pace' : trend <= -15 ? ', so today is behind your usual pace' : ''}.` : ''));
  const pending = s.doses.filter((d) => d.status === 'PENDING');
  if (pending.length) {
    add('sky', 'Still to take today', pending.map((d) => `${d.medicine} at ${d.time}`).join(', ') + '.');
    actions.push(`Take your remaining ${plural(pending.length, 'dose')} on schedule.`);
  }

  // stock
  const lowSupply = s.supply.filter((x) => s.low.some((b) => b.medicine === x.medicine));
  if (lowSupply.length) {
    add('red', 'Low stock', lowSupply.map((x) => `${x.medicine}: ${x.quantity} left${x.daysLeft != null ? ` (about ${plural(x.daysLeft, 'day')})` : ''}`).join('; ') + '.');
    actions.push(`Refill ${lowSupply.map((x) => x.medicine).join(', ')} — see Pharmacies.`);
  } else {
    add('green', 'Stock', 'All medicines are above their low-stock thresholds.');
  }
  const soon = s.supply.filter((x) => x.daysLeft != null && x.daysLeft <= 7 && !lowSupply.includes(x));
  if (soon.length) add('amber', 'Running out within a week', soon.map((x) => `${x.medicine} (${plural(x.daysLeft, 'day')})`).join(', ') + '.');

  // expiry
  if (s.expiring.length) {
    add('amber', 'Expiring soon', s.expiring.map((i) => `${i.medicine} batch ${i.batchNumber}: ${i.daysLeft < 0 ? 'expired' : `${plural(i.daysLeft, 'day')} left`}`).join('; ') + '.');
    actions.push('Use the earliest-expiring batches first and replace any expired medicine.');
  }

  // prescriptions
  if (s.activePrescriptions.length) {
    const meds = [...new Set(s.activePrescriptions.flatMap((p) => p.items.map((i) => i.medicine)))];
    add('sky', 'Active prescriptions', `${plural(s.activePrescriptions.length, 'active prescription')} covering ${meds.join(', ')}.`);
  }
  s.endingSoon.forEach((it) => actions.push(`${it.medicine} (Dr. ${it.doctor.replace(/^Dr\.?\s*/, '')}) ends in ${plural(it.daysLeft, 'day')} — ask about renewal.`));

  // activity
  const viaChat = s.log.filter((l) => ['text', 'voice', 'image'].includes(l.source)).length;
  if (s.log.length) add('slate', 'Recent activity', `${plural(s.log.length, 'intake event')} recorded recently${viaChat ? `, ${viaChat} through the assistant` : ''}.`);

  const headline =
    s.percent >= 80 ? 'You are on track today.'
      : s.percent >= 50 ? 'You are partly on track — a few doses remain.'
        : pending.length ? 'Doses are still pending today.' : 'Several doses were missed today.';

  if (!actions.length) actions.push('Nothing urgent — keep following your schedule.');

  const text = [
    headline,
    ...insights.map((i) => `${i.title}: ${i.text}`),
    'Suggested next steps:',
    ...actions.map((a) => `- ${a}`),
  ].join('\n');

  return { headline, tone, insights, actions, text };
}

export { humanize };
