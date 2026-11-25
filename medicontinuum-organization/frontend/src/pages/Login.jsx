import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    </AuthShell>
  );
}
