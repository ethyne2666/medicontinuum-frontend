import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Camera, CalendarCheck, Check, ChevronLeft, ChevronRight,
  Clock, Mic, Minus, PackageX, Pencil, Plus, Square, X,
} from 'lucide-react';
import { Card, Img, PageHeader, ProgressRing, Stat, btnPrimary } from '@/components/ui';
import { DoseRow } from '@/components/DoseRow';
import { useDoses } from '@/hooks/useDoses';
import { IMG, USER } from '@/data/mock';
import { usePatient } from '@/store/patientStore';
import { isExpiring, isLow } from '@/utils/inventory';

/* ------------------------------------------------------------------ */
/* Sample tablets (real photos, with a drawn fallback if one fails)    */
/* ------------------------------------------------------------------ */
const PASTELS = ['#f1f5f9', '#fef3c7', '#ffe4e6', '#dbeafe', '#dcfce7', '#ede9fe'];

// Builds the tablet list from today's doses (same tablets as the "Today's doses" card).
// If your dose objects use other field names, change them here.
function tabletsFromDoses(doses) {
  const seen = new Set();
  const out = [];
  doses.forEach((d, i) => {
    const name = d.name || d.medicine || d.medicineName || d.drug || d.title;
    if (!name) return;
    const strength = d.strength || d.dosage || d.dose || '';
    const key = `${name}|${strength}`.toLowerCase();
    if (seen.has(key)) return; // same tablet at several times a day appears once
    seen.add(key);
    out.push({ id: key, name, strength, img: d.image || d.img || d.photo || d.imageUrl || '', color: PASTELS[i % PASTELS.length] });
  });
  return out;
}

function TabletImg({ tablet, className = '' }) {
  const [failed, setFailed] = useState(!tablet.img);
  if (failed) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ background: tablet.color || '#f1f5f9' }}>
        <svg viewBox="0 0 64 32" className="h-1/3 w-1/2" aria-hidden="true">
          <rect x="2" y="2" width="60" height="28" rx="14" fill="#fff" stroke="#0f766e" strokeWidth="2" />
          <path d="M32 2v28" stroke="#0f766e" strokeWidth="2" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={tablet.img}
      alt={`${tablet.name} ${tablet.strength || ''}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const NUMBER_WORDS = { one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

function parseQty(text) {
  const t = text.toLowerCase();
  const digit = t.match(/\d+/);
  if (digit) return Math.min(parseInt(digit[0], 10), 20);
  for (const w of t.split(/\s+/)) if (NUMBER_WORDS[w]) return NUMBER_WORDS[w];
  return null;
}

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

// Stand-in history so the charts are not empty. Replace with your real API data.
function sampleHistory(date) {
  const seed = (date.getDate() * 7 + date.getMonth() * 3) % 10;
  if (seed === 0) return 0;
  return 2 + (seed % 3);
}

const GOAL = 4; // tablets planned per day
const LOG_KEY = 'medicine-consumption-log';

function loadLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch { return []; }
}

/* ------------------------------------------------------------------ */
/* Log-intake modal                                                    */
/* ------------------------------------------------------------------ */
const METHODS = [
  { id: 'photo', label: 'Upload photo', hint: 'Snap your tablet strip', icon: Camera },
  { id: 'voice', label: 'Use voice', hint: 'Say “I took two”', icon: Mic },
  { id: 'manual', label: 'Enter manually', hint: 'Pick a count', icon: Pencil },
];

function LogModal({ method, tablets, onClose, onSave }) {
  const [tabletId, setTabletId] = useState(tablets[0]?.id);
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const recRef = useRef(null);
  const fileRef = useRef(null);

  const tablet = tablets.find((t) => t.id === tabletId) || tablets[0];
  const current = METHODS.find((m) => m.id === method);
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => () => { recRef.current?.stop(); if (photo) URL.revokeObjectURL(photo); }, []); // eslint-disable-line

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const startVoice = () => {
    if (!SR) { setVoiceError('Voice input is not supported in this browser. Try Chrome, or enter the count manually.'); return; }
    setVoiceError('');
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const n = parseQty(text);
      if (n) setQty(n);
      const match = tablets.find((t) => text.toLowerCase().includes(t.name.toLowerCase()));
      if (match) setTabletId(match.id);
      if (!n) setVoiceError('Could not hear a number. Try “I took two tablets”.');
    };
    rec.onerror = () => { setVoiceError('Microphone unavailable. Check browser permission.'); setListening(false); };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stopVoice = () => { recRef.current?.stop(); setListening(false); };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(f));
  };

  const canSave = Boolean(tablet) && qty > 0 && (method !== 'photo' || photo);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Log tablets taken"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{current.label}</h2>
            <p className="text-sm text-slate-500">{current.hint}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Sample tablet picker */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Which tablet did you take?</p>
            {tablets.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No tablets are scheduled for today.</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tablets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTabletId(t.id)}
                  className={`group overflow-hidden rounded-xl border-2 text-left transition ${
                    tabletId === t.id ? 'border-teal-600 ring-2 ring-teal-100' : 'border-transparent bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <TabletImg tablet={t} className="h-20 w-full" />
                  <div className="px-2 py-1.5">
                    <p className="truncate text-xs font-semibold text-slate-800">{t.name}</p>
                    <p className="text-[11px] text-slate-500">{t.strength}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Method panel */}
          {method === 'photo' && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center">
              {photo ? (
                <div className="space-y-3">
                  <img src={photo} alt="Your uploaded tablets" className="mx-auto h-48 rounded-xl object-cover" />
                  <button onClick={() => fileRef.current?.click()} className="text-sm font-medium text-teal-700 hover:underline">Choose a different photo</button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 py-8 text-slate-600">
                  <span className="rounded-full bg-teal-50 p-3 text-teal-700"><Camera size={22} /></span>
                  <span className="font-medium text-slate-800">Upload a photo of your tablets</span>
                  <span className="text-sm">Take one now or pick from your gallery</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
            </div>
          )}

          {method === 'voice' && (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-50 p-5 text-center">
              <button
                onClick={listening ? stopVoice : startVoice}
                aria-label={listening ? 'Stop listening' : 'Start listening'}
                className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white transition ${
                  listening ? 'bg-red-500' : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {listening && <span className="absolute inset-0 animate-ping rounded-full bg-red-400/60" />}
                <span className="relative">{listening ? <Square size={20} /> : <Mic size={24} />}</span>
              </button>
              <p className="text-sm text-slate-600">
                {listening ? 'Listening… say how many you took' : 'Tap the mic and say “I took two Paracetamol”'}
              </p>
              {transcript && <p className="rounded-lg bg-white px-3 py-2 text-sm italic text-slate-700">“{transcript}”</p>}
              {voiceError && <p className="text-sm text-red-600">{voiceError}</p>}
            </div>
          )}

          {/* Quantity stepper (always visible so voice results can be corrected) */}
          <div className="flex items-center justify-between rounded-2xl bg-teal-50 px-4 py-3">
            <div>
              <p className="text-sm text-teal-900">{tablet ? `${tablet.name} ${tablet.strength}` : 'No tablet selected'}</p>
              <p className="text-xs text-teal-700">Tablets taken</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer" className="rounded-full bg-white p-2 text-teal-700 shadow-sm hover:bg-teal-100"><Minus size={16} /></button>
              <span className="w-8 text-center text-2xl font-semibold tabular-nums text-teal-900">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="More" className="rounded-full bg-white p-2 text-teal-700 shadow-sm hover:bg-teal-100"><Plus size={16} /></button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button
            disabled={!canSave}
            onClick={() => onSave({ tablet, qty, method })}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={18} /> Save intake
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Weekly bar chart (SVG, no extra dependency)                         */
/* ------------------------------------------------------------------ */
function WeekChart({ data }) {
  const max = Math.max(GOAL, ...data.map((d) => d.count)) + 1;
  const H = 140;
  return (
    <div>
      <div className="relative flex h-[160px] items-end gap-3 pt-4">
        {/* goal line */}
        <div className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-teal-400" style={{ bottom: `${(GOAL / max) * H + 20}px` }}>
          <span className="absolute -top-5 right-0 text-[11px] text-teal-700">Goal {GOAL}</span>
        </div>
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-medium tabular-nums text-slate-600">{d.count}</span>
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${d.today ? 'bg-teal-600' : d.count >= GOAL ? 'bg-teal-300' : 'bg-amber-300'}`}
              style={{ height: `${Math.max((d.count / max) * H, 4)}px` }}
              title={`${d.label}: ${d.count} tablets`}
            />
            <span className={`text-xs ${d.today ? 'font-semibold text-teal-700' : 'text-slate-500'}`}>{d.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-teal-300" />Goal met</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-300" />Below goal</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-teal-600" />Today</span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Month calendar                                                      */
/* ------------------------------------------------------------------ */
function MonthCalendar({ countFor }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const today = new Date();
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))];

  const shade = (date) => {
    if (date > today) return 'bg-slate-50 text-slate-400';
    const c = countFor(date);
    if (c === 0) return 'bg-red-50 text-red-600';
    if (c < GOAL) return 'bg-amber-100 text-amber-800';
    return 'bg-teal-100 text-teal-800';
  };

  const move = (n) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{cursor.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</h3>
        <div className="flex gap-1">
          <button onClick={() => move(-1)} aria-label="Previous month" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronLeft size={18} /></button>
          <button onClick={() => move(1)} aria-label="Next month" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-slate-500">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        {cells.map((date, i) => date ? (
          <div
            key={i}
            title={date <= today ? `${countFor(date)} tablets` : ''}
            className={`flex min-h-[52px] flex-col items-center justify-center rounded-lg tabular-nums ${shade(date)} ${dayKey(date) === dayKey(today) ? 'ring-2 ring-teal-600' : ''}`}
          >
            <span className="text-sm leading-none">{date.getDate()}</span>
            {date <= today && <span className="mt-1 text-[11px] font-semibold leading-none">{countFor(date)}</span>}
          </div>
        ) : <span key={i} />)}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-teal-100 ring-1 ring-teal-300" />Goal met</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-100 ring-1 ring-amber-300" />Partial</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-red-50 ring-1 ring-red-300" />Missed</span>
        <span>Small number = tablets taken</span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const { doses, mark, percent } = useDoses();
  const { inventory: INVENTORY } = usePatient();
  const pending = doses.filter((d) => d.status === 'PENDING').length;

  const [log, setLog] = useState(loadLog);
  const [method, setMethod] = useState(null); // null = modal closed
  const [toast, setToast] = useState('');
  const tablets = useMemo(() => tabletsFromDoses(doses), [doses]);

  useEffect(() => {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(log.map(({ photo, ...rest }) => rest))); } catch { /* storage unavailable */ }
  }, [log]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loggedFor = (date) => log.filter((l) => l.day === dayKey(date)).reduce((s, l) => s + l.qty, 0);
  const countFor = (date) => (dayKey(date) === dayKey(new Date()) ? loggedFor(date) : sampleHistory(date) + loggedFor(date));

  const week = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      return { label: d.toLocaleString('en-IN', { weekday: 'short' }), count: countFor(d), today: i === 6 };
    });
  }, [log]); // eslint-disable-line

  const todayTotal = loggedFor(new Date());
  const todayLogs = log.filter((l) => l.day === dayKey(new Date())).slice().reverse();

  const save = ({ tablet, qty, method: m }) => {
    if (!tablet) return;
    setLog((prev) => [...prev, {
      id: Date.now(),
      day: dayKey(new Date()),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      name: tablet.name, strength: tablet.strength, img: tablet.img, color: tablet.color,
      qty, method: m,
    }]);
    setMethod(null);
    setToast(`Saved: ${qty} × ${tablet.name}`);
  };

  const methodLabel = { photo: 'Photo', voice: 'Voice', manual: 'Manual' };

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

          {/* Tablet image with the three log options beside it */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <div className="relative">
              <Img src={IMG.pills} alt="Medicine tablets" className="h-44 w-full" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/70 to-transparent p-4 text-white">
                <p className="font-semibold">Refill before you run out</p>
                <Link to="/vendors" className="text-sm text-teal-200 hover:underline">Find a pharmacy</Link>
              </div>
            </div>
            <div className="p-4">
              <p className="mb-3 font-semibold text-slate-900">Update tablets taken</p>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-3 text-center transition hover:border-teal-500 hover:bg-teal-50"
                  >
                    <span className="rounded-full bg-teal-50 p-2 text-teal-700"><m.icon size={18} /></span>
                    <span className="text-xs font-medium text-slate-800">{m.label}</span>
                    <span className="hidden text-[11px] text-slate-500 sm:block">{m.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consumption analytics */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-semibold text-slate-900">Tablets this week</h2>
            <span className="text-sm text-slate-500">Today: <b className="text-teal-700">{todayTotal}</b> / {GOAL}</span>
          </div>
          <WeekChart data={week} />
        </Card>

        <Card>
          <MonthCalendar countFor={countFor} />
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Logged today</h2>
          {todayLogs.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nothing logged yet. Use photo, voice or manual entry to record the tablets you took.
            </div>
          ) : (
            <ul className="space-y-3">
              {todayLogs.map((l) => {
                return (
                  <li key={l.id} className="flex items-center gap-3">
                    <TabletImg tablet={{ ...l, name: l.name || 'Tablet' }} className="h-12 w-12 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{l.name || 'Tablet'} {l.strength}</p>
                      <p className="text-xs text-slate-500">{l.time} · {methodLabel[l.method]}</p>
                    </div>
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-sm font-semibold text-teal-700">×{l.qty}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {method && <LogModal key={method} method={method} tablets={tablets} onClose={() => setMethod(null)} onSave={save} />}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}