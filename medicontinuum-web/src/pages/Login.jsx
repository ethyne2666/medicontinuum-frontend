import { useNavigate } from 'react-router-dom';
import { AuthShell, AuthLink } from '@/components/AuthShell';
import { Field, btnPrimary, inputCls } from '@/components/ui';

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your medicines."
      footer={<>New here? <AuthLink to="/signup">Create an account</AuthLink></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email"><input required type="email" className={inputCls} placeholder="you@example.com" /></Field>
        <Field label="Password"><input required type="password" className={inputCls} placeholder="••••••••" /></Field>
        <button type="submit" className={`${btnPrimary} w-full`}>Log in</button>
      </form>
    </AuthShell>
  );
}
