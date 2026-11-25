import { Router } from 'express';
import { respondSchema, shareSchema } from '../schemas.js';
import {
  cancelShare, createShare, fulfilShare, getShare, listShares, respondToShare, shareSummary, shareView,
} from '../services/shares.js';

export function shareRoutes({ store }) {
  const r = Router();

  r.get('/summary', (req, res) => res.json(shareSummary(store, req.me)));

  r.get('/', (req, res) => {
    const scope = ['incoming', 'mine', 'responded'].includes(req.query.scope) ? req.query.scope : 'incoming';
    const items = listShares(store, req.me, {
      scope, type: req.query.type, direction: req.query.direction, status: req.query.status,
    });
    res.json({ items, total: items.length, asOf: new Date().toISOString() });
  });

  r.post('/', (req, res) => {
    const share = createShare(store, req.me, shareSchema.parse(req.body));
    res.status(201).json(shareView(store, share, req.me));
  });

  r.get('/:id', (req, res) => res.json(getShare(store, req.params.id, req.me)));
  r.post('/:id/respond', (req, res) => res.json(respondToShare(store, req.params.id, req.me, respondSchema.parse(req.body))));
  r.post('/:id/fulfil', (req, res) => res.json(fulfilShare(store, req.params.id, req.me)));
  r.post('/:id/cancel', (req, res) => res.json(cancelShare(store, req.params.id, req.me)));
  return r;
}
