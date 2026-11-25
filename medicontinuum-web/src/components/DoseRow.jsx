import { Pill } from 'lucide-react';
import { Badge } from '@/components/ui';

const tones = { PENDING: 'amber', TAKEN: 'green', SKIPPED: 'slate' };

export function DoseRow({ dose, onMark }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
          <Pill size={18} />
        </span>
        <div>
          <p className="font-medium text-slate-900">{dose.medicine}</p>
          <p className="text-sm text-slate-500">{dose.time} · {dose.dose}</p>
        </div>
      </div>
      {dose.status === 'PENDING' ? (
        <div className="flex gap-2">
          <button type="button" onClick={() => onMark(dose.id, 'TAKEN')} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">Taken</button>
          <button type="button" onClick={() => onMark(dose.id, 'SKIPPED')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Skip</button>
        </div>
      ) : (
        <Badge tone={tones[dose.status]}>{dose.status}</Badge>
      )}
    </li>
  );
}
