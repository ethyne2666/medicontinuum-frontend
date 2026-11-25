// Sample data so both apps are populated on first run. Both apps build the SAME seed (fixed ids/numbers),
// so whichever opens first can write it and the other simply reads it.
//
// ⚠ SAMPLE DATA: institution names in Kalyani are real places used for demonstration; licences, contact
// numbers, e-mails and every doctor listed below are made-up placeholders. Replace before any public use.
import { fingerprint, hashPassword, maskTail, withCheckDigit } from './crypto.js';

export const DEMO_PASSWORD = 'Demo@1234';
const WHEN = '2026-01-15T09:00:00.000Z';
const KALYANI = { city: 'Kalyani', state: 'West Bengal', country: 'India' };

// 15-digit payloads → the Luhn check digit is appended, giving valid 16-digit numbers.
const ORGS = [
  { key: 'aiims', payload: '501100000000001', name: 'AIIMS Kalyani', orgType: 'HOSPITAL', lic: 'WB/HOS/2019/0001', pan: 'AAAAA0001A',
    address: 'Basantapur, Kalyani, Nadia', postalCode: '741245', phone: '+919000000001',
    doctors: [['Dr. Rina Chatterjee', 'Cardiology'], ['Dr. Kaushik Dutta', 'Neurology'], ['Dr. Payel Mondal', 'Gynaecology']] },
  { key: 'jnm', payload: '501100000000002', name: 'JNM Hospital Kalyani', orgType: 'HOSPITAL', lic: 'WB/HOS/2015/0002', pan: 'AAAAA0002A',
    address: 'Kalyani, Nadia', postalCode: '741235', phone: '+919000000002',
    doctors: [['Dr. Subrata Sarkar', 'General Surgery'], ['Dr. Anindita Paul', 'Paediatrics'], ['Dr. Debasish Mukherjee', 'Orthopaedics']] },
  { key: 'blood', payload: '501100000000003', name: 'Nadia Lifeline Blood Bank', orgType: 'BLOOD_BANK', lic: 'WB/BLB/2018/0003', pan: 'AAAAA0003A',
    address: 'Block A, Kalyani', postalCode: '741235', phone: '+919000000003', doctors: [['Dr. Tanmoy Biswas', 'Transfusion Medicine']] },
  { key: 'pharma', payload: '501100000000004', name: 'Kalyani Care Pharmacy', orgType: 'PHARMACY', lic: 'WB/PHA/2020/0004', pan: 'AAAAA0004A',
    address: 'Central Park Road, Kalyani', postalCode: '741235', phone: '+919000000004', doctors: [] },
  { key: 'lab', payload: '501100000000005', name: 'Kalyani Diagnostics Centre', orgType: 'DIAGNOSTIC_LAB', lic: 'WB/LAB/2021/0005', pan: 'AAAAA0005A',
    address: 'Block B, Kalyani', postalCode: '741235', phone: '+919000000005', doctors: [['Dr. Moumita Saha', 'Pathology']] },
  { key: 'clinic', payload: '501100000000006', name: 'Kalyani Family Clinic', orgType: 'CLINIC', lic: 'WB/CLI/2022/0006', pan: 'AAAAA0006A',
    address: 'Gayespur Road, Kalyani', postalCode: '741234', phone: '+919000000006',
    doctors: [['Dr. Soumya Banerjee', 'General Medicine'], ['Dr. Ishita Ghosh', 'Dermatology']] },
];

const DOCTORS = [
  { key: 'd1', payload: '501100000000011', name: 'Dr. Arindam Ghosh', reg: 'WBMC-61001', specialization: 'Cardiology', postalCode: '741235' },
  { key: 'd2', payload: '501100000000012', name: 'Dr. Mitali Das', reg: 'WBMC-61002', specialization: 'Paediatrics', postalCode: '741235' },
  { key: 'd3', payload: '501100000000013', name: 'Dr. Sandip Roy', reg: 'WBMC-61003', specialization: 'Orthopaedics', postalCode: '741234' },
  { key: 'd4', payload: '501100000000014', name: 'Dr. Nilanjana Sen', reg: 'WBMC-61004', specialization: 'Gynaecology', postalCode: '741245' },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');

export async function buildSeed() {
  const entities = [];
  let n = 0;

  for (const o of ORGS) {
    n += 1;
    const orgNumber = withCheckDigit(o.payload);
    entities.push({
      id: `seed-${o.key}`, publicId: `MC-KLY${String(n).padStart(4, '0')}`, orgNumber, kind: 'ORGANIZATION', orgType: o.orgType,
      name: o.name, contactPerson: 'Admin Desk', specialization: null, licenseNumber: o.lic,
      govIdType: 'PAN', govIdMasked: maskTail(o.pan), doctorRegNumber: null, council: null,
      address: o.address, email: `admin.${o.key}@example.org`, phone: o.phone, ...KALYANI, postalCode: o.postalCode,
      licenseFp: await fingerprint('LICENSE', o.lic), govIdFp: await fingerprint('PAN', o.pan), doctorIdFp: null,
      doctors: o.doctors.map(([name, specialization], i) => ({ id: `${o.key}-doc${i + 1}`, name, specialization })),
      status: 'ACTIVE', passwordHash: await hashPassword(orgNumber, DEMO_PASSWORD),
      sample: true, createdAt: WHEN, activatedAt: WHEN,
    });
  }

  for (const d of DOCTORS) {
    n += 1;
    const orgNumber = withCheckDigit(d.payload);
    entities.push({
      id: `seed-${d.key}`, publicId: `MC-KLY${String(n).padStart(4, '0')}`, orgNumber, kind: 'DOCTOR', orgType: null,
      name: d.name, contactPerson: d.name, specialization: d.specialization, licenseNumber: null, govIdType: null, govIdMasked: null,
      doctorRegNumber: d.reg, council: 'West Bengal Medical Council', address: null,
      email: `${slug(d.name)}@example.org`, phone: `+9190000001${String(n).padStart(2, '0')}`, ...KALYANI, postalCode: d.postalCode,
      licenseFp: null, govIdFp: null, doctorIdFp: await fingerprint('DOCTOR', `West Bengal Medical Council:${d.reg}`),
      doctors: [], status: 'ACTIVE', passwordHash: await hashPassword(orgNumber, DEMO_PASSWORD),
      sample: true, createdAt: WHEN, activatedAt: WHEN,
    });
  }

  const by = Object.fromEntries(entities.map((e) => [e.id, e]));
  const share = (id, owner, extra) => ({
    id: `seed-share-${id}`, urgency: 'ROUTINE', quantity: 1, notes: '', neededBy: null, targetId: null, status: 'OPEN',
    responderId: null, responseMessage: '', declinedBy: [], createdAt: WHEN, updatedAt: WHEN, ownerId: by[owner].id, ...extra,
  });

  const shares = [
    share(1, 'seed-blood', { direction: 'OFFER', resourceType: 'BLOOD', quantity: 12, notes: 'Screened units available this week.', details: { bloodGroup: 'O+', component: 'RBC' } }),
    share(2, 'seed-jnm', { direction: 'REQUEST', resourceType: 'DOCTOR', urgency: 'URGENT', notes: 'Cover for 3 OT days.', details: { specialization: 'Cardiology', durationHours: 72 } }),
    share(3, 'seed-aiims', { direction: 'REQUEST', resourceType: 'BLOOD', urgency: 'CRITICAL', quantity: 4, notes: 'Trauma case.', details: { bloodGroup: 'B-', component: 'WHOLE_BLOOD' } }),
    share(4, 'seed-pharma', { direction: 'OFFER', resourceType: 'MEDICINE', quantity: 200, notes: 'Surplus strips, 8+ months to expiry.', details: { item: 'Paracetamol 500 mg' } }),
  ];

  return { rev: 1, entities, shares };
}
