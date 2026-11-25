import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Stethoscope } from 'lucide-react';
import { AuthShell, AuthLink } from '@/components/AuthShell';
import { ErrorBanner, Field, btnPrimary, inputCls } from '@/components/ui';
import { api } from '@/api/client';
import { GOV_ID_TYPES, ORG_TYPES, humanize } from '@/constants';

const common = { email: '', phone: '', city: '', state: '', country: 'India', postalCode: '' };
const initial = {
  ORGANIZATION: { ...common, name: '', orgType: 'HOSPITAL', licenseNumber: '', govIdType: 'PAN', govIdNumber: '', contactPerson: '', address: '' },
  DOCTOR: { ...common, name: '', doctorRegNumber: '', council: '', specialization: '' },
};

export default function Register() {
  const navigate = useNavigate();
  const [kind, setKind] = useState('ORGANIZATION');
  const [forms, setForms] = useState(initial);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const form = forms[kind];
  const update = (e) => setForms((p) => ({ ...p, [kind]: { ...p[kind], [e.target.name]: e.target.value } }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null); setErrors({});
    try {
      const res = await api.register({ kind, ...form });
      navigate('/register/done', { state: res, replace: true });
    } catch (err) {
      setError(err); setErrors(err.fields ?? {});
    } finally { setBusy(false); }
  };

  const f = (name, label, { wide, ...props } = {}, hint) => (
    <Field label={label} error={errors[name]} hint={hint} className={wide ? 'sm:col-span-2' : ''}>
      <input name={name} value={form[name]} onChange={update} required className={inputCls} {...props} />
    </Field>
  );
  const govHint = GOV_ID_TYPES.find((g) => g.value === form.govIdType)?.hint;

  return (
    <AuthShell wide title="Register" subtitle="Verify your identity to receive your unique 16-digit organization number."
      footer={<>Already have a number? <AuthLink to="/signup">Create your login</AuthLink> · <AuthLink to="/login">Log in</AuthLink></>}>
      <div className="mb-6 grid grid-cols-2 gap-2">
        {[['ORGANIZATION', 'Organization', Building2], ['DOCTOR', 'Individual doctor', Stethoscope]].map(([value, label, Icon]) => (
          <button key={value} type="button" onClick={() => { setKind(value); setErrors({}); setError(null); }}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${kind === value ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate={false}>
        <div className="grid gap-4 sm:grid-cols-2">
          {kind === 'ORGANIZATION' ? (
            <>
              {f('name', 'Organization name', { wide: true, placeholder: 'Eastern Care Hospital' })}
              <Field label="Organization type" error={errors.orgType}>
                <select name="orgType" value={form.orgType} onChange={update} className={inputCls}>
                  {ORG_TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
                </select>
              </Field>
              {f('licenseNumber', 'Licence number', { placeholder: 'WB/HOS/2021/1001' }, 'As printed on your registration / clinical establishment licence')}
              <Field label="Government ID type" error={errors.govIdType}>
                <select name="govIdType" value={form.govIdType} onChange={update} className={inputCls}>
                  {GOV_ID_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </Field>
              {f('govIdNumber', 'Government ID number', { placeholder: govHint?.replace('e.g. ', '') }, govHint)}
              {f('contactPerson', 'Contact person', { placeholder: 'Authorised signatory' })}
              {f('address', 'Address', { wide: true, placeholder: '12 Park Street' })}
            </>
          ) : (
            <>
              {f('name', 'Full name', { wide: true, placeholder: 'Dr. Ananya Sen' })}
              {f('doctorRegNumber', 'Doctor ID (registration number)', { placeholder: 'WBMC-45821' })}
              {f('council', 'Medical council', { placeholder: 'West Bengal Medical Council' })}
              {f('specialization', 'Specialization', { wide: true, placeholder: 'Cardiology' })}
            </>
          )}
          {f('email', 'Email', { type: 'email', placeholder: 'admin@example.org' })}
          {f('phone', 'Phone', { type: 'tel', placeholder: '+91 98300 00000' })}
          {f('city', 'City')}
          {f('state', 'State')}
          {f('postalCode', 'Postal code')}
          {f('country', 'Country')}
        </div>
        <ErrorBanner error={error} />
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? 'Verifying…' : 'Register & get my 16-digit number'}</button>
        <p className="text-xs text-slate-400">Government ID numbers are never stored in readable form — only a masked tail and a one-way fingerprint used to prevent duplicate registrations.</p>
      </form>
    </AuthShell>
  );
}
