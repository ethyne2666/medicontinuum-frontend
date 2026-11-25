import { useState } from 'react';
import { ArrowRight, Calendar, Mail, Phone } from 'lucide-react';
import { Badge, Card, btnDanger, btnGhost, btnPrimary, inputCls } from '@/components/ui';
import { describeShare, entityTypeLabel, humanize } from '@/constants';

const URGENCY_TONE = { ROUTINE: 'slate', URGENT: 'amber', CRITICAL: 'red' };
const STATUS_TONE = { OPEN: 'sky', ACCEPTED: 'indigo', FULFILLED: 'green', DECLINED: 'slate', CANCELLED: 'slate' };

export function ShareCard({ share, busy, onRespond, onFulfil, onCancel }) {
  const [reply, setReply] = useState(null); // { action, message }
  const s = share;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={s.direction === 'REQUEST' ? 'amber' : 'green'}>{s.direction === 'REQUEST' ? 'Needs' : 'Offers'}</Badge>
        <Badge tone="indigo">{humanize(s.resourceType)}</Badge>
        {s.urgency !== 'ROUTINE' && <Badge tone={URGENCY_TONE[s.urgency]}>{humanize(s.urgency)}</Badge>}
        <span className="ml-auto"><Badge tone={STATUS_TONE[s.status]}>{humanize(s.status)}</Badge></span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-slate-900">{describeShare(s)}</h3>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
        {s.isMine ? 'You' : <><span className="font-medium text-slate-700">{s.owner?.name}</span> · {s.owner?.city}</>}
        {s.target && <><ArrowRight size={14} /> {s.target.name}</>}
        {!s.target && <span className="text-slate-400">· entire network</span>}
      </p>
      {s.neededBy && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Calendar size={13} /> Needed by {s.neededBy}</p>}
      {s.notes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{s.notes}</p>}
      {s.responseMessage && <p className="mt-2 text-sm text-slate-500">Reply: “{s.responseMessage}”</p>}

      {s.counterpart && (
        <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm">
          <p className="font-semibold text-indigo-900">{s.counterpart.name} <span className="font-normal text-indigo-600">· {entityTypeLabel(s.counterpart)}, {s.counterpart.city}</span></p>
          <p className="mt-1 text-indigo-800">Contact: {s.counterpart.contactPerson}</p>
          <p className="mt-1 flex flex-wrap gap-x-4 text-indigo-700">
            <a className="inline-flex items-center gap-1 hover:underline" href={`mailto:${s.counterpart.email}`}><Mail size={14} />{s.counterpart.email}</a>
            <a className="inline-flex items-center gap-1 hover:underline" href={`tel:${s.counterpart.phone}`}><Phone size={14} />{s.counterpart.phone}</a>
          </p>
        </div>
      )}

      {reply ? (
        <div className="mt-4 space-y-2">
          <input autoFocus value={reply.message} onChange={(e) => setReply({ ...reply, message: e.target.value })} maxLength={300}
            placeholder={reply.action === 'ACCEPT' ? 'Optional message, e.g. ETA or contact desk' : 'Optional reason'} className={inputCls} />
          <div className="flex gap-2">
            <button type="button" disabled={busy} className={reply.action === 'ACCEPT' ? btnPrimary : btnDanger}
              onClick={() => onRespond(s.id, reply.action, reply.message)}>
              Confirm {reply.action === 'ACCEPT' ? 'accept' : 'decline'}
            </button>
            <button type="button" className={btnGhost} onClick={() => setReply(null)}>Back</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {s.canRespond && (
            <>
              <button type="button" className={btnPrimary} onClick={() => setReply({ action: 'ACCEPT', message: '' })}>
                {s.direction === 'REQUEST' ? 'I can help' : 'I need this'}
              </button>
              <button type="button" className={btnGhost} onClick={() => setReply({ action: 'DECLINE', message: '' })}>Decline</button>
            </>
          )}
          {s.canFulfil && <button type="button" disabled={busy} className={btnPrimary} onClick={() => onFulfil(s.id)}>Mark fulfilled</button>}
          {s.canCancel && <button type="button" disabled={busy} className={btnDanger} onClick={() => onCancel(s.id)}>Cancel post</button>}
        </div>
      )}
    </Card>
  );
}
