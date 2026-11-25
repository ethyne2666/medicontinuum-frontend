import { MapPin, Phone, Star } from 'lucide-react';
import { Badge, Card, Img, PageHeader, btnGhost } from '@/components/ui';
import { VENDORS } from '@/data/mock';

export default function Vendors() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pharmacies" subtitle="Trusted vendors near you." />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {VENDORS.map((v) => (
          <Card key={v.id} className="overflow-hidden p-0">
            <Img src={v.image} alt={v.name} className="h-40 w-full" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{v.name}</h2>
                <Badge tone={v.open ? 'green' : 'red'}>{v.open ? 'Open' : 'Closed'}</Badge>
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} /> {v.area} · {v.distance}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Star size={14} className="fill-amber-400 text-amber-400" /> {v.rating}</p>
              <button type="button" className={`${btnGhost} mt-4 w-full`}><Phone size={16} /> Contact</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
