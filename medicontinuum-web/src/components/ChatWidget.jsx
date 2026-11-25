import { useRef, useState } from 'react';
import { ImagePlus, Mic, Send, Sparkles, X } from 'lucide-react';
import { MEDICINES } from '@/data/mock';
import { patientActions, stockOf, usePatient } from '@/store/patientStore';
import { buildSnapshot } from '@/lib/snapshot';
import { generateSummary } from '@/lib/summary';
import { askGemini, hasGemini } from '@/lib/gemini';

const findMeds = (t) => MEDICINES.filter((m) => t.toLowerCase().includes(m.name.toLowerCase()) || t.toLowerCase().includes(m.generic.split(' ')[0].toLowerCase()));

export default function ChatWidget() {
  const state = usePatient();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([{ role: 'bot', text: 'Hi! Tell me what you took (text, voice or a photo), or ask about stock and doses.' }]);
  const fileRef = useRef(null);
  const say = (m) => setMsgs((p) => [...p, m]);

  const log = (name, source) => {
    const r = patientActions.recordIntake({ medicine: name, source });
    return `Logged ${name}. ${r.left ?? 0} left in stock.`;
  };

  const send = async (text, source = 'text') => {
    const t = text.trim();
    if (!t) return;
    say({ role: 'user', text: t }); setInput('');
    const meds = findMeds(t);
    const snap = buildSnapshot(state);
    if (/\b(took|taken|had|ate)\b/i.test(t) && meds.length) return say({ role: 'bot', text: meds.map((m) => log(m.name, source)).join('\n') });
    if (/\b(left|stock|how many)\b/i.test(t) && meds.length) return say({ role: 'bot', text: meds.map((m) => `${m.name}: ${stockOf(state.inventory, m.name)} left`).join('\n') });
    if (/\b(low|refill)\b/i.test(t)) return say({ role: 'bot', text: snap.low.length ? `Low: ${snap.low.map((b) => `${b.medicine} (${b.quantity})`).join(', ')}` : 'Nothing is low.' });
    if (/\b(due|pending|today|next)\b/i.test(t)) { const p = state.doses.filter((d) => d.status === 'PENDING'); return say({ role: 'bot', text: p.length ? p.map((d) => `${d.time} ${d.medicine}`).join('\n') : 'All done for today!' }); }
    if (/summary|report|adherence/i.test(t)) return say({ role: 'bot', text: generateSummary(snap).text });
    if (hasGemini()) { try { return say({ role: 'bot', text: await askGemini({ prompt: t, snapshot: snap, history: msgs }) }); } catch (e) { return say({ role: 'bot', text: e.message }); } }
    say({ role: 'bot', text: 'Try: "I took Metformin", "how many Paracetamol left", "what is due today", or "summary".' });
  };

  const voice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return say({ role: 'bot', text: 'Voice input is not supported in this browser (try Chrome).' });
    const r = new SR(); r.lang = 'en-IN';
    r.onresult = (e) => send(e.results[0][0].transcript, 'voice');
    r.start();
  };

  // Photo: no server to read it, so show the picture and ask which medicine it is.
  const photo = (file) => {
    if (!file) return;
    say({ role: 'user', text: '📷 Photo of my medicine', img: URL.createObjectURL(file) });
    say({ role: 'bot', text: 'Which medicine is this?', choices: MEDICINES.filter((m) => m.status === 'ACTIVE').map((m) => m.name) });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} aria-label="Assistant" className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700">
        {open ? <X /> : <Sparkles />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="bg-teal-600 px-4 py-3 font-semibold text-white">MediContinuum Assistant</div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                <div className={`inline-block max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-left ${m.role === 'user' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                  {m.img && <img src={m.img} alt="" className="mb-1 max-h-32 rounded-lg" />}{m.text}
                </div>
                {m.choices && <div className="mt-1 flex flex-wrap gap-1">{m.choices.map((c) => (
                  <button key={c} type="button" onClick={() => say({ role: 'bot', text: log(c, 'image') })} className="rounded-full border border-teal-200 px-2.5 py-1 text-xs text-teal-700 hover:bg-teal-50">{c}</button>))}</div>}
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-1 border-t border-slate-200 p-2">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => photo(e.target.files[0])} />
            <button type="button" aria-label="Photo" onClick={() => fileRef.current.click()} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ImagePlus size={18} /></button>
            <button type="button" aria-label="Voice" onClick={voice} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Mic size={18} /></button>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="I took Metformin…" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500" />
            <button type="submit" aria-label="Send" className="rounded-lg bg-teal-600 p-2 text-white"><Send size={18} /></button>
          </form>
        </div>
      )}
    </>
  );
}
