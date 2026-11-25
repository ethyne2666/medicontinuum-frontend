import { useState } from 'react';
import { Card, Field, PageHeader, btnPrimary, inputCls } from '@/components/ui';
import { BLOOD_GROUPS, GENDERS, PROFILE, USER } from '@/data/mock';
import { humanize } from '@/utils/date';

const fields = [
  { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
  { name: 'gender', label: 'Gender', options: GENDERS },
  { name: 'bloodGroup', label: 'Blood group', options: BLOOD_GROUPS },
  { name: 'postalCode', label: 'Postal code' },
  { name: 'addressLine', label: 'Address', wide: true },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'country', label: 'Country' },
  { name: 'emergencyContactName', label: 'Emergency contact' },
  { name: 'emergencyContactPhone', label: 'Emergency phone', type: 'tel' },
];

export default function Profile() {
  const [form, setForm] = useState(PROFILE);
  const [saved, setSaved] = useState(false);

  const update = (e) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your personal and emergency details." />
      <Card className="flex items-center gap-4">
        <img src={USER.avatar} alt="" width="72" height="72" className="size-18 rounded-full" />
        <div>
          <p className="text-lg font-semibold text-slate-900">{USER.name}</p>
          <p className="text-sm text-slate-500">{USER.email}</p>
          <p className="text-xs text-slate-400">Global ID {USER.globalUserId}</p>
        </div>
      </Card>
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ name, label, type = 'text', options, wide }) => (
            <Field key={name} label={label} className={wide ? 'sm:col-span-2' : ''}>
              {options ? (
                <select name={name} value={form[name]} onChange={update} className={inputCls}>
                  {options.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
                </select>
              ) : (
                <input name={name} type={type} value={form[name]} onChange={update} className={inputCls} />
              )}
            </Field>
          ))}
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className={btnPrimary}>Save changes</button>
            {saved && <span role="status" className="text-sm text-emerald-600">Saved</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
