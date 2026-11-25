import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, HeartPulse, Menu, X } from 'lucide-react';
import { btnPrimary } from '@/components/ui';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/medicines', label: 'Medicines' },
  { to: '/prescriptions', label: 'Prescriptions' },
  { to: '/vendors', label: 'Pharmacies' },
];

const linkCls = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:text-slate-900'
  }`;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="grid size-9 place-items-center rounded-xl bg-teal-600 text-white">
            <HeartPulse size={20} />
          </span>
          MediContinuum
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkCls}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/notifications" aria-label="Notifications" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
            <Bell size={20} />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
          </Link>
          <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Log in</Link>
          <Link to="/signup" className={btnPrimary}>Sign up</Link>
        </div>

        <button type="button" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 md:hidden">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setOpen(false)} className={linkCls}>
              {link.label}
            </NavLink>
          ))}
          <div className="flex gap-2 pt-2">
            <Link to="/login" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold">Log in</Link>
            <Link to="/signup" onClick={() => setOpen(false)} className={`${btnPrimary} flex-1`}>Sign up</Link>
          </div>
        </div>
      )}
    </header>
  );
}
