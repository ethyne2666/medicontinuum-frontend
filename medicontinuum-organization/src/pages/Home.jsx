import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Droplets, FileBadge2, HeartHandshake, MapPin, ShieldCheck, Stethoscope, Users } from 'lucide-react';
import { api } from '@/api/client';
import { usePolling } from '@/hooks/usePolling';
import { Badge, Card, btnGhost, btnPrimary } from '@/components/ui';
import { entityTypeLabel } from '@/constants';

const STEPS = [
  { icon: FileBadge2, title: '1. Register', text: 'Hospitals, clinics, labs and pharmacies register with a licence and government ID. Individual doctors register with their doctor ID.' },
  { icon: HeartHandshake, title: '2. Get your 16-digit number', text: 'Every verified registration receives a unique organization number. It is required to create your login.' },
  { icon: Stethoscope, title: '3. Collaborate', text: 'Request or offer doctors, blood, equipment and medicines across the network — and be listed for patients on the patient site.' },
];

export default function Home() {
  const { data } = usePolling(() => api.publicDirectory(), { interval: 10000 });
  const all = data ?? [];
  const orgs = all.filter((e) => e.kind === 'ORGANIZATION');
  const doctors = all.filter((e) => e.kind === 'DOCTOR').length + orgs.reduce((n, o) => n + o.doctors.length, 0);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 px-4 py-20 text-white sm:py-28">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100 ring-1 ring-white/20">
            <ShieldCheck size={14} /> Verified hospitals, labs, pharmacies & doctors
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">The organization network behind MediContinuum</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-indigo-100">Register your hospital, clinic, lab, pharmacy or practice, get listed for patients, and share doctors, blood and resources with other organizations.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/register" className={`${btnPrimary} !bg-white !text-indigo-700 hover:!bg-indigo-50`}>Register now <ArrowRight size={16} /></Link>
            <Link to="/signup" className={`${btnGhost} !border-indigo-400 !bg-transparent !text-white hover:!bg-indigo-800`}>I have a 16-digit number</Link>
            <Link to="/login" className={`${btnGhost} !border-indigo-400 !bg-transparent !text-white hover:!bg-indigo-800`}>Log in</Link>
          </div>
          <dl className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4 text-center">
            {[['Members', all.length], ['Organizations', orgs.length], ['Doctors', doctors]].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/10 px-3 py-4 ring-1 ring-white/10">
                <dd className="text-3xl font-bold">{value}</dd>
                <dt className="text-xs uppercase tracking-wide text-indigo-200">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="transition hover:-translate-y-1 hover:shadow-md">
            <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={22} /></span>
            <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </Card>
        ))}
      </section>

      {orgs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Already on the network</h2>
              <p className="text-sm text-slate-500">Patients can see these on the patient site.</p>
            </div>
            <Users className="text-slate-300" size={28} />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.slice(0, 6).map((o) => (
              <Card key={o.publicId}>
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Building2 size={22} /></span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{o.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500"><MapPin size={13} />{o.city}, {o.state}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="indigo">{entityTypeLabel(o)}</Badge>
                  {o.doctors.length > 0 && <Badge tone="sky">{o.doctors.length} doctor{o.doctors.length > 1 ? 's' : ''}</Badge>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <p className="pb-12 text-center text-xs text-slate-400"><Droplets className="mr-1 inline" size={14} />Blood, organ and doctor sharing follows each member’s own legal and clinical protocols.</p>
    </>
  );
}
