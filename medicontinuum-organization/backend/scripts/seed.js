// Demo data so the patient site isn't empty. Safe to re-run: it skips if data exists.
import { config } from '../src/config.js';
import { Store } from '../src/lib/store.js';
import { activateAccount, registerEntity } from '../src/services/entities.js';
import { createShare } from '../src/services/shares.js';
import { registerSchema } from '../src/schemas.js';

const store = new Store(config.dataFile);
if (store.data.entities.length) {
  console.log('Data already present — skipping seed.');
  process.exit(0);
}

const PASSWORD = 'Demo@1234';
const loc = (city, state, postalCode) => ({ city, state, postalCode, country: 'India' });
const org = (name, orgType, n, pan, city, state, pin) => ({
  kind: 'ORGANIZATION', name, orgType, licenseNumber: `WB/${orgType.slice(0, 3)}/2021/${n}`,
  govIdType: 'PAN', govIdNumber: pan, contactPerson: 'Admin Desk', address: `${n} Main Road`,
  email: `admin${n}@example.org`, phone: `+9133${String(2000000 + Number(n)).slice(-8)}`, ...loc(city, state, pin),
});

const inputs = [
  org('Eastern Care Hospital', 'HOSPITAL', '1001', 'ABCDE1001F', 'Kolkata', 'West Bengal', '700020'),
  org('Salt Lake Multispeciality Hospital', 'HOSPITAL', '1002', 'ABCDE1002F', 'Kolkata', 'West Bengal', '700091'),
  org('LifeLine Blood Bank', 'BLOOD_BANK', '1003', 'ABCDE1003F', 'Howrah', 'West Bengal', '711101'),
  org('GreenCross Pharmacy', 'PHARMACY', '1004', 'ABCDE1004F', 'Kolkata', 'West Bengal', '700019'),
  org('Sunrise Diagnostics', 'DIAGNOSTIC_LAB', '1005', 'ABCDE1005F', 'Siliguri', 'West Bengal', '734001'),
  {
    kind: 'DOCTOR', name: 'Dr. Ananya Sen', doctorRegNumber: 'WBMC-45821', council: 'West Bengal Medical Council',
    specialization: 'Cardiology', email: 'ananya.sen@example.org', phone: '+919830000001', ...loc('Kolkata', 'West Bengal', '700025'),
  },
  {
    kind: 'DOCTOR', name: 'Dr. Rohit Mehra', doctorRegNumber: 'MMC-77310', council: 'Maharashtra Medical Council',
    specialization: 'Neurology', email: 'rohit.mehra@example.org', phone: '+919820000002', ...loc('Mumbai', 'Maharashtra', '400001'),
  },
];

const created = [];
for (const raw of inputs) {
  const entity = registerEntity(store, registerSchema.parse(raw));
  await activateAccount(store, { orgNumber: entity.orgNumber, email: entity.email, password: PASSWORD });
  created.push(entity);
}

const [eastern, saltlake, bloodBank] = created;
createShare(store, bloodBank, { direction: 'OFFER', resourceType: 'BLOOD', urgency: 'ROUTINE', quantity: 12, notes: 'Screened units available this week.', details: { bloodGroup: 'O+', component: 'RBC' } });
createShare(store, eastern, { direction: 'REQUEST', resourceType: 'DOCTOR', urgency: 'URGENT', quantity: 1, notes: 'Cover for 3 OT days.', details: { specialization: 'Cardiology', durationHours: 72 } });
createShare(store, saltlake, { direction: 'REQUEST', resourceType: 'BLOOD', urgency: 'CRITICAL', quantity: 4, notes: 'Trauma case.', details: { bloodGroup: 'B-', component: 'WHOLE_BLOOD' } });

console.log('\nSeeded demo accounts (password for all: %s)\n', PASSWORD);
for (const e of created) console.log(`  ${e.orgNumber}  ${e.name}`);
console.log('');
