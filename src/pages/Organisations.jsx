import { useState } from 'react';
import { BadgeCheck, Building2, ExternalLink, Loader2, MapPin, Phone, RefreshCw, Search, Stethoscope } from 'lucide-react';
import { Badge, Card, PageHeader, Stat, Tabs, inputCls } from '@/components/ui';
import { usePolling } from '@/hooks/usePolling';
import { ORG_PORTAL_URL, fetchRegisteredOrganisations } from '@/api/orgApi';
import { humanize } from '@/utils/date';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'HOSPITAL', label: 'Hospitals' },
  { value: 'CLINIC', label: 'Clinics' },
  { value: 'PHARMACY', label: 'Pharmacies' },
  { value: 'BLOOD_BANK', label: 'Blood banks' },
  { value: 'DIAGNOSTIC_LAB', label: 'Labs' },
  { value: 'DOCTOR', label: 'Doctors' },
];

const typeOf = (e) => (e.kind === 'DOCTOR' ? 'DOCTOR' : e.orgType);
const typeLabel = (e) => (e.kind === 'DOCTOR' ? 'Individual doctor' : humanize(e.orgType));

export default function Organisations() {
  const { data, error, loading, refresh, updatedAt } = usePolling(fetchRegisteredOrganisations, { interval: 10000 });
  const [filter, setFilter] = useState('ALL');
  const [q, setQ] = useState('');

  const all = data?.items ?? [];
  const needle = q.trim().toLowerCase();
  const items = all.filter((e) =>
    (filter === 'ALL' || typeOf(e) === filter) &&
    (!needle || [e.name, e.city, e.state, e.specialization ?? '', typeLabel(e)].some((v) => v.toLowerCase().includes(needle))));

  const count = (t) => all.filter((e) => typeOf(e) === t).length;
  const tabs = FILTERS.map((f) => ({ ...f, count: f.value === 'ALL' ? all.length : count(f.value) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registered organisations"
        subtitle="Verified hospitals, clinics, labs, pharmacies and doctors on MediContinuum."
        action={
          <span className="inline-flex items-center gap-2 text-xs text-slate-500">
            <span className={`size-2 rounded-full ${error ? 'bg-red-500' : 'animate-pulse bg-emerald-500'}`} />
            {error ? 'Offline' : updatedAt ? `Live · synced ${updatedAt.toLocaleTimeString()}` : 'Connecting…'}
            <button type="button" onClick={refresh} aria-label="Refresh" className="rounded-lg p-1.5 hover:bg-slate-100"><RefreshCw size={14} /></button>
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Building2} label="Organisations" value={all.filter((e) => e.kind === 'ORGANIZATION').length} />
        <Stat icon={Stethoscope} label="Individual doctors" value={count('DOCTOR')} tone="sky" />
        <Stat icon={BadgeCheck} label="Verified members" value={all.length} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, city or specialization" className={`${inputCls} pl-10`} />
        </div>
      </div>
      <div className="overflow-x-auto"><Tabs tabs={tabs} value={filter} onChange={setFilter} /></div>

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error.message}</span>
          <button type="button" onClick={refresh} className="font-semibold underline">Retry</button>
        </div>
      )}

      {loading && !data ? (
        <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Loading organisations…</div>
      ) : data && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Building2 className="mx-auto text-slate-300" size={36} />
          <p className="mt-3 font-semibold text-slate-700">{all.length === 0 ? 'No organisations have registered yet' : 'No matches'}</p>
          <p className="mt-1 text-sm text-slate-500">{all.length === 0 ? 'They will appear here the moment they finish registering.' : 'Try another search or filter.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((e) => (
            <Card key={e.publicId} className="flex flex-col">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
                  {e.kind === 'DOCTOR' ? <Stethoscope size={22} /> : <Building2 size={22} />}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-900">{e.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500"><MapPin size={13} />{e.city}, {e.state}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="teal">{typeLabel(e)}</Badge>
                {e.specialization && <Badge tone="sky">{e.specialization}</Badge>}
                <Badge tone="green"><BadgeCheck size={12} className="mr-1" />Verified</Badge>
              </div>
              <div className="mt-4 flex flex-1 items-end justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span>Reg. no. {e.numberHint}</span>
                {e.phone && <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline"><Phone size={14} />Call</a>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3 !bg-slate-900 !text-white">
        <div>
          <p className="font-semibold">Run a hospital, clinic or practice?</p>
          <p className="text-sm text-slate-300">Register on the organization portal to be listed here and share resources with other organizations.</p>
        </div>
        <a href={`${ORG_PORTAL_URL}/register`} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100">
          Open organization portal <ExternalLink size={14} />
        </a>
      </Card>
    </div>
  );
}
