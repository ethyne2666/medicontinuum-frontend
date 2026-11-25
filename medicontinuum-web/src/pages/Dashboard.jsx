import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, Clock, PackageX } from 'lucide-react';
import { Card, Img, PageHeader, ProgressRing, Stat, btnPrimary } from '@/components/ui';
import { DoseRow } from '@/components/DoseRow';
import { useDoses } from '@/hooks/useDoses';
import { IMG, USER } from '@/data/mock';
import { usePatient } from '@/store/patientStore';
import { isExpiring, isLow } from '@/utils/inventory';

export default function Dashboard() {
  const { doses, mark, percent } = useDoses();
  const { inventory: INVENTORY } = usePatient();
  const pending = doses.filter((d) => d.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${USER.name.split(' ')[0]}`}
        subtitle="Here is your medicine plan for today."
        action={<Link to="/inventory" className={btnPrimary}>Add stock</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={CalendarCheck} label="Doses today" value={doses.length} />
        <Stat icon={Clock} label="Pending" value={pending} tone="amber" />
        <Stat icon={PackageX} label="Low stock" value={INVENTORY.filter(isLow).length} tone="red" />
        <Stat icon={AlertTriangle} label="Expiring in 30 days" value={INVENTORY.filter((i) => isExpiring(i)).length} tone="sky" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="font-semibold text-slate-900">Today&apos;s doses</h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {doses.map((dose) => <DoseRow key={dose.id} dose={dose} onMark={mark} />)}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card className="flex flex-col items-center text-center">
            <ProgressRing percent={percent} />
            <p className="mt-3 font-semibold text-slate-900">Today&apos;s adherence</p>
            <Link to="/adherence" className="mt-1 text-sm text-teal-700 hover:underline">View full report</Link>
          </Card>
          <div className="relative overflow-hidden rounded-2xl">
            <Img src={IMG.pills} alt="Medicine tablets" className="h-44 w-full" />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/70 to-transparent p-4 text-white">
              <p className="font-semibold">Refill before you run out</p>
              <Link to="/vendors" className="text-sm text-teal-200 hover:underline">Find a pharmacy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
