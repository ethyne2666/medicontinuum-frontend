import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { HttpError } from '../lib/errors.js';
import {
  fingerprint, formatOrgNumber, generateOrgNumber, maskOrgNumber, maskTail, newPublicId,
} from '../lib/crypto.js';

const find = (store, pred) => store.data.entities.find(pred);
// valid bcrypt hash used to keep login timing constant when the number doesn't exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

/** Step 1: verify identity documents, de-duplicate, and issue the unique 16-digit number. */
export function registerEntity(store, input) {
  const { entities } = store.data;
  const fp = {};
  if (input.kind === 'ORGANIZATION') {
    fp.licenseFp = fingerprint('LICENSE', input.licenseNumber);
    fp.govIdFp = fingerprint(input.govIdType, input.govIdNumber);
  } else {
    fp.doctorIdFp = fingerprint('DOCTOR', `${input.council}:${input.doctorRegNumber}`);
  }

  if (entities.some((e) => e.email === input.email)) {
    throw new HttpError(409, 'DUPLICATE', 'This email is already registered.', { email: 'Already registered' });
  }
  if (fp.licenseFp && entities.some((e) => e.licenseFp === fp.licenseFp)) {
    throw new HttpError(409, 'DUPLICATE', 'This licence number is already registered.', { licenseNumber: 'Already registered' });
  }
  if (fp.govIdFp && entities.some((e) => e.govIdFp === fp.govIdFp)) {
    throw new HttpError(409, 'DUPLICATE', 'This government ID is already registered.', { govIdNumber: 'Already registered' });
  }
  if (fp.doctorIdFp && entities.some((e) => e.doctorIdFp === fp.doctorIdFp)) {
    throw new HttpError(409, 'DUPLICATE', 'This doctor ID is already registered.', { doctorRegNumber: 'Already registered' });
  }

  const orgNumber = generateOrgNumber((n) => entities.some((e) => e.orgNumber === n));
  const isOrg = input.kind === 'ORGANIZATION';
  const entity = {
    id: randomUUID(),
    publicId: newPublicId(),
    orgNumber,
    kind: input.kind,
    orgType: isOrg ? input.orgType : null,
    name: input.name,
    contactPerson: isOrg ? input.contactPerson : input.name,
    specialization: isOrg ? null : input.specialization,
    licenseNumber: isOrg ? input.licenseNumber : null,
    govIdType: isOrg ? input.govIdType : null,
    govIdMasked: isOrg ? maskTail(input.govIdNumber) : null,
    doctorRegNumber: isOrg ? null : input.doctorRegNumber,
    council: isOrg ? null : input.council,
    address: isOrg ? input.address : null,
    email: input.email,
    phone: input.phone,
    city: input.city,
    state: input.state,
    country: input.country,
    postalCode: input.postalCode,
    ...fp,
    status: 'REGISTERED', // number issued, login not created yet
    passwordHash: null,
    createdAt: new Date().toISOString(),
    activatedAt: null,
  };
  entities.push(entity);
  store.save();
  return entity;
}

/** Step 2: only someone holding the 16-digit number + registered email can create the login. */
export async function activateAccount(store, { orgNumber, email, password }) {
  const entity = find(store, (e) => e.orgNumber === orgNumber);
  if (!entity || entity.email !== email) {
    throw new HttpError(400, 'MISMATCH', 'The organization number and registered email do not match.');
  }
  if (entity.status === 'ACTIVE') {
    throw new HttpError(409, 'ALREADY_ACTIVE', 'A login already exists for this number. Please log in.');
  }
  entity.passwordHash = await bcrypt.hash(password, 10);
  entity.status = 'ACTIVE';
  entity.activatedAt = new Date().toISOString();
  store.save();
  return entity;
}

export async function verifyLogin(store, { orgNumber, password }) {
  const entity = find(store, (e) => e.orgNumber === orgNumber && e.status === 'ACTIVE');
  // compare against a dummy hash when not found so timing doesn't reveal valid numbers
  const hash = entity?.passwordHash ?? DUMMY_HASH;
  const ok = await bcrypt.compare(password, hash);
  return ok && entity ? entity : null;
}

// ---------------- views ----------------
const publicFields = (e) => ({
  publicId: e.publicId,
  kind: e.kind,
  orgType: e.orgType,
  name: e.name,
  specialization: e.specialization,
  city: e.city,
  state: e.state,
  country: e.country,
});

/** Anyone (including the patient site). Never includes the full 16-digit number or any hash. */
export const publicView = (e) => ({
  ...publicFields(e),
  phone: e.kind === 'ORGANIZATION' ? e.phone : null,
  numberHint: maskOrgNumber(e.orgNumber),
  registeredAt: e.activatedAt,
});

/** Logged-in peers (directory). Contact details are only released on an accepted share. */
export const peerView = (e) => publicFields(e);

/** The entity's own profile. */
export const selfView = (e) => {
  const { passwordHash, licenseFp, govIdFp, doctorIdFp, orgNumber, ...rest } = e;
  return { ...rest, orgNumber, orgNumberFormatted: formatOrgNumber(orgNumber) };
};

export const registrationView = (e) => ({
  orgNumber: e.orgNumber,
  orgNumberFormatted: formatOrgNumber(e.orgNumber),
  name: e.name,
  email: e.email,
  kind: e.kind,
});

export const activeEntities = (store) => store.data.entities.filter((e) => e.status === 'ACTIVE');
