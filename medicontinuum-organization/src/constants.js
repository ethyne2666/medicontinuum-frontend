// Option lists come from /shared (also used by the patient site). Only UI helpers live here.
export {
  BLOOD_COMPONENTS, BLOOD_GROUPS, GOV_ID_TYPES, ORGANS, ORG_TYPES, RESOURCE_TYPES, URGENCIES, humanize,
} from '@shared/constants.js';
import { humanize } from '@shared/constants.js';

export const entityTypeLabel = (e) => (e.kind === 'DOCTOR' ? 'Individual doctor' : humanize(e.orgType));

export const groupDigits = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

export function describeShare(s) {
  const d = s.details ?? {};
  switch (s.resourceType) {
    case 'BLOOD':
      return `${s.quantity} unit${s.quantity > 1 ? 's' : ''} · ${humanize(d.component)} · ${d.bloodGroup}`;
    case 'ORGAN':
      return `${humanize(d.organ)}${d.bloodGroup ? ` · ${d.bloodGroup}` : ''}`;
    case 'DOCTOR':
      return `${d.specialization}${s.quantity > 1 ? ` × ${s.quantity}` : ''}${d.durationHours ? ` · ${d.durationHours} h` : ''}`;
    default:
      return `${d.item} × ${s.quantity}`;
  }
}
