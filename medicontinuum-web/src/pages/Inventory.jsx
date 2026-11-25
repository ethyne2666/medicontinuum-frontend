import { useState } from 'react';
import { AlertTriangle, Boxes, PackageX, Plus } from 'lucide-react';
import { Badge, Card, Field, PageHeader, Stat, Tabs, btnPrimary, inputCls } from '@/components/ui';
import { DOSAGE_UNITS, MEDICINES } from '@/data/mock';
import { patientActions, usePatient } from '@/store/patientStore';
import { formatDate } from '@/utils/date';
import { isExpiring, isLow } from '@/utils/inventory';

const emptyBatch = {
  medicine: MEDICINES[0].name, batchNumber: '', expiryDate: '',
  quantity: 30, stockUnit: 'TABLET', lowStockThreshold: 5, notes: '',
};

export default function Inventory() {
  const { inventory: items } = usePatient();
  const [filter, setFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [batch, setBatch] = useState(emptyBatch);

  const update = (e) => setBatch((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const consume = (id) => patientActions.consumeBatch(id);

  const visible = items.filter((i) => filter === 'ALL' || (filter === 'LOW' ? isLow(i) : isExpiring(i)));
  const tabs = [
    { value: 'ALL', label: 'All', count: items.length },
    { value: 'LOW', label: 'Low stock', count: items.filter(isLow).length },
    { value: 'EXPIRING', label: 'Expiring', count: items.filter((i) => isExpiring(i)).length },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    patientActions.addBatch({ ...batch, quantity: Number(batch.quantity), lowStockThreshold: Number(batch.lowStockThreshold) });
    setBatch(emptyBatch);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        subtitle="Your medicine stock at home."
        action={<button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimary}><Plus size={16} /> Add batch</button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Boxes} label="Medicines" value={items.length} />
        <Stat icon={PackageX} label="Low stock" value={tabs[1].count} tone="red" />
        <Stat icon={AlertTriangle} label="Expiring soon" value={tabs[2].count} tone="amber" />
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Medicine">
              <select name="medicine" value={batch.medicine} onChange={update} className={inputCls}>
                {MEDICINES.map((m) => <option key={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Batch number"><input required name="batchNumber" value={batch.batchNumber} onChange={update} className={inputCls} /></Field>
            <Field label="Expiry date"><input required type="date" name="expiryDate" value={batch.expiryDate} onChange={update} className={inputCls} /></Field>
            <Field label="Quantity"><input required min="1" type="number" name="quantity" value={batch.quantity} onChange={update} className={inputCls} /></Field>
            <Field label="Unit">
              <select name="stockUnit" value={batch.stockUnit} onChange={update} className={inputCls}>
                {DOSAGE_UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Low-stock threshold"><input required min="0" type="number" name="lowStockThreshold" value={batch.lowStockThreshold} onChange={update} className={inputCls} /></Field>
            <Field label="Notes" className="sm:col-span-2 lg:col-span-3"><input name="notes" value={batch.notes} onChange={update} className={inputCls} /></Field>
            <button type="submit" className={btnPrimary}>Save batch</button>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <Tabs tabs={tabs} value={filter} onChange={setFilter} />
        <table className="mt-4 w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr><th className="py-2">Medicine</th><th>Batch</th><th>Expiry</th><th>Stock</th><th>Status</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((i) => (
              <tr key={i.id}>
                <td className="py-3 font-medium text-slate-900">{i.medicine}</td>
                <td className="text-slate-500">{i.batchNumber}</td>
                <td className="text-slate-500">{formatDate(i.expiryDate)}</td>
                <td>
                  <progress value={i.quantity} max={Math.max(i.quantity, i.lowStockThreshold * 4)} className="h-1.5 w-24 accent-teal-500" />
                  <span className="ml-2 text-slate-600">{i.quantity} {i.stockUnit.toLowerCase()}</span>
                </td>
                <td className="space-x-1">
                  {isLow(i) && <Badge tone="red">Low</Badge>}
                  {isExpiring(i) && <Badge tone="amber">Expiring</Badge>}
                  {!isLow(i) && !isExpiring(i) && <Badge tone="green">Healthy</Badge>}
                </td>
                <td className="text-right">
                  <button type="button" onClick={() => consume(i.id)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50">Consume 1</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
