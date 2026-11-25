export const ORG_TYPES = ['HOSPITAL', 'CLINIC', 'PHARMACY', 'BLOOD_BANK', 'DIAGNOSTIC_LAB', 'OTHER'];
export const GOV_ID_TYPES = ['PAN', 'GSTIN', 'CIN', 'AADHAAR'];
export const RESOURCE_TYPES = ['DOCTOR', 'BLOOD', 'ORGAN', 'EQUIPMENT', 'MEDICINE'];
export const DIRECTIONS = ['REQUEST', 'OFFER'];
export const URGENCIES = ['ROUTINE', 'URGENT', 'CRITICAL'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const BLOOD_COMPONENTS = ['WHOLE_BLOOD', 'RBC', 'PLASMA', 'PLATELETS'];
export const ORGANS = ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'PANCREAS', 'CORNEA', 'INTESTINE'];
export const SHARE_STATUSES = ['OPEN', 'ACCEPTED', 'FULFILLED', 'DECLINED', 'CANCELLED'];

export const GOV_ID_PATTERNS = {
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  CIN: /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
  AADHAAR: /^[0-9]{12}$/,
};
