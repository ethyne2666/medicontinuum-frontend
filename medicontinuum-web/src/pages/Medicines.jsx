import { useState } from 'react';
import { Search } from 'lucide-react';
import { Badge, Card, Img, PageHeader, inputCls } from '@/components/ui';
import { MEDICINES } from '@/data/mock';

export default function Medicines() {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const visible = MEDICINES.filter((m) => `${m.name} ${m.generic} ${m.category}`.toLowerCase().includes(term));

  return (
    <div className="space-y-6">
      <PageHeader title="Medicines" subtitle="Search the medicine catalogue." />
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, generic or category" className={`${inputCls} pl-10`} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((m) => (
          <Card key={m.id} className="overflow-hidden p-0">
            <Img src={m.image} alt={m.name} className="h-40 w-full" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{m.name}</h2>
                <Badge tone={m.status === 'ACTIVE' ? 'green' : 'slate'}>{m.status}</Badge>
              </div>
              <p className="text-sm text-slate-500">{m.generic} · {m.strength}</p>
              <div className="mt-3"><Badge tone="teal">{m.category}</Badge></div>
            </div>
          </Card>
        ))}
      </div>
      {visible.length === 0 && <p className="text-center text-slate-500">No medicines found.</p>}
    </div>
  );
}
