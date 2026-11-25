import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { Store } from '../src/lib/store.js';
import { config } from '../src/config.js';
import { isValidOrgNumber } from '../src/lib/crypto.js';

let server, base, file;
const PW = 'Strong@123';

before(async () => {
  file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mc-')), 'db.json');
  const app = createApp({ store: new Store(file), config });
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const call = async (method, url, body, token) => {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
};

const orgBody = (n, extra = {}) => ({
  kind: 'ORGANIZATION', name: `Org ${n}`, orgType: 'HOSPITAL', licenseNumber: `LIC-${String(n).padStart(4, "0")}`,
  govIdType: 'PAN', govIdNumber: `ABCDE${String(n).padStart(4, "0")}F`, contactPerson: 'Admin', address: '1 Park Street',
  email: `org${n}@example.com`, phone: '+913322334455', city: 'Kolkata', state: 'West Bengal', postalCode: '700016', ...extra,
});

async function onboard(body) {
  const reg = await call('POST', '/api/auth/register', body);
  assert.equal(reg.status, 201, JSON.stringify(reg.body));
  const su = await call('POST', '/api/auth/signup', { orgNumber: reg.body.orgNumber, email: body.email, password: PW });
  assert.equal(su.status, 201, JSON.stringify(su.body));
  return { number: reg.body.orgNumber, token: su.body.token, publicId: su.body.entity.publicId };
}

test('registration issues a unique, Luhn-valid 16-digit number', async () => {
  const a = await call('POST', '/api/auth/register', orgBody(1));
  const b = await call('POST', '/api/auth/register', orgBody(2));
  assert.equal(a.status, 201);
  assert.match(a.body.orgNumber, /^[1-9]\d{15}$/);
  assert.ok(isValidOrgNumber(a.body.orgNumber));
  assert.notEqual(a.body.orgNumber, b.body.orgNumber);
});

test('duplicate licence / government ID / email are rejected', async () => {
  assert.equal((await call('POST', '/api/auth/register', orgBody(1))).status, 409);
  assert.equal((await call('POST', '/api/auth/register', orgBody(9, { licenseNumber: 'LIC-0001' }))).status, 409);
  assert.equal((await call('POST', '/api/auth/register', orgBody(9, { govIdNumber: 'ABCDE0001F' }))).status, 409);
});

test('invalid government ID format is rejected with a field error', async () => {
  const res = await call('POST', '/api/auth/register', orgBody(8, { govIdNumber: '123' }));
  assert.equal(res.status, 400);
  assert.ok(res.body.error.fields.govIdNumber);
});

test('individual doctors register with a doctor ID only', async () => {
  const res = await call('POST', '/api/auth/register', {
    kind: 'DOCTOR', name: 'Dr. Test', doctorRegNumber: 'WBMC-1234', council: 'West Bengal Medical Council',
    specialization: 'Cardiology', email: 'dr.test@example.com', phone: '9830012345', city: 'Kolkata', state: 'West Bengal', postalCode: '700001',
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.kind, 'DOCTOR');
});

test('signup needs number + matching email; login blocked before signup', async () => {
  const reg = await call('POST', '/api/auth/register', orgBody(3));
  const num = reg.body.orgNumber;
  assert.equal((await call('POST', '/api/auth/login', { orgNumber: num, password: PW })).status, 401);
  assert.equal((await call('POST', '/api/auth/signup', { orgNumber: num, email: 'wrong@example.com', password: PW })).status, 400);
  assert.equal((await call('POST', '/api/auth/signup', { orgNumber: num, email: 'org3@example.com', password: 'weak' })).status, 400);
  assert.equal((await call('POST', '/api/auth/signup', { orgNumber: num, email: 'org3@example.com', password: PW })).status, 201);
  assert.equal((await call('POST', '/api/auth/signup', { orgNumber: num, email: 'org3@example.com', password: PW })).status, 409);
  const login = await call('POST', '/api/auth/login', { orgNumber: num, password: PW });
  assert.equal(login.status, 200);
  assert.equal((await call('GET', '/api/auth/me', null, login.body.token)).status, 200);
});

test('login locks after repeated failures', async () => {
  const { number } = await onboard(orgBody(4));
  for (let i = 0; i < 5; i += 1) await call('POST', '/api/auth/login', { orgNumber: number, password: 'Wrong@1234' });
  const res = await call('POST', '/api/auth/login', { orgNumber: number, password: PW });
  assert.equal(res.status, 429);
});

test('public list: only activated entities, nothing sensitive', async () => {
  const pending = await call('POST', '/api/auth/register', orgBody(5, { name: 'Pending Only Org' }));
  const res = await call('GET', '/api/public/organizations');
  assert.equal(res.status, 200);
  const raw = JSON.stringify(res.body);
  assert.ok(!raw.includes('Pending Only Org'), 'unactivated org must not be public');
  assert.ok(res.body.items.length >= 2);
  assert.ok(!raw.includes(pending.body.orgNumber));
  for (const item of res.body.items) {
    assert.ok(!('orgNumber' in item) && !('passwordHash' in item) && !('email' in item) && !('govIdMasked' in item));
    assert.match(item.numberHint, /^•••• •••• •••• \d{4}$/);
  }
  const stats = await call('GET', '/api/public/stats');
  assert.equal(stats.body.total, res.body.total);
});

test('protected routes need a token', async () => {
  assert.equal((await call('GET', '/api/shares')).status, 401);
  assert.equal((await call('GET', '/api/network/organizations')).status, 401);
});

test('sharing: broadcast blood request → accept → contact released → fulfil', async () => {
  const a = await onboard(orgBody(10));
  const b = await onboard(orgBody(11, { orgType: 'BLOOD_BANK' }));
  const c = await onboard(orgBody(12));

  const created = await call('POST', '/api/shares', {
    direction: 'REQUEST', resourceType: 'BLOOD', urgency: 'CRITICAL', quantity: 3,
    details: { bloodGroup: 'O-', component: 'RBC' },
  }, a.token);
  assert.equal(created.status, 201);
  const id = created.body.id;

  // visible to others, not to its owner's incoming
  assert.ok((await call('GET', '/api/shares?scope=incoming', null, b.token)).body.items.some((s) => s.id === id));
  assert.ok(!(await call('GET', '/api/shares?scope=incoming', null, a.token)).body.items.some((s) => s.id === id));
  // contact hidden before acceptance
  assert.equal((await call('GET', `/api/shares/${id}`, null, b.token)).body.counterpart, null);
  // owner cannot respond to own post
  assert.equal((await call('POST', `/api/shares/${id}/respond`, { action: 'ACCEPT' }, a.token)).status, 403);

  // c declines (broadcast → only hidden for c)
  assert.equal((await call('POST', `/api/shares/${id}/respond`, { action: 'DECLINE' }, c.token)).status, 200);
  assert.ok(!(await call('GET', '/api/shares?scope=incoming', null, c.token)).body.items.some((s) => s.id === id));

  const accepted = await call('POST', `/api/shares/${id}/respond`, { action: 'ACCEPT', message: 'On our way' }, b.token);
  assert.equal(accepted.body.status, 'ACCEPTED');
  assert.equal(accepted.body.counterpart.email, 'org10@example.com');
  const ownerView = await call('GET', `/api/shares/${id}`, null, a.token);
  assert.equal(ownerView.body.counterpart.email, 'org11@example.com');
  assert.equal(ownerView.body.canFulfil, true);
  // a late responder can no longer see the post at all
  assert.equal((await call('POST', `/api/shares/${id}/respond`, { action: 'ACCEPT' }, c.token)).status, 404);

  assert.equal((await call('POST', `/api/shares/${id}/fulfil`, null, b.token)).status, 403);
  assert.equal((await call('POST', `/api/shares/${id}/fulfil`, null, a.token)).body.status, 'FULFILLED');
  const sum = await call('GET', '/api/shares/summary', null, a.token);
  assert.equal(sum.body.myFulfilled, 1);
});

test('sharing: directed posts are private to the target', async () => {
  const a = await onboard(orgBody(20));
  const b = await onboard(orgBody(21));
  const c = await onboard(orgBody(22));
  const created = await call('POST', '/api/shares', {
    direction: 'OFFER', resourceType: 'DOCTOR', details: { specialization: 'Radiology', durationHours: 48 }, targetPublicId: b.publicId,
  }, a.token);
  assert.equal(created.status, 201);
  assert.equal((await call('GET', `/api/shares/${created.body.id}`, null, c.token)).status, 404);
  assert.equal((await call('GET', `/api/shares/${created.body.id}`, null, b.token)).status, 200);
  const declined = await call('POST', `/api/shares/${created.body.id}/respond`, { action: 'DECLINE', message: 'Not needed' }, b.token);
  assert.equal(declined.body.status, 'DECLINED');
});

test('sharing: organ posts restricted to hospitals; payload validated', async () => {
  const hospital = await onboard(orgBody(30));
  const pharmacy = await onboard(orgBody(31, { orgType: 'PHARMACY' }));
  const body = { direction: 'REQUEST', resourceType: 'ORGAN', urgency: 'URGENT', details: { organ: 'KIDNEY', bloodGroup: 'A+' } };
  assert.equal((await call('POST', '/api/shares', body, pharmacy.token)).status, 403);
  assert.equal((await call('POST', '/api/shares', body, hospital.token)).status, 201);
  const bad = await call('POST', '/api/shares', { direction: 'REQUEST', resourceType: 'BLOOD', details: { bloodGroup: 'Z+' } }, hospital.token);
  assert.equal(bad.status, 400);
  assert.ok(bad.body.error.fields['details.bloodGroup']);
});

test('network directory lists others, excludes self, no contact details', async () => {
  const a = await onboard(orgBody(40));
  const res = await call('GET', '/api/network/organizations', null, a.token);
  assert.equal(res.status, 200);
  assert.ok(res.body.items.length > 0);
  assert.ok(!res.body.items.some((i) => i.publicId === a.publicId));
  assert.ok(res.body.items.every((i) => !('email' in i) && !('phone' in i)));
});
