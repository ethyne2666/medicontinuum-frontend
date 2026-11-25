import { Router } from 'express';
import { activeEntities, publicView } from '../services/entities.js';

/** Unauthenticated read-only API used by the patient site. */
export function publicRoutes({ store }) {
  const r = Router();

  r.get('/organizations', (req, res) => {
    const { q = '', kind, type, city } = req.query;
    const needle = String(q).trim().toLowerCase();
    let rows = activeEntities(store);
    if (kind) rows = rows.filter((e) => e.kind === kind);
    if (type) rows = rows.filter((e) => e.orgType === type);
    if (city) rows = rows.filter((e) => e.city.toLowerCase() === String(city).toLowerCase());
    if (needle) {
      rows = rows.filter((e) =>
        [e.name, e.city, e.state, e.specialization ?? '', e.orgType ?? ''].some((v) => v.toLowerCase().includes(needle)));
    }
    rows.sort((a, b) => b.activatedAt.localeCompare(a.activatedAt));
    res.json({ items: rows.map(publicView), total: rows.length, asOf: new Date().toISOString() });
  });

  r.get('/stats', (_req, res) => {
    const rows = activeEntities(store);
    const byType = {};
    rows.forEach((e) => { const k = e.orgType ?? 'DOCTOR'; byType[k] = (byType[k] ?? 0) + 1; });
    res.json({
      total: rows.length,
      organizations: rows.filter((e) => e.kind === 'ORGANIZATION').length,
      doctors: rows.filter((e) => e.kind === 'DOCTOR').length,
      byType,
      asOf: new Date().toISOString(),
    });
  });

  return r;
}
