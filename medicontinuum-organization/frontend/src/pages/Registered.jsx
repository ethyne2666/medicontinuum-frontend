import { Link, Navigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Download } from 'lucide-react';
import { CopyButton, btnGhost, btnPrimary } from '@/components/ui';

export default function Registered() {
  const { state } = useLocation();
  if (!state?.orgNumber) return <Navigate to="/register" replace />;

  const download = () => {
    const blob = new Blob([`MediContinuum organization number\n\nName: ${state.name}\nNumber: ${state.orgNumberFormatted}\nRegistered email: ${state.email}\n\nKeep this safe. You need it (plus your registered email) to create your login.\n`], { type: 'text/plain' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'medicontinuum-organization-number.txt' });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-14 text-center">
      <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
      <h1 className="mt-4 text-3xl font-bold text-slate-900">You’re registered, {state.name}</h1>
      <p className="mt-2 text-sm text-slate-500">This is your unique 16-digit organization number.</p>
      <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-6">
        <p className="font-mono text-3xl font-bold tracking-widest text-indigo-800" aria-label="Organization number">{state.orgNumberFormatted}</p>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <CopyButton text={state.orgNumber} label="Copy number" />
        <button type="button" onClick={download} className={btnGhost}><Download size={16} /> Download</button>
      </div>
      <p className="mt-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Save it now. You can’t sign up or log in without it, and it isn’t shown again after you leave this page.</p>
      <Link to="/signup" state={{ orgNumber: state.orgNumber, email: state.email }} className={`${btnPrimary} mt-6`}>Continue: create my login</Link>
    </div>
  );
}
