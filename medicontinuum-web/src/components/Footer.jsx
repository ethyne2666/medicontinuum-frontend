import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} MediContinuum. All rights reserved.</p>
        <div className="flex gap-5">
          <Link to="/medicines" className="hover:text-slate-800">Medicines</Link>
          <Link to="/vendors" className="hover:text-slate-800">Pharmacies</Link>
          <Link to="/signup" className="hover:text-slate-800">Sign up</Link>
        </div>
      </div>
    </footer>
  );
}
