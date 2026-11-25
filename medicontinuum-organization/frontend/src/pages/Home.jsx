import { Link } from 'react-router-dom';
import { Droplets, FileBadge2, HeartHandshake, Stethoscope } from 'lucide-react';
import { btnGhost, btnPrimary, Card } from '@/components/ui';

const STEPS = [
  { icon: FileBadge2, title: '1. Register', text: 'Hospitals, clinics, labs and pharmacies register with a licence and government ID. Individual doctors register with their doctor ID.' },
  { icon: HeartHandshake, title: '2. Get your 16-digit number', text: 'Every verified registration receives a unique organization number. It is required to create your login.' },
  { icon: Stethoscope, title: '3. Collaborate', text: 'Request or offer doctors, blood, equipment and medicines across the network — and be listed for patients on the patient site.' },
];

export default function Home() {
  return (
    <>
      <section className="bg-gradient-to-br from-indigo-700 to-indigo-900 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">The organization network behind MediContinuum</h1>
          <p className="mx-auto mt-4 max-w-2xl text-indigo-100">Register your hospital, clinic, lab, pharmacy or practice, and share resources with other organizations in real time.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className={`${btnPrimary} !bg-white !text-indigo-700 hover:!bg-indigo-50`}>Register now</Link>
            <Link to="/signup" className={`${btnGhost} !border-indigo-400 !bg-transparent !text-white hover:!bg-indigo-800`}>I have a 16-digit number</Link>
            <Link to="/login" className={`${btnGhost} !border-indigo-400 !bg-transparent !text-white hover:!bg-indigo-800`}>Log in</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <Card key={title}>
            <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={22} /></span>
            <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </Card>
        ))}
      </section>
      <p className="pb-12 text-center text-xs text-slate-400"><Droplets className="mr-1 inline" size={14} />Blood, organ and doctor sharing follows each member’s own legal and clinical protocols.</p>
    </>
  );
}
