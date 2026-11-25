import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { btnPrimary } from '@/components/ui';

const PATIENT_SITE = import.meta.env.VITE_PATIENT_URL ?? 'http://localhost:5173';

export function Navbar() {
  const { me } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white"><Building2 size={20} /></span>
          MediContinuum <span className="hidden text-sm font-medium text-indigo-600 sm:inline">Organization</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <a href={PATIENT_SITE} className="hidden rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">Patient site</a>
          {me ? (
            <Link to="/portal" className={btnPrimary}>Open portal</Link>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900">Log in</Link>
              <Link to="/register" className={btnPrimary}>Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
