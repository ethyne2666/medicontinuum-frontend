import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge, Card, Field, PageHeader, Tabs, btnPrimary, inputCls } from '@/components/ui';
import { DOSAGE_UNITS, FREQUENCIES, MEDICINES, PRESCRIPTIONS, avatar } from '@/data/mock';
import { formatDate, humanize } from '@/utils/date';

const emptyItem = {
  medicine: MEDICINES[0].name, dosageAmount: 1, dosageUnit: 'TABLET',
  frequency: 'TWICE_DAILY', startDate: '', endDate: '', instructions: '',
};

export default function Prescriptions() {
  const [list, setList] = useState(PRESCRIPTIONS);
  const [filter, setFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState(emptyItem);

  const update = (e) => setItem((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const visible = filter === 'ALL' ? list : list.filter((rx) => rx.status === filter);
  const tabs = ['ALL', 'ACTIVE', 'COMPLETED'].map((value) => ({ value, label: humanize(value) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setList((prev) => [
      { id: crypto.randomUUID(), doctor: 'You', avatar: avatar(12), date: item.startDate, status: 'ACTIVE', notes: 'Added manually', items: [item] },
      ...prev,
    ]);
    setItem(emptyItem);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescriptions"
        subtitle="Prescriptions issued by your doctors."
        action={<button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimary}><Plus size={16} /> New prescription</button>}
      />

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Medicine">
              <select name="medicine" value={item.medicine} onChange={update} className={inputCls}>
                {MEDICINES.map((m) => <option key={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Dosage amount"><input required min="1" type="number" name="dosageAmount" value={item.dosageAmount} onChange={update} className={inputCls} /></Field>
            <Field label="Unit">
              <select name="dosageUnit" value={item.dosageUnit} onChange={update} className={inputCls}>
                {DOSAGE_UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Frequency">
              <select name="frequency" value={item.frequency} onChange={update} className={inputCls}>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{humanize(f)}</option>)}
              </select>
            </Field>
            <Field label="Start date"><input required type="date" name="startDate" value={item.startDate} onChange={update} className={inputCls} /></Field>
            <Field label="End date"><input required type="date" name="endDate" value={item.endDate} onChange={update} className={inputCls} /></Field>
            <Field label="Instructions" className="sm:col-span-2 lg:col-span-3">
              <input name="instructions" value={item.instructions} onChange={update} className={inputCls} placeholder="Take after food" />
            </Field>
            <button type="submit" className={btnPrimary}>Save prescription</button>
          </form>
        </Card>
      )}

      <Tabs tabs={tabs} value={filter} onChange={setFilter} />

      <div className="grid gap-5 lg:grid-cols-2">
        {visible.map((rx) => (
          <Card key={rx.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={rx.avatar} alt="" width="44" height="44" className="size-11 rounded-full" />
                <div>
                  <p className="font-semibold text-slate-900">{rx.doctor}</p>
                  <p className="text-xs text-slate-500">{rx.date ? formatDate(rx.date) : '—'}</p>
                </div>
              </div>
              <Badge tone={rx.status === 'ACTIVE' ? 'green' : 'slate'}>{rx.status}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-500">{rx.notes}</p>
            <ul className="mt-3 space-y-2">
              {rx.items.map((it, index) => (
                <li key={`${rx.id}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-900">{it.medicine} · {it.dosageAmount} {it.dosageUnit.toLowerCase()}</p>
                  <p className="text-slate-500">{humanize(it.frequency)} · {it.instructions || 'No instructions'}</p>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
