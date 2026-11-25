// Browser-only replacement for the old Express backend. Same method names and response shapes as before,
// so every page works unchanged; data lives in the shared registry (see lib/db.js and lib/hub.js).
import {
  fingerprint, formatOrgNumber, generateOrgNumber, hashPassword, maskTail, newId, newPublicId,
} from '@shared/crypto.js';
import { activeEntities, peerView, publicView } from '@shared/registry.js';
import { readDb, updateDb } from '@/lib/db';
import {
  cleanOrgNumber, validateDoctor, validatePassword, validateRegistration, validateShare, validateSignup,
} from '@/lib/validate';

// ---------------- session ----------------
const SESSION_KEY = 'mc-org-session';
const LOCK_KEY = 'mc-org-lock';
const ls = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

export const tokenStore = {
  get: () => { try { return ls()?.getItem(SESSION_KEY) ?? null; } catch { return null; } },
  set: (t) => { try { ls()?.setItem(SESSION_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { ls()?.removeItem(SESSION_KEY); } catch { /* ignore */ } },
};

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.message ?? 'Request failed');
    this.status = status;
    this.code = payload?.code;
    this.fields = payload?.fields ?? {};
  }
}
const fail = (status, code, message, fields) => { throw new ApiError(status, { code, message, fields }); };
const check = ({ value, fields }) => {
  if (Object.keys(fields).length) fail(400, 'VALIDATION', 'Please fix the highlighted fields.', fields);
  return value;
};

// ---------------- brute-force protection (5 failures → 15 min lock per number) ----------------
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const readLocks = () => { try { return JSON.parse(ls()?.getItem(LOCK_KEY) ?? '{}'); } catch { return {}; } };
const writeLocks = (o) => { try { ls()?.setItem(LOCK_KEY, JSON.stringify(o)); } catch { /* ignore */ } };
const lockedFor = (key) => { const l = readLocks()[key]; return l?.until > Date.now() ? l.until - Date.now() : 0; };
function recordFailure(key) {
  const all = readLocks();
  const cur = all[key] && (!all[key].until || all[key].until > Date.now()) ? all[key] : { count: 0 };
  cur.count += 1;
  if (cur.count >= MAX_FAILS) { cur.until = Date.now() + LOCK_MS; cur.count = 0; }
  all[key] = cur; writeLocks(all);
}
function clearFailures(key) { const all = readLocks(); delete all[key]; writeLocks(all); }

// ---------------- views ----------------
const selfView = (e) => {
  const { passwordHash, licenseFp, govIdFp, doctorIdFp, ...rest } = e;
  return { ...rest, orgNumberFormatted: formatOrgNumber(e.orgNumber) };
};
const registrationView = (e) => ({ orgNumber: e.orgNumber, orgNumberFormatted: formatOrgNumber(e.orgNumber), name: e.name, email: e.email, kind: e.kind });

function currentMe(db) {
  const id = tokenStore.get();
  const me = id && db.entities.find((e) => e.id === id && e.status === 'ACTIVE');
  if (!me) {
    if (id) { tokenStore.clear(); globalThis.window?.dispatchEvent?.(new Event('auth:expired')); }
    fail(401, 'UNAUTHENTICATED', 'Please log in again.');
  }
  return me;
}

// ---------------- sharing rules ----------------
const URGENCY_RANK = { CRITICAL: 0, URGENT: 1, ROUTINE: 2 };
const byId = (db, id) => (id ? db.entities.find((e) => e.id === id) : null);
const brief = (e) => (e ? peerView(e) : null);
const canSee = (s, me) => s.ownerId === me.id || s.responderId === me.id || s.targetId === me.id || (!s.targetId && s.status === 'OPEN');

function shareView(db, s, me) {
  const isOwner = s.ownerId === me.id;
  const isResponder = s.responderId === me.id;
  const involved = isOwner || isResponder;
  const settled = s.status === 'ACCEPTED' || s.status === 'FULFILLED';
  let counterpart = null;
  if (involved && settled) { // contact details are released only after acceptance
    const other = byId(db, isOwner ? s.responderId : s.ownerId);
    if (other) counterpart = { ...peerView(other), contactPerson: other.contactPerson, email: other.email, phone: other.phone };
  }
  return {
    id: s.id, direction: s.direction, resourceType: s.resourceType, urgency: s.urgency, quantity: s.quantity,
    details: s.details, notes: s.notes, neededBy: s.neededBy, status: s.status, createdAt: s.createdAt, updatedAt: s.updatedAt,
    owner: brief(byId(db, s.ownerId)), target: brief(byId(db, s.targetId)),
    responder: involved ? brief(byId(db, s.responderId)) : null,
    responseMessage: involved ? s.responseMessage : '',
    isMine: isOwner, counterpart,
    canRespond: !isOwner && s.status === 'OPEN' && (!s.targetId || s.targetId === me.id) && !s.declinedBy.includes(me.id),
    canFulfil: isOwner && s.status === 'ACCEPTED',
    canCancel: isOwner && (s.status === 'OPEN' || s.status === 'ACCEPTED'),
  };
}

function listShares(db, me, { scope = 'incoming', type, direction, status } = {}) {
  let rows = db.shares.filter((s) => {
    if (scope === 'mine') return s.ownerId === me.id;
    if (scope === 'responded') return s.responderId === me.id;
    return s.ownerId !== me.id && s.status === 'OPEN' && (!s.targetId || s.targetId === me.id) && !s.declinedBy.includes(me.id);
  });
  if (type) rows = rows.filter((s) => s.resourceType === type);
  if (direction) rows = rows.filter((s) => s.direction === direction);
  if (status) rows = rows.filter((s) => s.status === status);
  rows.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || b.createdAt.localeCompare(a.createdAt));
  return rows.map((s) => shareView(db, s, me));
}

const visibleShare = (db, id, me) => {
  const s = db.shares.find((x) => x.id === id);
  if (!s || !canSee(s, me)) fail(404, 'NOT_FOUND', 'Share not found.');
  return s;
};

function ownerTransition(id, from, to) {
  return updateDb((db) => {
    const me = currentMe(db);
    const s = visibleShare(db, id, me);
    if (s.ownerId !== me.id) fail(403, 'FORBIDDEN', 'Only the owner can do this.');
    if (!from.includes(s.status)) fail(409, 'INVALID_STATE', `Cannot change a ${s.status.toLowerCase()} post this way.`);
    s.status = to; s.updatedAt = new Date().toISOString();
    return shareView(db, s, me);
  });
}

const qsMatch = (e, needle) => !needle || [e.name, e.city, e.state, e.specialization ?? ''].some((v) => v.toLowerCase().includes(needle));

// ---------------- public API ----------------
export const api = {
  /** Step 1 — verify documents, de-duplicate, issue the unique 16-digit number. */
  async register(body) {
    const input = check(validateRegistration(body));
    const fp = input.kind === 'ORGANIZATION'
      ? { licenseFp: await fingerprint('LICENSE', input.licenseNumber), govIdFp: await fingerprint(input.govIdType, input.govIdNumber), doctorIdFp: null }
      : { licenseFp: null, govIdFp: null, doctorIdFp: await fingerprint('DOCTOR', `${input.council}:${input.doctorRegNumber}`) };

    return updateDb((db) => {
      const { entities } = db;
      if (entities.some((e) => e.email === input.email)) fail(409, 'DUPLICATE', 'This email is already registered.', { email: 'Already registered' });
      if (fp.licenseFp && entities.some((e) => e.licenseFp === fp.licenseFp)) fail(409, 'DUPLICATE', 'This licence number is already registered.', { licenseNumber: 'Already registered' });
      if (fp.govIdFp && entities.some((e) => e.govIdFp === fp.govIdFp)) fail(409, 'DUPLICATE', 'This government ID is already registered.', { govIdNumber: 'Already registered' });
      if (fp.doctorIdFp && entities.some((e) => e.doctorIdFp === fp.doctorIdFp)) fail(409, 'DUPLICATE', 'This doctor ID is already registered.', { doctorRegNumber: 'Already registered' });

      const isOrg = input.kind === 'ORGANIZATION';
      const entity = {
        id: newId(), publicId: newPublicId(),
        orgNumber: generateOrgNumber((n) => entities.some((e) => e.orgNumber === n)),
        kind: input.kind, orgType: isOrg ? input.orgType : null, name: input.name,
        contactPerson: isOrg ? input.contactPerson : input.name,
        specialization: isOrg ? null : input.specialization,
        licenseNumber: isOrg ? input.licenseNumber : null,
        govIdType: isOrg ? input.govIdType : null, govIdMasked: isOrg ? maskTail(input.govIdNumber) : null,
        doctorRegNumber: isOrg ? null : input.doctorRegNumber, council: isOrg ? null : input.council,
        address: isOrg ? input.address : null,
        email: input.email, phone: input.phone, city: input.city, state: input.state, country: input.country, postalCode: input.postalCode,
        ...fp, doctors: [], status: 'REGISTERED', passwordHash: null, sample: false,
        createdAt: new Date().toISOString(), activatedAt: null,
      };
      entities.push(entity);
      return registrationView(entity);
    });
  },

  /** Step 2 — only the holder of the 16-digit number AND its registered email can create the login. */
  async signup(body) {
    const input = check(validateSignup(body));
    const passwordHash = await hashPassword(input.orgNumber, input.password);
    return updateDb((db) => {
      const entity = db.entities.find((e) => e.orgNumber === input.orgNumber);
      if (!entity || entity.email !== input.email) fail(400, 'MISMATCH', 'The organization number and registered email do not match.');
      if (entity.status === 'ACTIVE') fail(409, 'ALREADY_ACTIVE', 'A login already exists for this number. Please log in.');
      entity.passwordHash = passwordHash; entity.status = 'ACTIVE'; entity.activatedAt = new Date().toISOString();
      return { token: entity.id, entity: selfView(entity) };
    });
  },

  /** Step 3 — log in with the 16-digit number + password. */
  async login(body = {}) {
    const orgNumber = cleanOrgNumber(body.orgNumber);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!/^\d{16}$/.test(orgNumber)) fail(400, 'VALIDATION', 'Organization number must be 16 digits', { orgNumber: 'Organization number must be 16 digits' });
    const wait = lockedFor(orgNumber);
    if (wait) fail(429, 'LOCKED', `Too many failed attempts. Try again in ${Math.ceil(wait / 60000)} minute(s).`);

    const db = await readDb();
    const entity = db.entities.find((e) => e.orgNumber === orgNumber && e.status === 'ACTIVE');
    const ok = entity && (await hashPassword(orgNumber, password)) === entity.passwordHash;
    if (!ok) { recordFailure(orgNumber); fail(401, 'BAD_CREDENTIALS', 'Incorrect organization number or password.'); }
    clearFailures(orgNumber);
    return { token: entity.id, entity: selfView(entity) };
  },

  async me() { return { entity: selfView(currentMe(await readDb())) }; },

  async stats() {
    const rows = activeEntities(await readDb());
    const byType = {};
    rows.forEach((e) => { const k = e.orgType ?? 'DOCTOR'; byType[k] = (byType[k] ?? 0) + 1; });
    return {
      total: rows.length, organizations: rows.filter((e) => e.kind === 'ORGANIZATION').length,
      doctors: rows.filter((e) => e.kind === 'DOCTOR').length, byType, asOf: new Date().toISOString(),
    };
  },

  /** Same figures without logging in — used by the portal home page. */
  async publicDirectory() {
    return activeEntities(await readDb()).map(publicView);
  },

  async network({ q = '', kind, type } = {}) {
    const db = await readDb();
    const me = currentMe(db);
    const needle = q.trim().toLowerCase();
    let rows = activeEntities(db).filter((e) => e.id !== me.id && qsMatch(e, needle));
    if (kind) rows = rows.filter((e) => e.kind === kind);
    if (type) rows = rows.filter((e) => e.orgType === type);
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return { items: rows.map(peerView), total: rows.length };
  },

  async shares(params = {}) {
    const db = await readDb();
    const me = currentMe(db);
    const scope = ['incoming', 'mine', 'responded'].includes(params.scope) ? params.scope : 'incoming';
    const items = listShares(db, me, { ...params, scope });
    return { items, total: items.length, asOf: new Date().toISOString() };
  },

  async summary() {
    const db = await readDb();
    const me = currentMe(db);
    const mine = db.shares.filter((s) => s.ownerId === me.id);
    return {
      incomingOpen: listShares(db, me, { scope: 'incoming' }).length,
      myOpen: mine.filter((s) => s.status === 'OPEN').length,
      myAccepted: mine.filter((s) => s.status === 'ACCEPTED').length,
      myFulfilled: mine.filter((s) => s.status === 'FULFILLED').length,
      respondedActive: db.shares.filter((s) => s.responderId === me.id && s.status === 'ACCEPTED').length,
    };
  },

  async createShare(body) {
    const input = check(validateShare(body));
    return updateDb((db) => {
      const me = currentMe(db);
      if (input.resourceType === 'ORGAN' && !(me.kind === 'ORGANIZATION' && me.orgType === 'HOSPITAL')) {
        fail(403, 'FORBIDDEN', 'Only registered hospitals can post organ requests or offers.');
      }
      let target = null;
      if (input.targetPublicId) {
        target = db.entities.find((e) => e.publicId === input.targetPublicId && e.status === 'ACTIVE');
        if (!target) fail(404, 'NOT_FOUND', 'The selected organization was not found.', { targetPublicId: 'Not found' });
        if (target.id === me.id) fail(400, 'INVALID', 'You cannot send a share to yourself.', { targetPublicId: 'Choose another organization' });
      }
      const now = new Date().toISOString();
      const share = {
        id: newId(), direction: input.direction, resourceType: input.resourceType, urgency: input.urgency, quantity: input.quantity,
        details: input.details, notes: input.notes, neededBy: input.neededBy, ownerId: me.id, targetId: target?.id ?? null,
        status: 'OPEN', responderId: null, responseMessage: '', declinedBy: [], createdAt: now, updatedAt: now,
      };
      db.shares.push(share);
      return shareView(db, share, me);
    });
  },

  respond(id, { action, message = '' } = {}) {
    return updateDb((db) => {
      const me = currentMe(db);
      const s = visibleShare(db, id, me);
      if (!['ACCEPT', 'DECLINE'].includes(action)) fail(400, 'VALIDATION', 'Choose accept or decline.');
      if (s.ownerId === me.id) fail(403, 'FORBIDDEN', 'You cannot respond to your own post.');
      if (s.status !== 'OPEN') fail(409, 'CLOSED', 'This post is no longer open.');
      if (s.targetId && s.targetId !== me.id) fail(404, 'NOT_FOUND', 'Share not found.');
      if (s.declinedBy.includes(me.id)) fail(409, 'CLOSED', 'You already declined this post.');
      const msg = String(message).trim().slice(0, 300);
      if (action === 'ACCEPT') { s.status = 'ACCEPTED'; s.responderId = me.id; s.responseMessage = msg; }
      else if (s.targetId === me.id) { s.status = 'DECLINED'; s.responderId = me.id; s.responseMessage = msg; }
      else s.declinedBy.push(me.id); // broadcast: just hide it from me
      s.updatedAt = new Date().toISOString();
      return shareView(db, s, me);
    });
  },

  fulfil: (id) => ownerTransition(id, ['ACCEPTED'], 'FULFILLED'),
  cancel: (id) => ownerTransition(id, ['OPEN', 'ACCEPTED'], 'CANCELLED'),

  // Doctors working at an organization — shown to patients on the patient site.
  addDoctor(body) {
    const input = check(validateDoctor(body));
    return updateDb((db) => {
      const me = currentMe(db);
      if (me.kind !== 'ORGANIZATION') fail(403, 'FORBIDDEN', 'Only organizations can list doctors.');
      me.doctors = [...(me.doctors ?? []), { id: newId(), ...input }];
      return { entity: selfView(me) };
    });
  },
  removeDoctor(doctorId) {
    return updateDb((db) => {
      const me = currentMe(db);
      me.doctors = (me.doctors ?? []).filter((d) => d.id !== doctorId);
      return { entity: selfView(me) };
    });
  },
};

export { validatePassword };
