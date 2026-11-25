import { useState } from 'react';
import { Plus, Stethoscope, Trash2 } from 'lucide-react';
import { Badge, Card, CopyButton, ErrorBanner, Field, PageHeader, btnGhost, btnPrimary, inputCls } from '@/components/ui';
import { api } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { entityTypeLabel, humanize } from '@/constants';

const Row = ({ label, value }) => value ? (
  <div className="flex flex-wrap justify-between gap-2 py-3 text-sm">
    <dt className="text-slate-500">{label}</dt>
    <dd className="font-medium text-slate-900">{value}</dd>
  </div>
) : null;

function DoctorsManager() {
  const { me, refreshMe } = useAuth();
  const [form, setForm] = useState({ name: '', specialization: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true); setError(null);
    try { await fn(); await refreshMe(); } catch (e) { setError(e); } finally { setBusy(false); }
  };
  const add = (e) => { e.preventDefault(); run(async () => { await api.addDoctor(form); setForm({ name: '', specialization: '' }); }); };

  return (
    <Card>
      <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Stethoscope size={18} className="text-indigo-600" /> Doctors at {me.name}</h2>
      <p className="mt-1 text-sm text-slate-500">These are shown to patients on the patient site, and help other organizations find the right specialist to request.</p>
      <ul className="mt-4 divide-y divide-slate-100">
        {(me.doctors ?? []).map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span><span className="font-medium text-slate-900">{d.name}</span> <span className="text-slate-500">· {d.specialization}</span></span>
            <button type="button" disabled={busy} onClick={() => run(() => api.removeDoctor(d.id))} aria-label={`Remove ${d.name}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
          </li>
        ))}
        {(me.doctors ?? []).length === 0 && <li className="py-4 text-sm text-slate-400">No doctors listed yet.</li>}
      </ul>
      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Doctor name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Dr. Anita Roy" /></Field>
        <Field label="Specialization"><input required value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className={inputCls} placeholder="Cardiology" /></Field>
        <button type="submit" disabled={busy} className={btnPrimary}><Plus size={16} /> Add</button>
      </form>
      <div className="mt-3"><ErrorBanner error={error} /></div>
    </Card>
  );
}

export default function Profile() {
  const { me } = useAuth();
  const isDoctor = me.kind === 'DOCTOR';
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Registration details verified at sign-up." action={<Badge tone="green">Verified · Active</Badge>} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Organization number</p>
            <p className="font-mono text-xl font-bold tracking-widest text-slate-900">{me.orgNumberFormatted}</p>
          </div>
          <CopyButton text={me.orgNumber} />
        </div>
      </Card>
      {!isDoctor && <DoctorsManager />}
      <Card>
        <dl className="divide-y divide-slate-100">
          <Row label="Name" value={me.name} />
          <Row label="Type" value={entityTypeLabel(me)} />
          <Row label="Specialization" value={me.specialization} />
          <Row label="Licence number" value={me.licenseNumber} />
          <Row label="Government ID" value={me.govIdType && `${humanize(me.govIdType)} · ${me.govIdMasked}`} />
          <Row label={isDoctor ? 'Doctor ID' : null} value={me.doctorRegNumber} />
          <Row label="Medical council" value={me.council} />
          <Row label="Contact person" value={!isDoctor && me.contactPerson} />
          <Row label="Email" value={me.email} />
          <Row label="Phone" value={me.phone} />
          <Row label="Address" value={[me.address, me.city, me.state, me.postalCode, me.country].filter(Boolean).join(', ')} />
          <Row label="Public ID (shown to other members)" value={me.publicId} />
        </dl>
      </Card>
    </div>
  );
}
