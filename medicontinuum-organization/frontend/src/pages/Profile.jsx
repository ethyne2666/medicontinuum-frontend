import { Badge, Card, CopyButton, PageHeader } from '@/components/ui';
import { useAuth } from '@/auth/AuthContext';
import { entityTypeLabel, humanize } from '@/constants';

const Row = ({ label, value }) => value ? (
  <div className="flex flex-wrap justify-between gap-2 py-3 text-sm">
    <dt className="text-slate-500">{label}</dt>
    <dd className="font-medium text-slate-900">{value}</dd>
  </div>
) : null;

export default function Profile() {
  const { me } = useAuth();
  const isDoctor = me.kind === 'DOCTOR';
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Registration details verified at sign-up." action={<Badge tone="green">Verified · Active</Badge>} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Organization number</p>
            <p className="font-mono text-xl font-bold tracking-widest text-slate-900">{me.orgNumberFormatted}</p>
          </div>
          <CopyButton text={me.orgNumber} />
        </div>
      </Card>
      <Card>
        <dl className="divide-y divide-slate-100">
          <Row label="Name" value={me.name} />
          <Row label="Type" value={entityTypeLabel(me)} />
          <Row label="Specialization" value={me.specialization} />
          <Row label="Licence number" value={me.licenseNumber} />
          <Row label="Government ID" value={me.govIdType && `${humanize(me.govIdType)} · ${me.govIdMasked}`} />
          <Row label={isDoctor ? 'Doctor ID' : null} value={me.doctorRegNumber} />
          <Row label="Medical council" value={me.council} />
          <Row label="Contact person" value={!isDoctor && me.contactPerson} />
          <Row label="Email" value={me.email} />
          <Row label="Phone" value={me.phone} />
          <Row label="Address" value={[me.address, me.city, me.state, me.postalCode, me.country].filter(Boolean).join(', ')} />
          <Row label="Public ID (shown to other members)" value={me.publicId} />
        </dl>
      </Card>
    </div>
  );
}
