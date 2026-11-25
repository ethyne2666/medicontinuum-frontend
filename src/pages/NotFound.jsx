import { Link } from 'react-router-dom';
import { btnPrimary } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-6xl font-bold text-teal-600">404</p>
        <p className="mt-3 text-slate-600">This page does not exist.</p>
        <Link to="/" className={`${btnPrimary} mt-6`}>Back to home</Link>
      </div>
    </div>
  );
}
