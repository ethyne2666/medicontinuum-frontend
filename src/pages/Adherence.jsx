import { useState } from 'react';
import { Card, PageHeader, ProgressRing, Tabs } from '@/components/ui';
import { DoseRow } from '@/components/DoseRow';
import { useDoses } from '@/hooks/useDoses';
import { WEEK } from '@/data/mock';

export default function Adherence() {
  const { doses, mark, percent } = useDoses();
  const [filter, setFilter] = useState('ALL');
  const count = (s) => doses.filter((d) => d.status === s).length;
  const visible = filter === 'ALL' ? doses : doses.filter((d) => d.status === filter);

  const tabs = [
    { value: 'ALL', label: 'All', count: doses.length },
    { value: 'PENDING', label: 'Pending', count: count('PENDING') },
    { value: 'TAKEN', label: 'Taken', count: count('TAKEN') },
    { value: 'SKIPPED', label: 'Skipped', count: count('SKIPPED') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Adherence" subtitle="Your dose schedule and statistics." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center">
          <ProgressRing percent={percent} />
          <p className="mt-3 font-semibold text-slate-900">Today</p>
          <p className="text-sm text-slate-500">{count('TAKEN')} taken · {count('SKIPPED')} skipped</p>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Last 7 days</h2>
          <ul className="mt-3 space-y-2">
            {WEEK.map(({ day, percent: value }) => (
              <li key={day} className="flex items-center gap-3 text-sm">
                <span className="w-9 text-slate-500">{day}</span>
                <progress value={value} max="100" className="h-2 flex-1 accent-teal-500" />
                <span className="w-10 text-right font-medium">{value}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <Tabs tabs={tabs} value={filter} onChange={setFilter} />
        <ul className="mt-3 divide-y divide-slate-100">
          {visible.map((dose) => <DoseRow key={dose.id} dose={dose} onMark={mark} />)}
        </ul>
      </Card>
    </div>
  );
}
