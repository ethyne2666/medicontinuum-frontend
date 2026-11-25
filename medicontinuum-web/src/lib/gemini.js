// OPTIONAL: bring-your-own Gemini API key. Called straight from the browser; the key lives only in this
// browser's localStorage. Without a key the app uses the built-in rule-based assistant. The model never edits
// your data — doses/stock changes are always done by the local intent engine.
const KEY = 'mc.gemini.v1';
export const DEFAULT_MODEL = 'gemini-2.5-flash';

export function getGeminiConfig() {
  try { return { model: DEFAULT_MODEL, key: '', ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return { model: DEFAULT_MODEL, key: '' }; }
}
export function saveGeminiConfig(cfg) {
  try { localStorage.setItem(KEY, JSON.stringify({ key: cfg.key.trim(), model: cfg.model.trim() || DEFAULT_MODEL })); } catch { /* ignore */ }
}
export const hasGemini = () => Boolean(getGeminiConfig().key);

const SYSTEM = `You are MediContinuum's assistant for a patient. Answer ONLY from the JSON context provided; if something is not in it, say you don't have that information. Be brief (max 120 words), friendly and plain-spoken. Never diagnose, never change a dose or advise stopping/starting a medicine — suggest asking the doctor or pharmacist instead.`;

function compactContext(s) {
  return {
    today: { adherencePercent: s.percent, doses: s.doses.map((d) => ({ medicine: d.medicine, time: d.time, dose: d.dose, status: d.status })) },
    supply: s.supply, expiring: s.expiring.map((i) => ({ medicine: i.medicine, daysLeft: i.daysLeft })),
    activePrescriptions: s.activePrescriptions.map((p) => ({ doctor: p.doctor, items: p.items.map((i) => `${i.medicine} ${i.dosageAmount} ${i.dosageUnit} ${i.frequency}`) })),
    recentLog: s.log.slice(0, 8).map((l) => ({ medicine: l.medicine, status: l.status, at: l.ts })),
  };
}

export async function askGemini({ prompt, snapshot, history = [], signal }) {
  const { key, model } = getGeminiConfig();
  if (!key) throw new Error('Add a Gemini API key in the assistant settings first.');
  const contents = [
    ...history.slice(-6).map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
    { role: 'user', parts: [{ text: `Context:\n${JSON.stringify(compactContext(snapshot))}\n\nQuestion: ${prompt}` }] },
  ];
  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents, generationConfig: { temperature: 0.3, maxOutputTokens: 400 } }),
    });
  } catch { throw new Error('Could not reach the Gemini API. Check your connection.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Gemini returned ${res.status}.`);
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('') ?? '';
  if (!text) throw new Error('Gemini returned an empty answer.');
  return text.trim();
}

export const polishSummary = (snapshot, baseText) =>
  askGemini({ snapshot, prompt: `Rewrite this health-tracking summary as a short, friendly paragraph plus 3 bullet next steps. Keep every fact and number exactly:\n${baseText}` });
