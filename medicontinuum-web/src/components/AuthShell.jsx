import { Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { Img } from '@/components/ui';
import { IMG } from '@/data/mock';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Img src={IMG.auth} alt="Doctor consulting a patient" className="absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-900/80 to-teal-700/20" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <HeartPulse size={32} />
          <p className="mt-4 text-3xl font-bold">Care that continues after the clinic.</p>
          <p className="mt-2 text-teal-100">Track every dose, every refill, for you and your family.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function AuthLink({ to, children }) {
  return <Link to={to} className="font-semibold text-teal-700 hover:underline">{children}</Link>;
}
