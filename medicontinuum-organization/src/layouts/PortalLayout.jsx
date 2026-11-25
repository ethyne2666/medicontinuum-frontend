import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Network, Repeat, UserCog } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Spinner } from '@/components/ui';
import { SyncBadge } from '@/components/SyncBadge';

const NAV = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/shares', label: 'Resource sharing', icon: Repeat },
  { to: '/portal/network', label: 'Network', icon: Network },
  { to: '/portal/profile', label: 'Profile', icon: UserCog },
];

export default function PortalLayout() {
  const { me, loading, logout } = useAuth();
  const navigate = useNavigate();
  if (loading) return <Spinner />;
  if (!me) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
      <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:w-56 lg:shrink-0 lg:flex-col lg:self-start">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
        <button type="button" onClick={() => { logout(); navigate('/'); }}
          className="flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white">
          <LogOut size={18} /> Log out
        </button>
        <div className="hidden px-1 pt-3 lg:block"><SyncBadge /></div>
      </nav>
      <main className="min-w-0 flex-1"><Outlet /></main>
    </div>
  );
}
