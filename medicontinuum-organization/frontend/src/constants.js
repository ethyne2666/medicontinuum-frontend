// Keep in sync with backend/src/constants.js
export const humanize = (v = '') =>
  v.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const ORG_TYPES = ['HOSPITAL', 'CLINIC', 'PHARMACY', 'BLOOD_BANK', 'DIAGNOSTIC_LAB', 'OTHER'];
export const GOV_ID_TYPES = [
  { value: 'PAN', label: 'PAN', hint: 'e.g. ABCDE1234F' },
  { value: 'GSTIN', label: 'GSTIN', hint: 'e.g. 19ABCDE1234F1Z5' },
  { value: 'CIN', label: 'CIN', hint: 'e.g. U85110WB2010PTC123456' },
  { value: 'AADHAAR', label: 'Aadhaar (authorised signatory)', hint: '12 digits' },
];
export const RESOURCE_TYPES = ['DOCTOR', 'BLOOD', 'ORGAN', 'EQUIPMENT', 'MEDICINE'];
export const URGENCIES = ['ROUTINE', 'URGENT', 'CRITICAL'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const BLOOD_COMPONENTS = ['WHOLE_BLOOD', 'RBC', 'PLASMA', 'PLATELETS'];
export const ORGANS = ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'PANCREAS', 'CORNEA', 'INTESTINE'];

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
