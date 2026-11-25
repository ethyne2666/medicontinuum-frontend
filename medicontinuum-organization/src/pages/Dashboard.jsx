import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Eye, EyeOff, Inbox, Network, Send } from 'lucide-react';
import { api } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { usePolling } from '@/hooks/usePolling';
import { Badge, Card, CopyButton, EmptyState, ErrorBanner, PageHeader, Spinner, Stat, btnGhost } from '@/components/ui';
import { describeShare, entityTypeLabel, humanize } from '@/constants';

export default function Dashboard() {
  const { me } = useAuth();
  const [reveal, setReveal] = useState(false);
  const { data, error, loading, refresh } = usePolling(
    async () => {
      const [summary, incoming, stats] = await Promise.all([api.summary(), api.shares({ scope: 'incoming' }), api.stats()]);
      return { summary, incoming: incoming.items.slice(0, 5), stats };
    },
    { interval: 8000 },
  );

  return (
    <div className="space-y-6">
      <PageHeader title={`Hello, ${me.name}`} subtitle={`${entityTypeLabel(me)} · ${me.city}, ${me.state}`} />

      <Card className="flex flex-wrap items-center justify-between gap-4 !border-indigo-100 !bg-indigo-50">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Your organization number</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-indigo-900">
            {reveal ? me.orgNumberFormatted : `•••• •••• •••• ${me.orgNumber.slice(-4)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={btnGhost} onClick={() => setReveal((v) => !v)}>{reveal ? <EyeOff size={16} /> : <Eye size={16} />}{reveal ? 'Hide' : 'Show'}</button>
          <CopyButton text={me.orgNumber} />
        </div>
      </Card>

      <ErrorBanner error={error} onRetry={refresh} />
      {loading && !data ? <Spinner /> : data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Inbox} label="Open for you" value={data.summary.incomingOpen} tone="amber" />
            <Stat icon={Send} label="My open posts" value={data.summary.myOpen} />
            <Stat icon={CheckCheck} label="Fulfilled by me" value={data.summary.myFulfilled} tone="green" />
            <Stat icon={Network} label="Members on network" value={data.stats.total} tone="sky" />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Needs your attention</h2>
              <Link to="/portal/shares" className="text-sm font-semibold text-indigo-700 hover:underline">View all</Link>
            </div>
            {data.incoming.length === 0 ? <EmptyState icon={Inbox} title="All caught up">New requests and offers from other organizations will appear here.</EmptyState> : (
              <Card className="divide-y divide-slate-100 !p-0">
                {data.incoming.map((s) => (
                  <Link key={s.id} to="/portal/shares" className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{describeShare(s)}</p>
                      <p className="text-sm text-slate-500">{s.direction === 'REQUEST' ? 'Needed by' : 'Offered by'} {s.owner?.name} · {s.owner?.city}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone="indigo">{humanize(s.resourceType)}</Badge>
                      {s.urgency !== 'ROUTINE' && <Badge tone={s.urgency === 'CRITICAL' ? 'red' : 'amber'}>{humanize(s.urgency)}</Badge>}
                    </div>
                  </Link>
                ))}
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
