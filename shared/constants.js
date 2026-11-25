// Single source of truth for option lists — imported by BOTH frontends (no more "change both together").
export const ORG_TYPES = ['HOSPITAL', 'CLINIC', 'PHARMACY', 'BLOOD_BANK', 'DIAGNOSTIC_LAB', 'OTHER'];
export const GOV_ID_TYPES = [
  { value: 'PAN', label: 'PAN', hint: 'e.g. ABCDE1234F' },
  { value: 'GSTIN', label: 'GSTIN', hint: 'e.g. 19ABCDE1234F1Z5' },
  { value: 'CIN', label: 'CIN', hint: 'e.g. U85110WB2010PTC123456' },
  { value: 'AADHAAR', label: 'Aadhaar (authorised signatory)', hint: '12 digits' },
];
export const GOV_ID_PATTERNS = {
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  CIN: /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
  AADHAAR: /^[0-9]{12}$/,
};
export const RESOURCE_TYPES = ['DOCTOR', 'BLOOD', 'ORGAN', 'EQUIPMENT', 'MEDICINE'];
export const DIRECTIONS = ['REQUEST', 'OFFER'];
export const URGENCIES = ['ROUTINE', 'URGENT', 'CRITICAL'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const BLOOD_COMPONENTS = ['WHOLE_BLOOD', 'RBC', 'PLASMA', 'PLATELETS'];
export const ORGANS = ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'PANCREAS', 'CORNEA', 'INTESTINE'];

// Where the shared registry lives (localStorage of the PATIENT site origin — see README "How sync works").
export const REGISTRY_KEY = 'mc.registry.v1';

export const humanize = (v = '') => String(v).toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
