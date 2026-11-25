import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Building2, CheckCheck, ClipboardList, Eye, EyeOff,
  Inbox, LayoutDashboard, LogOut, MapPin, Network, Repeat, Send,
  ShieldCheck, UserRound,
} from 'lucide-react';
import { Badge, Card, PageHeader, Stat, Tabs, btnGhost } from '@/components/ui';

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sharing', label: 'Resource sharing', icon: Repeat },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

const demoResources = [
  { resource: 'Cardiology · 72 h', category: 'Doctor', status: 'Urgent', detail: 'Needed by JNM Hospital Kalyani · Kalyani', note: 'Cover for 3 OT days.', direction: 'Needs' },
  { resource: '12 units · Rbc · O+', category: 'Blood', status: 'Open', detail: 'Nadia Lifeline Blood Bank · Kalyani', note: 'Screened units available this week.', direction: 'Offers' },
  { resource: 'Paracetamol 500 mg × 200', category: 'Medicine', status: 'Open', detail: 'Kalyani Care Pharmacy · Kalyani', note: 'Surplus strips, 8+ months to expiry.', direction: 'Offers' },
];

const networkMembers = [
  { name: 'S.N. Medical College & Hospital', city: 'Agra', type: 'Medical college' },
  { name: 'North Bengal Medical College', city: 'Siliguri', type: 'Medical college' },
  { name: 'Kalyani Government Medical College', city: 'Kalyani', type: 'Government hospital' },
];

function DashboardContent() {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader title="Hello, AIIMS Kalyani" subtitle="Hospital · Kalyani, West Bengal" />
      <Card className="flex flex-wrap items-center justify-between gap-4 !border-indigo-100 !bg-indigo-50">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Your organization number</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-indigo-900">{reveal ? '0000 0000 0000 0014' : '•••• •••• •••• 0014'}</p>
        </div>
        <button type="button" className={btnGhost} onClick={() => setReveal((value) => !value)}><span className="inline-flex items-center gap-2">{reveal ? <EyeOff size={16} /> : <Eye size={16} />}{reveal ? 'Hide' : 'Show'}</span></button>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Inbox} label="Open for you" value="3" tone="amber" />
        <Stat icon={Send} label="My open posts" value="1" />
        <Stat icon={CheckCheck} label="Fulfilled by me" value="0" tone="green" />
        <Stat icon={Network} label="Members on network" value="10" tone="sky" />
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Needs your attention</h2>
          <span className="text-sm font-semibold text-indigo-700">View all →</span>
        </div>
        <Card className="divide-y divide-slate-100 !p-0">
          {demoResources.map((item) => (
            <div key={item.resource} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
              <div><p className="font-medium text-slate-900">{item.resource}</p><p className="text-sm text-slate-500">{item.direction === 'Needs' ? 'Needed by' : 'Offered by'} {item.detail}</p></div>
              <div className="flex gap-2"><Badge tone="indigo">{item.category}</Badge>{item.status === 'Urgent' && <Badge tone="amber">Urgent</Badge>}</div>
            </div>
          ))}
        </Card>
      </div>
      <div className="text-xs text-slate-400">
        All organization details and activity shown here are sample demo data.
      </div>
    </div>
  );
}

function SharingContent() {
  const [scope, setScope] = useState('incoming');
  const tabs = [
    { value: 'incoming', label: 'Incoming' },
    { value: 'mine', label: 'My posts' },
    { value: 'responded', label: 'Accepted by me' },
  ];
  const resources = scope === 'incoming' ? demoResources : scope === 'mine' ? [demoResources[1]] : [demoResources[2]];

  return (
    <div className="space-y-6">
      <PageHeader title="Resource sharing" subtitle="Request or offer doctors, blood, organs, equipment and medicines. Updates arrive automatically." action={<Badge>Demo mode</Badge>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={tabs} value={scope} onChange={setScope} />
        <Badge>All resources</Badge>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {resources.map((item) => (
          <Card key={item.resource}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2"><Badge tone={item.direction === 'Needs' ? 'amber' : 'green'}>{item.direction}</Badge><Badge tone="indigo">{item.category}</Badge>{item.status === 'Urgent' && <Badge tone="amber">Urgent</Badge>}</div>
              <Badge tone="sky">{item.status}</Badge>
            </div>
            <h2 className="mt-3 font-semibold text-slate-900">{item.resource}</h2>
            <p className="mt-1 text-sm text-slate-500">{item.detail} · entire network</p>
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500">{item.note}</p>
            <p className="mt-3 text-xs text-slate-400">Sample listing · Demo data</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NetworkContent() {
  return (
    <div className="space-y-6">
      <PageHeader title="Network" subtitle="Verified hospitals and medical organizations in your network." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {networkMembers.map((member) => (
          <Card key={member.name}>
            <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Building2 size={21} /></span>
            <h2 className="mt-4 font-semibold text-slate-900">{member.name}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} />{member.city}</p>
            <div className="mt-3 flex items-center justify-between"><Badge tone="indigo">{member.type}</Badge><ArrowUpRight size={17} className="text-slate-400" /></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProfileContent() {
  const rows = [
    ['Organization name', 'AIIMS Kalyani'],
    ['Organization type', 'Government medical college'],
    ['Location', 'Kalyani, West Bengal, India'],
    ['Contact email', 'admin@aiimskalyani.edu.in'],
    ['Verification', 'Verified organization'],
    ['Member ID', 'ORG-23••-DEMO'],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Organization profile" subtitle="The details visible to your verified network." action={<Badge tone="green">Verified</Badge>} />
      <Card>
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <span className="grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Building2 size={26} /></span>
          <div><h2 className="text-lg font-semibold text-slate-900">AIIMS Kalyani</h2><p className="text-sm text-slate-500">Government medical college</p></div>
        </div>
        <dl className="divide-y divide-slate-100">
          {rows.map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-900">{value}</dd></div>)}
        </dl>
      </Card>
    </div>
  );
}

export default function Demo() {
  const [section, setSection] = useState('dashboard');
  const navigate = useNavigate();
  const activeSection = SECTIONS.find((item) => item.id === section);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <p><span className="font-semibold">Demo mode</span> · Previewing the AIIMS Kalyani organization portal. No sign-in required.</p>
        <button type="button" onClick={() => navigate('/login')} className="font-semibold text-sky-800 underline underline-offset-2">Back to login</button>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0 lg:self-start">
          <nav aria-label="Demo portal navigation" className="flex gap-1 overflow-x-auto lg:flex-col">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setSection(id)} aria-current={section === id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${section === id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>
                <Icon size={18} />{label}
              </button>
            ))}
            <button type="button" onClick={() => navigate('/login')} className="flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-white">
              <LogOut size={18} />Log out
            </button>
          </nav>
          <div className="mt-4 hidden items-center gap-2 px-3 text-xs text-emerald-600 lg:flex"><ShieldCheck size={15} /> Synced with patient site</div>
        </aside>
        <main className="min-w-0 flex-1" aria-live="polite">
          <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <span>AIIMS Kalyani</span><span>/</span><span className="text-indigo-600">{activeSection?.label}</span>
          </div>
          {section === 'dashboard' && <DashboardContent />}
          {section === 'sharing' && <SharingContent />}
          {section === 'network' && <NetworkContent />}
          {section === 'profile' && <ProfileContent />}
        </main>
      </div>
    </div>
  );
}
