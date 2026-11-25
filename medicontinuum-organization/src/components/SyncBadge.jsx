import { CloudOff, RefreshCw } from 'lucide-react';
import { useHubStatus } from '@/hooks/useHubStatus';
import { PATIENT_URL } from '@/lib/hub';

/** Shows whether this portal is live-synced with the patient site. */
export function SyncBadge({ compact = false }) {
  const status = useHubStatus();
  if (status === 'connected') {
    return (
      <span title="Changes appear on the patient site within seconds" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> {compact ? 'Synced' : 'Synced with patient site'}
      </span>
    );
  }
  if (status === 'connecting') {
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"><RefreshCw size={12} className="animate-spin" /> Connecting…</span>;
  }
  return (
    <span title={`Start the patient site (${PATIENT_URL}) to sync. Your changes are saved here meanwhile.`}
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <CloudOff size={12} /> {compact ? 'Local only' : 'Patient site offline — saved locally'}
    </span>
  );
}
