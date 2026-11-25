import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, Boxes, ClipboardList, ShieldCheck, Store, Users } from 'lucide-react';
import { Img, btnGhost, btnPrimary } from '@/components/ui';
import { IMG, avatar } from '@/data/mock';

const features = [
  { icon: BellRing, title: 'Dose reminders', text: 'Daily schedules with one-tap taken or skipped tracking.', to: '/adherence' },
  { icon: ClipboardList, title: 'Digital prescriptions', text: 'Every prescription from your doctors, in one place.', to: '/prescriptions' },
  { icon: Boxes, title: 'Smart inventory', text: 'Low-stock and expiry alerts before you run out.', to: '/inventory' },
  { icon: Users, title: 'Family care', text: 'Connect with family and help them stay on track.', to: '/family' },
  { icon: Store, title: 'Nearby pharmacies', text: 'Find trusted vendors to refill in minutes.', to: '/vendors' },
  { icon: ShieldCheck, title: 'Private & secure', text: 'Your health data stays yours.', to: '/profile' },
];

export default function Home() {
  return (
    <>
      <section className="bg-gradient-to-b from-teal-50 to-slate-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-700 shadow-sm">
              <ShieldCheck size={14} /> Patient medicine tracking
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Never miss a dose. Never run out of medicine.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              MediContinuum connects patients, families, doctors and pharmacies so every prescription is taken on time and every refill is planned.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className={btnPrimary}>Get started <ArrowRight size={16} /></Link>
              <Link to="/login" className={btnGhost}>Log in</Link>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[12, 32, 47, 15].map((n) => (
                  <img key={n} src={avatar(n)} alt="" width="36" height="36" className="size-9 rounded-full border-2 border-white" />
                ))}
              </div>
              <p className="text-sm text-slate-500">Trusted by patients and families</p>
            </div>
          </div>
          <Img src={IMG.hero} alt="Assorted medicines and pills" className="h-80 w-full rounded-3xl shadow-xl lg:h-[28rem]" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-slate-900">Everything in one platform</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text, to }) => (
            <Link key={title} to={to} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-600"><Icon size={22} /></span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 lg:grid-cols-2">
        <Img src={IMG.family} alt="Family holding hands together at the beach" className="h-80 w-full rounded-3xl" />
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Built for the whole family</h2>
          <p className="mt-3 text-slate-600">
            Link parents, children and guardians. See who needs a refill and never wonder whether a dose was taken.
          </p>
          <Link to="/signup" className={`${btnPrimary} mt-6`}>Create your account</Link>
        </div>
      </section>
    </>
  );
}
