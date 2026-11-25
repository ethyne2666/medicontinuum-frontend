import { Link } from 'react-router-dom';
import { btnPrimary } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-5xl font-bold text-indigo-600">404</p>
        <p className="mt-2 text-slate-500">That page doesn’t exist.</p>
        <Link to="/" className={`${btnPrimary} mt-6`}>Back home</Link>
      </div>
    </div>
  );
}
