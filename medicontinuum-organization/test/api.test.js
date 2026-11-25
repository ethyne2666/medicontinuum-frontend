import { beforeEach, describe, expect, it } from 'vitest';
import { api, tokenStore } from '@/api/client';
import { isValidOrgNumber } from '@shared/crypto.js';
import { DEMO_PASSWORD } from '@shared/seed.js';

const org = (n = 1, over = {}) => ({
  kind: 'ORGANIZATION', name: `Test Hospital ${n}`, orgType: 'HOSPITAL', licenseNumber: `WB/HOS/2024/${n}000`,
  govIdType: 'PAN', govIdNumber: `ZZZZZ${String(n).padStart(4, '0')}Z`, contactPerson: 'Admin', address: '12 Test Road',
  email: `t${n}@example.org`, phone: '+919800000000', city: 'Kalyani', state: 'West Bengal', postalCode: '741235', country: 'India', ...over,
});
const doctor = (n = 1) => ({
  kind: 'DOCTOR', name: `Dr. Test ${n}`, doctorRegNumber: `WBMC-9${n}00`, council: 'West Bengal Medical Council',
  specialization: 'Cardiology', email: `doc${n}@example.org`, phone: '+919800000001', city: 'Kalyani', state: 'West Bengal', postalCode: '741235',
});

async function onboard(input, password = 'Passw0rd!') {
  const reg = await api.register(input);
  const session = await api.signup({ orgNumber: reg.orgNumber, email: input.email, password });
  return { reg, session, password };
}

beforeEach(() => { localStorage.clear(); });

describe('registration & login', () => {
  it('issues a unique, Luhn-valid 16-digit number', async () => {
    const a = await api.register(org(1));
    const b = await api.register(org(2));
    expect(a.orgNumber).toMatch(/^\d{16}$/);
    expect(isValidOrgNumber(a.orgNumber)).toBe(true);
    expect(a.orgNumber).not.toBe(b.orgNumber);
  });

  it('registers an individual doctor with a doctor ID', async () => {
    const r = await api.register(doctor(1));
    expect(r.kind).toBe('DOCTOR');
    expect(isValidOrgNumber(r.orgNumber)).toBe(true);
  });

  it('rejects invalid government IDs and reports field errors', async () => {
    await expect(api.register(org(3, { govIdNumber: 'not-a-pan' }))).rejects.toMatchObject({ status: 400, fields: { govIdNumber: expect.any(String) } });
  });

  it('rejects duplicate licence, government ID and e-mail', async () => {
    await api.register(org(4));
    await expect(api.register(org(5, { licenseNumber: 'WB/HOS/2024/4000' }))).rejects.toMatchObject({ status: 409, fields: { licenseNumber: expect.any(String) } });
    await expect(api.register(org(6, { govIdNumber: 'ZZZZZ0004Z' }))).rejects.toMatchObject({ status: 409, fields: { govIdNumber: expect.any(String) } });
    await expect(api.register(org(7, { email: 't4@example.org' }))).rejects.toMatchObject({ status: 409, fields: { email: expect.any(String) } });
  });

  it('signup needs the number AND the registered email, and only works once', async () => {
    const reg = await api.register(org(8));
    await expect(api.signup({ orgNumber: reg.orgNumber, email: 'other@example.org', password: 'Passw0rd!' })).rejects.toMatchObject({ code: 'MISMATCH' });
    await expect(api.signup({ orgNumber: '1234567812345678', email: 't8@example.org', password: 'Passw0rd!' })).rejects.toMatchObject({ code: 'MISMATCH' });
    await expect(api.signup({ orgNumber: reg.orgNumber, email: 't8@example.org', password: 'short' })).rejects.toMatchObject({ status: 400 });
    const ok = await api.signup({ orgNumber: reg.orgNumber, email: 't8@example.org', password: 'Passw0rd!' });
    expect(ok.entity.status).toBe('ACTIVE');
    expect(ok.entity.passwordHash).toBeUndefined();
    await expect(api.signup({ orgNumber: reg.orgNumber, email: 't8@example.org', password: 'Passw0rd!' })).rejects.toMatchObject({ code: 'ALREADY_ACTIVE' });
  });

  it('cannot log in before signup, or with a wrong password; locks after 5 failures', async () => {
    const reg = await api.register(org(9));
    await expect(api.login({ orgNumber: reg.orgNumber, password: 'Passw0rd!' })).rejects.toMatchObject({ status: 401 });
    await api.signup({ orgNumber: reg.orgNumber, email: 't9@example.org', password: 'Passw0rd!' });
    // the failed attempt above already counted as #1, so four more reach the limit of five
    for (let i = 0; i < 4; i += 1) await expect(api.login({ orgNumber: reg.orgNumber, password: 'wrong-pass1' })).rejects.toMatchObject({ status: 401 });
    await expect(api.login({ orgNumber: reg.orgNumber, password: 'Passw0rd!' })).rejects.toMatchObject({ status: 429 });
  });

  it('logs in with number + password (spaces allowed in the number)', async () => {
    const { reg } = await onboard(org(10));
    const res = await api.login({ orgNumber: reg.orgNumber.replace(/(\d{4})/g, '$1 '), password: 'Passw0rd!' });
    expect(res.entity.name).toBe('Test Hospital 10');
  });

  it('seeded Kalyani demo accounts can log in', async () => {
    const dir = await api.publicDirectory();
    expect(dir.some((e) => e.name === 'AIIMS Kalyani')).toBe(true);
    expect(dir.every((e) => e.city === 'Kalyani')).toBe(true);
    expect(JSON.stringify(dir)).not.toMatch(/passwordHash|licenseFp|govIdFp|admin\./); // nothing private is public
    const res = await api.login({ orgNumber: '5011000000000014', password: DEMO_PASSWORD });
    expect(res.entity.name).toBe('AIIMS Kalyani');
  });

  it('only active members appear in the public directory', async () => {
    const before = (await api.publicDirectory()).length;
    const reg = await api.register(org(11));
    expect((await api.publicDirectory()).length).toBe(before); // registered, not yet signed up
    await api.signup({ orgNumber: reg.orgNumber, email: 't11@example.org', password: 'Passw0rd!' });
    expect((await api.publicDirectory()).length).toBe(before + 1);
  });
});

describe('resource sharing', () => {
  const as = async (input) => { const { session } = await onboard(input); tokenStore.set(session.token); return session.entity; };
  const blood = { direction: 'REQUEST', resourceType: 'BLOOD', urgency: 'URGENT', quantity: 2, details: { bloodGroup: 'O+', component: 'RBC' } };

  it('broadcast post → other org accepts → contact details are released to both sides', async () => {
    const a = await as(org(20));
    const post = await api.createShare(blood);
    expect(post.counterpart).toBeNull();

    const b = await as(org(21));
    const incoming = await api.shares({ scope: 'incoming' });
    const seen = incoming.items.find((s) => s.id === post.id);
    expect(seen.counterpart).toBeNull(); // no contact before acceptance
    const accepted = await api.respond(post.id, { action: 'ACCEPT', message: 'On our way' });
    expect(accepted.counterpart.email).toBe('t20@example.org');

    tokenStore.set(a.id);
    const mine = (await api.shares({ scope: 'mine' })).items.find((s) => s.id === post.id);
    expect(mine.status).toBe('ACCEPTED');
    expect(mine.counterpart.email).toBe(b.email);
    expect((await api.fulfil(post.id)).status).toBe('FULFILLED');
  });

  it('a post addressed to one organization is invisible to everyone else', async () => {
    const a = await as(org(22));
    const b = await as(org(23));
    const c = await as(org(24));
    tokenStore.set(a.id);
    const post = await api.createShare({ ...blood, targetPublicId: b.publicId });
    tokenStore.set(c.id);
    expect((await api.shares({ scope: 'incoming' })).items.some((s) => s.id === post.id)).toBe(false);
    await expect(api.respond(post.id, { action: 'ACCEPT' })).rejects.toMatchObject({ status: 404 });
    tokenStore.set(b.id);
    expect((await api.shares({ scope: 'incoming' })).items.some((s) => s.id === post.id)).toBe(true);
    expect((await api.respond(post.id, { action: 'DECLINE', message: 'No stock' })).status).toBe('DECLINED');
  });

  it('only hospitals may post organs; owners cannot answer their own posts', async () => {
    await as(org(25, { orgType: 'CLINIC' }));
    await expect(api.createShare({ direction: 'OFFER', resourceType: 'ORGAN', details: { organ: 'KIDNEY' } })).rejects.toMatchObject({ status: 403 });
    const own = await api.createShare(blood);
    await expect(api.respond(own.id, { action: 'ACCEPT' })).rejects.toMatchObject({ status: 403 });
  });

  it('requires login', async () => {
    tokenStore.clear();
    await expect(api.shares({})).rejects.toMatchObject({ status: 401 });
  });

  it('organizations can list doctors, which become public', async () => {
    const me = await as(org(26));
    await api.addDoctor({ name: 'Dr. Listed', specialization: 'ENT' });
    const pub = (await api.publicDirectory()).find((e) => e.publicId === me.publicId);
    expect(pub.doctors.map((d) => d.name)).toEqual(['Dr. Listed']);
    await api.removeDoctor(pub.doctors[0].id);
    expect((await api.publicDirectory()).find((e) => e.publicId === me.publicId).doctors).toEqual([]);
  });
});
