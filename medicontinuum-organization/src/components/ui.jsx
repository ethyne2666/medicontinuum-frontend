import { useState } from 'react';
import { AlertCircle, Check, Copy, Loader2 } from 'lucide-react';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60';
export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60';
export const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

export function Card({ children, className = '' }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

const tones = {
  slate: 'bg-slate-100 text-slate-600',
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  sky: 'bg-sky-50 text-sky-700',
};

export function Badge({ tone = 'slate', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ icon: Icon, label, value, tone = 'indigo' }) {
  return (
    <Card className="flex items-center gap-4">
      <span className={`grid size-12 place-items-center rounded-xl ${tones[tone]}`}><Icon size={22} /></span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value ?? '–'}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      <span className="mt-1 block">{children}</span>
      {hint && !error && <span className="mt-1 block text-xs font-normal text-slate-400">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button key={t.value} type="button" onClick={() => onChange(t.value)}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${value === t.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
      <Loader2 className="animate-spin" size={18} /> {label}
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1">{error.message}</div>
      {onRetry && <button type="button" onClick={onRetry} className="font-semibold underline">Retry</button>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      {Icon && <Icon className="mx-auto text-slate-300" size={36} />}
      <p className="mt-3 font-semibold text-slate-700">{title}</p>
      {children && <p className="mt-1 text-sm text-slate-500">{children}</p>}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <button type="button" onClick={copy} className={btnGhost}>
      {done ? <Check size={16} /> : <Copy size={16} />} {done ? 'Copied' : label}
    </button>
  );
}
