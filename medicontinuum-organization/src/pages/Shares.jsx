import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Repeat } from 'lucide-react';
import { api } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { usePolling } from '@/hooks/usePolling';
import { EmptyState, ErrorBanner, PageHeader, Spinner, Tabs, btnPrimary, inputCls } from '@/components/ui';
import { ShareCard } from '@/components/ShareCard';
import { NewShareForm } from '@/components/NewShareForm';
import { RESOURCE_TYPES, humanize } from '@/constants';

const TABS = [
  { value: 'incoming', label: 'Incoming' },
  { value: 'mine', label: 'My posts' },
  { value: 'responded', label: 'Accepted by me' },
];
const EMPTY = {
  incoming: 'No open requests or offers from other organizations right now.',
  mine: 'You haven’t posted anything yet.',
  responded: 'Nothing accepted yet.',
};

export default function Shares() {
  const { me } = useAuth();
  const [params, setParams] = useSearchParams();
  const presetTarget = params.get('target') ?? '';
  const [scope, setScope] = useState('incoming');
  const [type, setType] = useState('');
  const [showForm, setShowForm] = useState(Boolean(presetTarget));
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { data, error, loading, refresh, updatedAt } = usePolling(
    () => api.shares({ scope, type }), { interval: 8000, key: `${scope}|${type}` },
  );

  const act = async (id, fn) => {
    setBusyId(id); setActionError(null);
    try { await fn(); await refresh(); } catch (err) { setActionError(err); await refresh(); } finally { setBusyId(null); }
  };

  const closeForm = () => { setShowForm(false); if (presetTarget) setParams({}); };

  return (
    <div className="space-y-6">
      <PageHeader title="Resource sharing" subtitle="Request or offer doctors, blood, organs, equipment and medicines. Updates arrive automatically."
        action={!showForm && <button type="button" onClick={() => setShowForm(true)} className={btnPrimary}><Plus size={16} /> New post</button>} />

      {showForm && (
        <NewShareForm me={me} presetTarget={presetTarget} onCancel={closeForm}
          onCreated={() => { closeForm(); setScope('mine'); refresh(); }} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} value={scope} onChange={setScope} />
        <div className="flex items-center gap-3">
          {updatedAt && <span className="hidden text-xs text-slate-400 sm:block">Synced {updatedAt.toLocaleTimeString()}</span>}
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by resource" className={`${inputCls} !w-auto`}>
            <option value="">All resources</option>
            {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
          </select>
        </div>
      </div>

      <ErrorBanner error={actionError} />
      <ErrorBanner error={error} onRetry={refresh} />
      {loading && !data ? <Spinner /> : data && (
        data.items.length === 0 ? <EmptyState icon={Repeat} title="Nothing here">{EMPTY[scope]}</EmptyState> : (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.items.map((s) => (
              <ShareCard key={s.id} share={s} busy={busyId === s.id}
                onRespond={(id, action, message) => act(id, () => api.respond(id, { action, message }))}
                onFulfil={(id) => act(id, () => api.fulfil(id))}
                onCancel={(id) => act(id, () => api.cancel(id))} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
