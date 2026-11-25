import { NavLink, Outlet } from 'react-router-dom';
import { APP_NAV } from '@/config/nav';
import ChatWidget from '@/components/ChatWidget';

export default function AppLayout() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
      <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:w-56 lg:shrink-0 lg:flex-col lg:self-start">
        {APP_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}
