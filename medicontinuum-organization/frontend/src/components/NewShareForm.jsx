import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Card, ErrorBanner, Field, btnGhost, btnPrimary, inputCls } from '@/components/ui';
import { BLOOD_COMPONENTS, BLOOD_GROUPS, ORGANS, RESOURCE_TYPES, URGENCIES, humanize } from '@/constants';

const emptyDetails = {
  BLOOD: { bloodGroup: 'O+', component: 'WHOLE_BLOOD' },
  ORGAN: { organ: 'KIDNEY', bloodGroup: '' },
  DOCTOR: { specialization: '', durationHours: '' },
  EQUIPMENT: { item: '' },
  MEDICINE: { item: '' },
};

export function NewShareForm({ me, presetTarget = '', onCreated, onCancel }) {
  const canOrgan = me.kind === 'ORGANIZATION' && me.orgType === 'HOSPITAL';
  const types = RESOURCE_TYPES.filter((t) => t !== 'ORGAN' || canOrgan);

  const [form, setForm] = useState({ direction: 'REQUEST', resourceType: 'BLOOD', urgency: 'ROUTINE', quantity: 1, neededBy: '', notes: '', targetPublicId: presetTarget });
  const [details, setDetails] = useState(emptyDetails.BLOOD);
  const [peers, setPeers] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.network().then((r) => setPeers(r.items)).catch(() => {}); }, []);

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const setD = (e) => setDetails((p) => ({ ...p, [e.target.name]: e.target.value }));
  const pickType = (e) => { set(e); setDetails(emptyDetails[e.target.value]); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null); setErrors({});
    const clean = Object.fromEntries(Object.entries(details).filter(([, v]) => v !== ''));
    if (clean.durationHours) clean.durationHours = Number(clean.durationHours);
    try {
      const created = await api.createShare({
        ...form, quantity: Number(form.quantity), neededBy: form.neededBy || null, targetPublicId: form.targetPublicId || null, details: clean,
      });
      onCreated(created);
    } catch (err) { setError(err); setErrors(err.fields ?? {}); } finally { setBusy(false); }
  };

  const select = (name, value, onChange, options, label = humanize) => (
    <select name={name} value={value} onChange={onChange} className={inputCls}>
      {options.map((o) => <option key={o} value={o}>{label(o)}</option>)}
    </select>
  );

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="I want to">{select('direction', form.direction, set, ['REQUEST', 'OFFER'], (v) => (v === 'REQUEST' ? 'Request' : 'Offer'))}</Field>
          <Field label="Resource">{select('resourceType', form.resourceType, pickType, types)}</Field>
          <Field label="Urgency">{select('urgency', form.urgency, set, URGENCIES)}</Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {form.resourceType === 'BLOOD' && (
            <>
              <Field label="Blood group" error={errors['details.bloodGroup']}>{select('bloodGroup', details.bloodGroup, setD, BLOOD_GROUPS, (v) => v)}</Field>
              <Field label="Component">{select('component', details.component, setD, BLOOD_COMPONENTS)}</Field>
            </>
          )}
          {form.resourceType === 'ORGAN' && (
            <>
              <Field label="Organ" error={errors['details.organ']}>{select('organ', details.organ, setD, ORGANS)}</Field>
              <Field label="Blood group (optional)">
                <select name="bloodGroup" value={details.bloodGroup} onChange={setD} className={inputCls}>
                  <option value="">Any / not specified</option>
                  {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
            </>
          )}
          {form.resourceType === 'DOCTOR' && (
            <>
              <Field label="Specialization" error={errors['details.specialization']}>
                <input name="specialization" value={details.specialization} onChange={setD} required className={inputCls} placeholder="Cardiology" />
              </Field>
              <Field label="Duration (hours)" error={errors['details.durationHours']}>
                <input name="durationHours" type="number" min="1" value={details.durationHours} onChange={setD} className={inputCls} placeholder="72" />
              </Field>
            </>
          )}
          {(form.resourceType === 'EQUIPMENT' || form.resourceType === 'MEDICINE') && (
            <Field label={form.resourceType === 'EQUIPMENT' ? 'Equipment' : 'Medicine'} error={errors['details.item']}>
              <input name="item" value={details.item} onChange={setD} required className={inputCls} placeholder={form.resourceType === 'EQUIPMENT' ? 'Ventilator' : 'Inj. Heparin 5000 IU'} />
            </Field>
          )}
          <Field label={form.resourceType === 'BLOOD' ? 'Units' : 'Quantity'} error={errors.quantity}>
            <input name="quantity" type="number" min="1" max="1000" value={form.quantity} onChange={set} required className={inputCls} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Send to">
            <select name="targetPublicId" value={form.targetPublicId} onChange={set} className={inputCls}>
              <option value="">Entire network (broadcast)</option>
              {peers.map((p) => <option key={p.publicId} value={p.publicId}>{p.name} — {p.city}</option>)}
            </select>
          </Field>
          <Field label="Needed by (optional)" error={errors.neededBy}>
            <input name="neededBy" type="date" value={form.neededBy} onChange={set} className={inputCls} />
          </Field>
        </div>

        <Field label="Notes" error={errors.notes} hint="Never include patient names or identifiers.">
          <textarea name="notes" rows={2} maxLength={500} value={form.notes} onChange={set} className={inputCls} />
        </Field>

        {form.resourceType === 'ORGAN' && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            Organ coordination must follow the applicable transplant law and allocation authority (e.g. NOTTO / SOTTO in India). Posts here are for logistics between licensed hospitals only and do not replace official allocation.
          </p>
        )}
        <ErrorBanner error={error} />
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Posting…' : 'Post to network'}</button>
          <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
        </div>
      </form>
    </Card>
  );
}
