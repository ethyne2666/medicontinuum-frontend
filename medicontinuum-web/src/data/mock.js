// Demo data for the patient site. (The original file in the repo only exported IMG/avatar, which broke every
// page that imports DOSES, MEDICINES, INVENTORY …; this restores the full set.)
// Illustrations are inline SVG; the patient home hero uses a local public image.

// ---------- art ----------
const svgUri = (inner, a, b) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500' preserveAspectRatio='xMidYMid slice'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs>` +
    `<rect width='800' height='500' fill='url(#g)'/>${inner}</svg>`,
  )}`;

const circles = (list) => list.map(([x, y, r, o]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='white' fill-opacity='${o}'/>`).join('');
const capsule = (x, y, rot, c1, c2) =>
  `<g transform='translate(${x} ${y}) rotate(${rot})'><rect x='-70' y='-26' width='70' height='52' rx='26' fill='${c1}'/><rect x='0' y='-26' width='70' height='52' rx='26' fill='${c2}'/></g>`;
const cross = (x, y, s, o) =>
  `<g fill='white' fill-opacity='${o}'><rect x='${x - s / 6}' y='${y - s / 2}' width='${s / 3}' height='${s}' rx='${s / 10}'/><rect x='${x - s / 2}' y='${y - s / 6}' width='${s}' height='${s / 3}' rx='${s / 10}'/></g>`;

export const IMG = {
  hero: '/medicine-hero.png',
  auth: svgUri(circles([[200, 120, 200, 0.1], [650, 400, 220, 0.1]]) + cross(400, 250, 170, 0.8), '#115e59', '#0e7490'),
  family: '/family-photo.png',
  pills: svgUri(capsule(250, 200, -25, '#fb7185', '#fff') + capsule(520, 280, 30, '#38bdf8', '#fff') + capsule(330, 380, 10, '#fbbf24', '#fff') + circles([[600, 110, 70, 0.7], [140, 380, 50, 0.6]]), '#134e4a', '#0f766e'),
  vendor: svgUri(cross(400, 240, 200, 0.9) + circles([[110, 90, 80, 0.12], [700, 420, 120, 0.12]]), '#0369a1', '#38bdf8'),
};

const medArt = (c1, c2) => svgUri(capsule(300, 250, -20, c1, '#fff') + capsule(500, 240, 25, c2, '#fff') + circles([[120, 90, 70, 0.15], [690, 410, 90, 0.15]]), '#f0fdfa', '#e0f2fe');

const PALETTE = ['#0f766e', '#4f46e5', '#0369a1', '#b45309', '#be185d', '#475569', '#15803d', '#7c3aed'];
const hash = (v) => [...String(v)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Offline avatar: initials for names, a neutral silhouette for numeric seeds. */
export function avatar(seed = 'User') {
  const color = PALETTE[hash(seed) % PALETTE.length];
  const label = typeof seed === 'string'
    ? seed.replace(/^Dr\.?\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '';
  const inner = label
    ? `<text x='48' y='60' text-anchor='middle' font-family='system-ui,sans-serif' font-size='38' font-weight='600' fill='white'>${label}</text>`
    : `<circle cx='48' cy='38' r='16' fill='white' fill-opacity='.9'/><path d='M16 88c4-22 18-30 32-30s28 8 32 30z' fill='white' fill-opacity='.9'/>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='${color}'/>${inner}</svg>`)}`;
}

// ---------- enums ----------
export const BLOOD_GROUPS = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'];
export const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
export const DOSAGE_UNITS = ['TABLET', 'CAPSULE', 'ML', 'DROP', 'PUFF'];
export const FREQUENCIES = ['ONCE_DAILY', 'TWICE_DAILY', 'THRICE_DAILY', 'WEEKLY', 'AS_NEEDED'];
export const RELATIONSHIPS = ['PARENT', 'CHILD', 'SPOUSE', 'SIBLING', 'GUARDIAN', 'OTHER'];

// ---------- people ----------
export const USER = { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', avatar: avatar('Aarav Sharma'), globalUserId: '7391058264130952' };

export const PROFILE = {
  dateOfBirth: '1990-04-12', gender: 'MALE', bloodGroup: 'O_POSITIVE', postalCode: '741235',
  addressLine: 'Block B, Kalyani', city: 'Kalyani', state: 'West Bengal', country: 'India',
  emergencyContactName: 'Meera Sharma', emergencyContactPhone: '+91 90000 00010',
};

// ---------- medicines ----------
export const MEDICINES = [
  { id: 'm1', name: 'Paracetamol', generic: 'Acetaminophen', strength: '500 mg', category: 'Pain & fever', status: 'ACTIVE', image: medArt('#fb7185', '#f97316') },
  { id: 'm2', name: 'Metformin', generic: 'Metformin HCl', strength: '500 mg', category: 'Diabetes', status: 'ACTIVE', image: medArt('#38bdf8', '#6366f1') },
  { id: 'm3', name: 'Amlodipine', generic: 'Amlodipine besylate', strength: '5 mg', category: 'Blood pressure', status: 'ACTIVE', image: medArt('#34d399', '#0ea5e9') },
  { id: 'm4', name: 'Atorvastatin', generic: 'Atorvastatin calcium', strength: '10 mg', category: 'Cholesterol', status: 'ACTIVE', image: medArt('#a78bfa', '#f472b6') },
  { id: 'm5', name: 'Cetirizine', generic: 'Cetirizine HCl', strength: '10 mg', category: 'Allergy', status: 'ACTIVE', image: medArt('#fbbf24', '#34d399') },
  { id: 'm6', name: 'Pantoprazole', generic: 'Pantoprazole sodium', strength: '40 mg', category: 'Acidity', status: 'ACTIVE', image: medArt('#f472b6', '#fb923c') },
  { id: 'm7', name: 'Vitamin D3', generic: 'Cholecalciferol', strength: '60000 IU', category: 'Supplement', status: 'ACTIVE', image: medArt('#facc15', '#f97316') },
  { id: 'm8', name: 'Azithromycin', generic: 'Azithromycin', strength: '500 mg', category: 'Antibiotic', status: 'INACTIVE', image: medArt('#60a5fa', '#a78bfa') },
];

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

export const INVENTORY = [
  { id: 'i1', medicine: 'Paracetamol', batchNumber: 'PCM-2411', expiryDate: day(240), quantity: 18, stockUnit: 'TABLET', lowStockThreshold: 10, notes: 'Strip of 10 + 8' },
  { id: 'i2', medicine: 'Metformin', batchNumber: 'MET-2309', expiryDate: day(180), quantity: 9, stockUnit: 'TABLET', lowStockThreshold: 10, notes: 'Refill soon' },
  { id: 'i3', medicine: 'Amlodipine', batchNumber: 'AML-2402', expiryDate: day(300), quantity: 28, stockUnit: 'TABLET', lowStockThreshold: 10, notes: '' },
  { id: 'i4', medicine: 'Atorvastatin', batchNumber: 'ATV-2306', expiryDate: day(20), quantity: 24, stockUnit: 'TABLET', lowStockThreshold: 10, notes: 'Expires soon — use first' },
  { id: 'i5', medicine: 'Cetirizine', batchNumber: 'CET-2501', expiryDate: day(400), quantity: 6, stockUnit: 'TABLET', lowStockThreshold: 8, notes: '' },
  { id: 'i6', medicine: 'Vitamin D3', batchNumber: 'VD3-2410', expiryDate: day(90), quantity: 7, stockUnit: 'CAPSULE', lowStockThreshold: 4, notes: 'Weekly' },
  { id: 'i7', medicine: 'Pantoprazole', batchNumber: 'PAN-2404', expiryDate: day(150), quantity: 14, stockUnit: 'TABLET', lowStockThreshold: 7, notes: '' },
];

// ---------- today's schedule ----------
export const DOSES = [
  { id: 'd1', medicine: 'Amlodipine', time: '08:00', dose: '1 tablet', status: 'TAKEN' },
  { id: 'd2', medicine: 'Metformin', time: '08:30', dose: '1 tablet', status: 'PENDING' },
  { id: 'd3', medicine: 'Vitamin D3', time: '13:00', dose: '1 capsule', status: 'PENDING' },
  { id: 'd4', medicine: 'Paracetamol', time: '14:00', dose: '1 tablet', status: 'PENDING' },
  { id: 'd5', medicine: 'Atorvastatin', time: '21:00', dose: '1 tablet', status: 'PENDING' },
  { id: 'd6', medicine: 'Metformin', time: '21:00', dose: '1 tablet', status: 'PENDING' },
];

const dayName = (offset) => new Date(Date.now() + offset * 86400000).toLocaleDateString('en-IN', { weekday: 'short' });
export const WEEK = [88, 100, 92, 75, 100, 83, 94].map((percent, i) => ({ day: dayName(i - 6), percent }));

// ---------- prescriptions ----------
export const PRESCRIPTIONS = [
  {
    id: 'rx1', doctor: 'Dr. Arindam Ghosh', avatar: avatar('Dr. Arindam Ghosh'), date: day(-30), status: 'ACTIVE', notes: 'Review blood pressure in 8 weeks.',
    items: [
      { medicine: 'Amlodipine', dosageAmount: 1, dosageUnit: 'TABLET', frequency: 'ONCE_DAILY', startDate: day(-30), endDate: day(60), instructions: 'Morning, with water' },
      { medicine: 'Atorvastatin', dosageAmount: 1, dosageUnit: 'TABLET', frequency: 'ONCE_DAILY', startDate: day(-30), endDate: day(60), instructions: 'At bedtime' },
    ],
  },
  {
    id: 'rx2', doctor: 'Dr. Soumya Banerjee', avatar: avatar('Dr. Soumya Banerjee'), date: day(-45), status: 'ACTIVE', notes: 'Diabetes management; repeat HbA1c next month.',
    items: [
      { medicine: 'Metformin', dosageAmount: 1, dosageUnit: 'TABLET', frequency: 'TWICE_DAILY', startDate: day(-45), endDate: day(45), instructions: 'After food' },
      { medicine: 'Vitamin D3', dosageAmount: 1, dosageUnit: 'CAPSULE', frequency: 'WEEKLY', startDate: day(-45), endDate: day(45), instructions: 'With a fatty meal' },
    ],
  },
  {
    id: 'rx3', doctor: 'Dr. Mitali Das', avatar: avatar('Dr. Mitali Das'), date: day(-120), status: 'COMPLETED', notes: 'Seasonal infection — course completed.',
    items: [{ medicine: 'Azithromycin', dosageAmount: 1, dosageUnit: 'TABLET', frequency: 'ONCE_DAILY', startDate: day(-120), endDate: day(-115), instructions: 'Before food' }],
  },
];

// ---------- family ----------
export const FAMILY = {
  members: [
    { id: 'f1', name: 'Meera Sharma', relationship: 'SPOUSE', globalId: '4821097365102847', avatar: avatar('Meera Sharma') },
    { id: 'f2', name: 'Rakesh Sharma', relationship: 'PARENT', globalId: '6120483795021348', avatar: avatar('Rakesh Sharma') },
  ],
  received: [{ id: 'f3', name: 'Ishaan Sharma', relationship: 'SIBLING', globalId: '3092817465021983', avatar: avatar('Ishaan Sharma') }],
  sent: [],
};

// ---------- notifications ----------
export const NOTIFICATIONS = [
  { id: 'n1', type: 'DOSE', title: 'Metformin due at 08:30', body: 'Take 1 tablet after breakfast.', time: 'Today · 08:25', read: false },
  { id: 'n2', type: 'STOCK', title: 'Metformin is running low', body: 'Only 9 tablets left — below your threshold of 10.', time: 'Today · 07:00', read: false },
  { id: 'n3', type: 'EXPIRY', title: 'Atorvastatin expires in 20 days', body: 'Batch ATV-2306. Use it first or replace it.', time: 'Yesterday', read: false },
  { id: 'n4', type: 'FAMILY', title: 'Ishaan Sharma sent a family request', body: 'Accept to share dose reminders.', time: 'Yesterday', read: true },
  { id: 'n5', type: 'STOCK', title: 'Cetirizine is running low', body: 'Only 6 tablets left.', time: '2 days ago', read: true },
];

// ---------- pharmacies ----------
export const VENDORS = [
  { id: 'v1', name: 'Kalyani Care Pharmacy', area: 'Central Park Road', distance: '0.8 km', rating: 4.7, open: true, image: IMG.vendor },
  { id: 'v2', name: 'Nadia Health Mart', area: 'Block A', distance: '1.4 km', rating: 4.5, open: true, image: IMG.vendor },
  { id: 'v3', name: 'Gayespur Medico', area: 'Gayespur Road', distance: '2.1 km', rating: 4.3, open: false, image: IMG.vendor },
  { id: 'v4', name: 'Kalyani 24×7 Chemist', area: 'Near Kalyani Station', distance: '2.9 km', rating: 4.6, open: true, image: IMG.vendor },
];
