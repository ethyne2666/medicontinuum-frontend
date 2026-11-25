// Hand-written validation (replaces the old backend's zod schemas). Each validator returns { value, fields }.
import {
  BLOOD_COMPONENTS, BLOOD_GROUPS, DIRECTIONS, GOV_ID_PATTERNS, GOV_ID_TYPES, ORGANS, ORG_TYPES, RESOURCE_TYPES, URGENCIES,
} from '@shared/constants.js';

const str = (v) => (typeof v === 'string' ? v.trim() : '');

function make() {
  const fields = {};
  const fail = (name, message) => { if (!fields[name]) fields[name] = message; };
  const text = (name, raw, min, max, label) => {
    const v = str(raw);
    if (v.length < min) fail(name, `${label} is required`);
    else if (v.length > max) fail(name, `${label} is too long`);
    return v;
  };
  const email = (raw) => {
    const v = str(raw).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || v.length > 120) fail('email', 'Enter a valid email address');
    return v;
  };
  const phone = (raw) => {
    const v = str(raw).replace(/[\s()-]/g, '');
    if (!/^\+?[0-9]{10,15}$/.test(v)) fail('phone', 'Enter a valid phone number');
    return v;
  };
  const oneOf = (name, raw, list, message) => { if (!list.includes(raw)) fail(name, message); return raw; };
  return { fields, fail, text, email, phone, oneOf };
}

const location = (c, b) => ({
  city: c.text('city', b.city, 2, 60, 'City'),
  state: c.text('state', b.state, 2, 60, 'State'),
  country: c.text('country', b.country || 'India', 2, 60, 'Country'),
  postalCode: /^[A-Za-z0-9 -]{4,10}$/.test(str(b.postalCode)) ? str(b.postalCode) : (c.fail('postalCode', 'Enter a valid postal code'), ''),
});

export function validateRegistration(b = {}) {
  const c = make();
  let value;
  if (b.kind === 'ORGANIZATION') {
    const licenseNumber = str(b.licenseNumber).toUpperCase();
    if (!/^[A-Z0-9/-]{5,30}$/.test(licenseNumber)) c.fail('licenseNumber', 'Licence number: 5–30 letters, digits, / or -');
    const govIdType = c.oneOf('govIdType', b.govIdType, GOV_ID_TYPES.map((g) => g.value), 'Choose a government ID type');
    const govIdNumber = str(b.govIdNumber).toUpperCase().replace(/\s/g, '');
    if (GOV_ID_PATTERNS[govIdType] && !GOV_ID_PATTERNS[govIdType].test(govIdNumber)) c.fail('govIdNumber', `Not a valid ${govIdType} number`);
    value = {
      kind: 'ORGANIZATION',
      name: c.text('name', b.name, 2, 120, 'Organization name'),
      orgType: c.oneOf('orgType', b.orgType, ORG_TYPES, 'Choose an organization type'),
      licenseNumber, govIdType, govIdNumber,
      contactPerson: c.text('contactPerson', b.contactPerson, 2, 80, 'Contact person'),
      address: c.text('address', b.address, 5, 200, 'Address'),
      email: c.email(b.email), phone: c.phone(b.phone), ...location(c, b),
    };
  } else if (b.kind === 'DOCTOR') {
    const doctorRegNumber = str(b.doctorRegNumber).toUpperCase();
    if (!/^[A-Z0-9/-]{4,25}$/.test(doctorRegNumber)) c.fail('doctorRegNumber', 'Doctor ID: 4–25 letters, digits, / or -');
    value = {
      kind: 'DOCTOR',
      name: c.text('name', b.name, 2, 80, 'Full name'),
      doctorRegNumber,
      council: c.text('council', b.council, 2, 100, 'Medical council'),
      specialization: c.text('specialization', b.specialization, 2, 80, 'Specialization'),
      email: c.email(b.email), phone: c.phone(b.phone), ...location(c, b),
    };
  } else {
    c.fail('kind', 'Choose organization or individual doctor');
  }
  return { value, fields: c.fields };
}

export const cleanOrgNumber = (v) => str(v).replace(/[\s-]/g, '');

export function validatePassword(pw, fields, name = 'password') {
  if (typeof pw !== 'string' || pw.length < 8) fields[name] = 'At least 8 characters';
  else if (pw.length > 72) fields[name] = 'At most 72 characters';
  else if (!/[A-Za-z]/.test(pw)) fields[name] = 'Must contain a letter';
  else if (!/[0-9]/.test(pw)) fields[name] = 'Must contain a number';
}

export function validateSignup(b = {}) {
  const c = make();
  const orgNumber = cleanOrgNumber(b.orgNumber);
  if (!/^\d{16}$/.test(orgNumber)) c.fail('orgNumber', 'Organization number must be 16 digits');
  const email = c.email(b.email);
  validatePassword(b.password, c.fields);
  return { value: { orgNumber, email, password: b.password }, fields: c.fields };
}

export function validateShare(b = {}) {
  const c = make();
  const n = Number(b.quantity ?? 1);
  if (!Number.isInteger(n) || n < 1 || n > 1000) c.fail('quantity', 'Enter a whole number between 1 and 1000');
  const notes = str(b.notes);
  if (notes.length > 500) c.fail('notes', 'Keep notes under 500 characters');
  const neededBy = b.neededBy || null;
  if (neededBy && !/^\d{4}-\d{2}-\d{2}$/.test(neededBy)) c.fail('neededBy', 'Use a valid date');

  const d = b.details ?? {};
  const details = {};
  switch (b.resourceType) {
    case 'BLOOD':
      details.bloodGroup = c.oneOf('details.bloodGroup', d.bloodGroup, BLOOD_GROUPS, 'Choose a blood group');
      details.component = BLOOD_COMPONENTS.includes(d.component) ? d.component : 'WHOLE_BLOOD';
      break;
    case 'ORGAN':
      details.organ = c.oneOf('details.organ', d.organ, ORGANS, 'Choose an organ');
      if (d.bloodGroup) details.bloodGroup = c.oneOf('details.bloodGroup', d.bloodGroup, BLOOD_GROUPS, 'Choose a blood group');
      break;
    case 'DOCTOR': {
      details.specialization = c.text('details.specialization', d.specialization, 2, 80, 'Specialization');
      if (d.durationHours) {
        const h = Number(d.durationHours);
        if (!Number.isInteger(h) || h < 1 || h > 24 * 90) c.fail('details.durationHours', 'Between 1 and 2160 hours');
        else details.durationHours = h;
      }
      break;
    }
    case 'EQUIPMENT':
      details.item = c.text('details.item', d.item, 2, 100, 'Equipment');
      break;
    case 'MEDICINE':
      details.item = c.text('details.item', d.item, 2, 100, 'Medicine');
      break;
    default:
      c.fail('resourceType', 'Choose a resource');
  }
  if (!DIRECTIONS.includes(b.direction)) c.fail('direction', 'Choose request or offer');
  const urgency = URGENCIES.includes(b.urgency) ? b.urgency : 'ROUTINE';

  return {
    value: {
      direction: b.direction, resourceType: b.resourceType, urgency, quantity: n, notes, neededBy, details,
      targetPublicId: str(b.targetPublicId) || null,
    },
    fields: c.fields,
  };
}

export function validateDoctor(b = {}) {
  const c = make();
  return { value: { name: c.text('name', b.name, 2, 80, 'Name'), specialization: c.text('specialization', b.specialization, 2, 80, 'Specialization') }, fields: c.fields };
}

export { RESOURCE_TYPES };
