import { Router } from 'express';
import { activeEntities, peerView } from '../services/entities.js';

/** Directory of other registered organizations / doctors, for logged-in members. */
export function networkRoutes({ store }) {
  const r = Router();
  r.get('/organizations', (req, res) => {
    const { q = '', kind, type } = req.query;
    const needle = String(q).trim().toLowerCase();
    let rows = activeEntities(store).filter((e) => e.id !== req.me.id);
    if (kind) rows = rows.filter((e) => e.kind === kind);
    if (type) rows = rows.filter((e) => e.orgType === type);
    if (needle) {
      rows = rows.filter((e) =>
        [e.name, e.city, e.state, e.specialization ?? ''].some((v) => v.toLowerCase().includes(needle)));
    }
    rows.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ items: rows.map(peerView), total: rows.length });
  });
  return r;
}
