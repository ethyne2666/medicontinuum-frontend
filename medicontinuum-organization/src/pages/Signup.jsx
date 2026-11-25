import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthShell, AuthLink } from '@/components/AuthShell';
import { ErrorBanner, Field, btnPrimary, inputCls } from '@/components/ui';
import { useAuth } from '@/auth/AuthContext';
import { groupDigits } from '@/constants';

export default function Signup() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ orgNumber: groupDigits(state?.orgNumber ?? ''), email: state?.email ?? '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setErrors({});
    if (form.password !== form.confirm) return setErrors({ confirm: 'Passwords do not match' });
    setBusy(true);
    try {
      await signup({ orgNumber: form.orgNumber.replace(/\s/g, ''), email: form.email, password: form.password });
      navigate('/portal', { replace: true });
    } catch (err) {
      setError(err); setErrors(err.fields ?? {});
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create your login" subtitle="Only the holder of a 16-digit organization number can sign up."
      footer={<>Already have a login? <AuthLink to="/login">Log in</AuthLink> · No number yet? <AuthLink to="/register">Register</AuthLink></>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="16-digit organization number" error={errors.orgNumber}>
          <input required inputMode="numeric" autoComplete="off" value={form.orgNumber} onChange={(e) => set('orgNumber', groupDigits(e.target.value))} placeholder="0000 0000 0000 0000" className={`${inputCls} font-mono tracking-wider`} />
        </Field>
        <Field label="Registered email" error={errors.email} hint="Must match the email used at registration">
          <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errors.password} hint="8+ characters, a letter and a number">
            <input required type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Confirm password" error={errors.confirm}>
            <input required type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <ErrorBanner error={error} />
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? 'Creating…' : 'Create login'}</button>
      </form>
    </AuthShell>
  );
}
