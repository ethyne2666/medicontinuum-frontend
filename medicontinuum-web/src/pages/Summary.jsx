import { useState } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { Badge, Card, PageHeader, btnPrimary, btnGhost } from '@/components/ui';
import { usePatient } from '@/store/patientStore';
import { buildSnapshot } from '@/lib/snapshot';
import { generateSummary } from '@/lib/summary';
import { downloadReport } from '@/lib/report';
import { hasGemini, polishSummary } from '@/lib/gemini';

export default function Summary() {
  const state = usePatient();
  const snap = buildSnapshot(state);
  const summary = generateSummary(snap);
  const [ai, setAi] = useState('');
  const [busy, setBusy] = useState(false);

  const polish = async () => {
    setBusy(true);
    try { setAi(await polishSummary(snap, summary.text)); } catch (e) { setAi(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="AI Summary" subtitle={summary.headline}
        action={<button type="button" className={btnPrimary} onClick={() => downloadReport(snap, summary)}><Download size={16} /> Download PDF report</button>} />
      <div className="grid gap-4 md:grid-cols-2">
        {summary.insights.map((i) => (
          <Card key={i.title}><Badge tone={i.tone}>{i.title}</Badge><p className="mt-2 text-sm text-slate-600">{i.text}</p></Card>
        ))}
      </div>
      <Card>
        <h2 className="font-semibold text-slate-900">Next steps</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{summary.actions.map((a) => <li key={a}>{a}</li>)}</ul>
      </Card>
      {hasGemini() && (
        <Card>
          <button type="button" className={btnGhost} disabled={busy} onClick={polish}><Sparkles size={16} /> {busy ? 'Writing…' : 'Rewrite with Gemini'}</button>
          {ai && <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{ai}</p>}
        </Card>
      )}
      <p className="text-xs text-slate-400">Generated from the data in this app. Not medical advice.</p>
    </div>
  );
}
