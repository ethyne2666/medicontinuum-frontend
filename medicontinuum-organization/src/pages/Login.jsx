import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell, AuthLink } from '@/components/AuthShell';
import { ErrorBanner, Field, btnPrimary, inputCls } from '@/components/ui';
import { useAuth } from '@/auth/AuthContext';
import { groupDigits } from '@/constants';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [orgNumber, setOrgNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await login(orgNumber.replace(/\s/g, ''), password);
      navigate('/portal', { replace: true });
    } catch (err) { setError(err); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in with your 16-digit organization number."
      footer={<>First time? <AuthLink to="/register">Register</AuthLink> · <AuthLink to="/signup">Create login</AuthLink></>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Organization number">
          <input required inputMode="numeric" autoComplete="username" value={orgNumber} onChange={(e) => setOrgNumber(groupDigits(e.target.value))} placeholder="0000 0000 0000 0000" className={`${inputCls} font-mono tracking-wider`} />
        </Field>
        <Field label="Password">
          <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </Field>
        <ErrorBanner error={error} />
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        OR
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <Link to="/demo" className="inline-flex w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
        Explore the AIIMS Kalyani demo
      </Link>
    </AuthShell>
  );
}
