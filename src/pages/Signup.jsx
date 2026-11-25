import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell, AuthLink } from '@/components/AuthShell';
import { Field, btnGhost, btnPrimary, inputCls } from '@/components/ui';
import { BLOOD_GROUPS, GENDERS } from '@/data/mock';
import { humanize } from '@/utils/date';

const initial = {
  fullName: '', email: '', phone: '', password: '', confirm: '', role: 'PATIENT',
  dateOfBirth: '', gender: 'MALE', bloodGroup: 'O_POSITIVE',
  city: '', state: '', country: 'India', postalCode: '',
  emergencyContactName: '', emergencyContactPhone: '',
};

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');

  const update = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (form.password.length < 8) return setError('Password must be at least 8 characters.');
      if (form.password !== form.confirm) return setError('Passwords do not match.');
      setError('');
      return setStep(2);
    }
    navigate('/dashboard');
  };

  const input = (name, props = {}) => (
    <input name={name} value={form[name]} onChange={update} className={inputCls} {...props} />
  );
  const select = (name, options) => (
    <select name={name} value={form[name]} onChange={update} className={inputCls}>
      {options.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
    </select>
  );

  return (
    <AuthShell
      title="Create your account"
      subtitle={`Step ${step} of 2 · ${step === 1 ? 'Account details' : 'Health profile'}`}
      footer={<>Already registered? <AuthLink to="/login">Log in</AuthLink></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 ? (
          <>
            <Field label="Full name">{input('fullName', { required: true, placeholder: 'Aarav Sharma' })}</Field>
            <Field label="Email">{input('email', { required: true, type: 'email', placeholder: 'you@example.com' })}</Field>
            <Field label="Phone">{input('phone', { required: true, type: 'tel', placeholder: '+91 98765 43210' })}</Field>
            <Field label="I am a">{select('role', ['PATIENT', 'DOCTOR'])}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password">{input('password', { required: true, type: 'password' })}</Field>
              <Field label="Confirm password">{input('confirm', { required: true, type: 'password' })}</Field>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date of birth">{input('dateOfBirth', { required: true, type: 'date' })}</Field>
              <Field label="Gender">{select('gender', GENDERS)}</Field>
              <Field label="Blood group">{select('bloodGroup', BLOOD_GROUPS)}</Field>
              <Field label="Postal code">{input('postalCode', { required: true })}</Field>
              <Field label="City">{input('city', { required: true })}</Field>
              <Field label="State">{input('state', { required: true })}</Field>
            </div>
            <Field label="Country">{input('country', { required: true })}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Emergency contact">{input('emergencyContactName', { required: true })}</Field>
              <Field label="Emergency phone">{input('emergencyContactPhone', { required: true, type: 'tel' })}</Field>
            </div>
          </>
        )}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          {step === 2 && <button type="button" onClick={() => setStep(1)} className={btnGhost}>Back</button>}
          <button type="submit" className={`${btnPrimary} flex-1`}>{step === 1 ? 'Continue' : 'Create account'}</button>
        </div>
      </form>
    </AuthShell>
  );
}
