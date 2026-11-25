import { useState } from 'react';
import { Card, Field, PageHeader, Tabs, btnPrimary, inputCls } from '@/components/ui';
import { FAMILY, RELATIONSHIPS, avatar } from '@/data/mock';
import { humanize } from '@/utils/date';

function PersonRow({ person, actions }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <img src={person.avatar} alt="" width="44" height="44" className="size-11 rounded-full" />
        <div>
          <p className="font-medium text-slate-900">{person.name}</p>
          <p className="text-xs text-slate-500">{humanize(person.relationship)} · ID {person.globalId}</p>
        </div>
      </div>
      <div className="flex gap-2">{actions}</div>
    </li>
  );
}

const solid = 'rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700';
const outline = 'rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50';

export default function Family() {
  const [data, setData] = useState(FAMILY);
  const [tab, setTab] = useState('members');
  const [request, setRequest] = useState({ relatedUserGlobalId: '', relationship: 'PARENT' });

  const drop = (key, id) => setData((d) => ({ ...d, [key]: d[key].filter((p) => p.id !== id) }));
  const accept = (person) =>
    setData((d) => ({ ...d, received: d.received.filter((p) => p.id !== person.id), members: [...d.members, person] }));

  const send = (e) => {
    e.preventDefault();
    const person = {
      id: crypto.randomUUID(), name: 'Pending user', relationship: request.relationship,
      globalId: request.relatedUserGlobalId, avatar: avatar(8),
    };
    setData((d) => ({ ...d, sent: [person, ...d.sent] }));
    setRequest({ relatedUserGlobalId: '', relationship: 'PARENT' });
    setTab('sent');
  };

  const tabs = [
    { value: 'members', label: 'Members', count: data.members.length },
    { value: 'received', label: 'Received', count: data.received.length },
    { value: 'sent', label: 'Sent', count: data.sent.length },
  ];

  const actionsFor = {
    members: (p) => <button type="button" onClick={() => drop('members', p.id)} className={outline}>Remove</button>,
    received: (p) => (
      <>
        <button type="button" onClick={() => accept(p)} className={solid}>Accept</button>
        <button type="button" onClick={() => drop('received', p.id)} className={outline}>Reject</button>
      </>
    ),
    sent: (p) => <button type="button" onClick={() => drop('sent', p.id)} className={outline}>Cancel</button>,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Family" subtitle="Connect with the people who care for you." />
      <Card>
        <form onSubmit={send} className="grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
          <Field label="Their global user ID">
            <input required value={request.relatedUserGlobalId} onChange={(e) => setRequest((r) => ({ ...r, relatedUserGlobalId: e.target.value }))} className={inputCls} placeholder="7391058264130952" />
          </Field>
          <Field label="Relationship">
            <select value={request.relationship} onChange={(e) => setRequest((r) => ({ ...r, relationship: e.target.value }))} className={inputCls}>
              {RELATIONSHIPS.map((r) => <option key={r} value={r}>{humanize(r)}</option>)}
            </select>
          </Field>
          <button type="submit" className={btnPrimary}>Send request</button>
        </form>
      </Card>
      <Card>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <ul className="mt-3 divide-y divide-slate-100">
          {data[tab].map((p) => <PersonRow key={p.id} person={p} actions={actionsFor[tab](p)} />)}
        </ul>
        {data[tab].length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nothing here yet.</p>}
      </Card>
    </div>
  );
}
