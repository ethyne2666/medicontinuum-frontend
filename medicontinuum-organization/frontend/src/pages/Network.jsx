import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Search, Stethoscope } from 'lucide-react';
import { api } from '@/api/client';
import { usePolling } from '@/hooks/usePolling';
import { Badge, Card, EmptyState, ErrorBanner, PageHeader, Spinner, inputCls } from '@/components/ui';
import { ORG_TYPES, entityTypeLabel, humanize } from '@/constants';

export default function Network() {
  const { data, error, loading, refresh } = usePolling(() => api.network(), { interval: 15000 });
  const [q, setQ] = useState('');
  const [type, setType] = useState('');

  const needle = q.trim().toLowerCase();
  const items = (data?.items ?? []).filter((e) =>
    (!type || (type === 'DOCTOR' ? e.kind === 'DOCTOR' : e.orgType === type)) &&
    (!needle || [e.name, e.city, e.state, e.specialization ?? ''].some((v) => v.toLowerCase().includes(needle))));

  return (
    <div className="space-y-6">
      <PageHeader title="Network" subtitle="Every verified organization and doctor you can collaborate with." />
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city, specialization" className={`${inputCls} pl-10`} />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type" className={`${inputCls} !w-auto`}>
          <option value="">All types</option>
          {ORG_TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
          <option value="DOCTOR">Individual doctors</option>
        </select>
      </div>
      <ErrorBanner error={error} onRetry={refresh} />
      {loading && !data ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={Building2} title="No matches">Try a different search, or invite more organizations to register.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((e) => (
            <Card key={e.publicId}>
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  {e.kind === 'DOCTOR' ? <Stethoscope size={22} /> : <Building2 size={22} />}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{e.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500"><MapPin size={13} />{e.city}, {e.state}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="indigo">{entityTypeLabel(e)}</Badge>
                {e.specialization && <Badge tone="sky">{e.specialization}</Badge>}
              </div>
              <Link to={`/portal/shares?target=${e.publicId}`} className="mt-4 inline-block text-sm font-semibold text-indigo-700 hover:underline">Send a request or offer →</Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
