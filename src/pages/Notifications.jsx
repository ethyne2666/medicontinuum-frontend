import { useState } from 'react';
import { AlertTriangle, Bell, Boxes, Users } from 'lucide-react';
import { Card, PageHeader, Tabs, btnGhost } from '@/components/ui';
import { NOTIFICATIONS } from '@/data/mock';

const icons = { DOSE: Bell, STOCK: Boxes, EXPIRY: AlertTriangle, FAMILY: Users };

export default function Notifications() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState('ALL');

  const unread = items.filter((n) => !n.read).length;
  const visible = filter === 'UNREAD' ? items.filter((n) => !n.read) : items;
  const markRead = (id) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        action={<button type="button" onClick={markAll} className={btnGhost}>Mark all as read</button>}
      />
      <Tabs
        tabs={[{ value: 'ALL', label: 'All', count: items.length }, { value: 'UNREAD', label: 'Unread', count: unread }]}
        value={filter}
        onChange={setFilter}
      />
      <ul className="space-y-3">
        {visible.map((n) => {
          const Icon = icons[n.type];
          return (
            <li key={n.id}>
              <Card className={`flex items-start gap-4 ${n.read ? '' : 'border-teal-200 bg-teal-50/40'}`}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600"><Icon size={18} /></span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  <p className="text-sm text-slate-500">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{n.time}</p>
                </div>
                {!n.read && (
                  <button type="button" onClick={() => markRead(n.id)} className="text-xs font-semibold text-teal-700 hover:underline">Mark read</button>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && <p className="text-center text-slate-500">You are all caught up.</p>}
    </div>
  );
}
