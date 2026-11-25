import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function AuthShell({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[5fr_7fr]">
      <div className="relative hidden bg-gradient-to-br from-indigo-700 to-indigo-900 lg:block">
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <ShieldCheck size={32} />
          <p className="mt-4 text-3xl font-bold">One verified identity for every hospital, clinic and doctor.</p>
          <p className="mt-2 text-indigo-200">Register once, receive your 16-digit organization number, and share doctors, blood and resources across the network.</p>
        </div>
      </div>
      <div className="flex items-start justify-center px-4 py-10 lg:items-center">
        <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>}
        </div>
      </div>
    </div>
  );
}

export const AuthLink = ({ to, children }) => (
  <Link to={to} className="font-semibold text-indigo-700 hover:underline">{children}</Link>
);
