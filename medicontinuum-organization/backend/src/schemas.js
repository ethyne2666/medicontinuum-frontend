import { z } from 'zod';
import {
  BLOOD_COMPONENTS, BLOOD_GROUPS, DIRECTIONS, GOV_ID_PATTERNS, GOV_ID_TYPES,
  ORGANS, ORG_TYPES, RESOURCE_TYPES, URGENCIES,
} from './constants.js';

const text = (min, max, label) =>
  z.string({ required_error: `${label} is required` }).trim().min(min, `${label} is required`).max(max);

const phone = z.string().trim().transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => /^\+?[0-9]{10,15}$/.test(v), 'Enter a valid phone number');

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(120);

const location = {
  city: text(2, 60, 'City'),
  state: text(2, 60, 'State'),
  country: text(2, 60, 'Country').default('India'),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{4,10}$/, 'Enter a valid postal code'),
};

export const password = z.string().min(8, 'At least 8 characters').max(72, 'At most 72 characters')
  .regex(/[A-Za-z]/, 'Must contain a letter').regex(/[0-9]/, 'Must contain a number');

export const orgNumberSchema = z.string().trim().transform((v) => v.replace(/[\s-]/g, ''))
  .refine((v) => /^\d{16}$/.test(v), 'Organization number must be 16 digits');

const organizationRegistration = z.object({
  kind: z.literal('ORGANIZATION'),
  name: text(2, 120, 'Organization name'),
  orgType: z.enum(ORG_TYPES, { errorMap: () => ({ message: 'Choose an organization type' }) }),
  licenseNumber: z.string().trim().toUpperCase()
    .regex(/^[A-Z0-9/-]{5,30}$/, 'Licence number: 5–30 letters, digits, / or -'),
  govIdType: z.enum(GOV_ID_TYPES, { errorMap: () => ({ message: 'Choose a government ID type' }) }),
  govIdNumber: z.string().trim().toUpperCase().transform((v) => v.replace(/\s/g, '')),
  contactPerson: text(2, 80, 'Contact person'),
  address: text(5, 200, 'Address'),
  email, phone, ...location,
});

const doctorRegistration = z.object({
  kind: z.literal('DOCTOR'),
  name: text(2, 80, 'Full name'),
  doctorRegNumber: z.string().trim().toUpperCase()
    .regex(/^[A-Z0-9/-]{4,25}$/, 'Doctor ID: 4–25 letters, digits, / or -'),
  council: text(2, 100, 'Medical council'),
  specialization: text(2, 80, 'Specialization'),
  email, phone, ...location,
});

export const registerSchema = z.discriminatedUnion('kind', [organizationRegistration, doctorRegistration])
  .superRefine((v, ctx) => {
    if (v.kind !== 'ORGANIZATION') return;
    const pattern = GOV_ID_PATTERNS[v.govIdType];
    if (pattern && !pattern.test(v.govIdNumber)) {
      ctx.addIssue({ code: 'custom', path: ['govIdNumber'], message: `Not a valid ${v.govIdType} number` });
    }
  });

export const signupSchema = z.object({ orgNumber: orgNumberSchema, email, password });
export const loginSchema = z.object({ orgNumber: orgNumberSchema, password: z.string().min(1, 'Password is required') });

// ---------------- resource sharing ----------------
const shareBase = z.object({
  direction: z.enum(DIRECTIONS),
  urgency: z.enum(URGENCIES).default('ROUTINE'),
  quantity: z.coerce.number().int().min(1).max(1000).default(1),
  notes: z.string().trim().max(500).default(''),
  neededBy: z.string().date('Use a valid date').nullable().optional(),
  targetPublicId: z.string().trim().max(30).nullable().optional(),
});

const bloodGroup = z.enum(BLOOD_GROUPS, { errorMap: () => ({ message: 'Choose a blood group' }) });

export const shareSchema = z.discriminatedUnion('resourceType', [
  shareBase.extend({
    resourceType: z.literal('BLOOD'),
    details: z.object({ bloodGroup, component: z.enum(BLOOD_COMPONENTS).default('WHOLE_BLOOD') }),
  }),
  shareBase.extend({
    resourceType: z.literal('ORGAN'),
    details: z.object({
      organ: z.enum(ORGANS, { errorMap: () => ({ message: 'Choose an organ' }) }),
      bloodGroup: bloodGroup.optional(),
    }),
  }),
  shareBase.extend({
    resourceType: z.literal('DOCTOR'),
    details: z.object({
      specialization: text(2, 80, 'Specialization'),
      durationHours: z.coerce.number().int().min(1).max(24 * 90).optional(),
    }),
  }),
  shareBase.extend({
    resourceType: z.literal('EQUIPMENT'),
    details: z.object({ item: text(2, 100, 'Equipment') }),
  }),
  shareBase.extend({
    resourceType: z.literal('MEDICINE'),
    details: z.object({ item: text(2, 100, 'Medicine') }),
  }),
]);

export const respondSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
  message: z.string().trim().max(300).default(''),
});

export { RESOURCE_TYPES };
