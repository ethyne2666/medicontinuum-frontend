import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { HttpError } from './lib/errors.js';
import { requireAuth } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { publicRoutes } from './routes/public.js';
import { networkRoutes } from './routes/network.js';
import { shareRoutes } from './routes/shares.js';

export function createApp({ store, config }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '50kb' }));
  // always serve fresh data so the patient site and portal stay in sync
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  const auth = requireAuth(store, config);
  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'medicontinuum-organization-api' }));
  app.use('/api/auth', authRoutes({ store, config }));
  app.use('/api/public', publicRoutes({ store }));
  app.use('/api/network', auth, networkRoutes({ store }));
  app.use('/api/shares', auth, shareRoutes({ store }));

  app.use((_req, _res, next) => next(new HttpError(404, 'NOT_FOUND', 'Route not found.')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ZodError) {
      const fields = {};
      for (const issue of err.issues) {
        const key = issue.path.join('.') || '_';
        fields[key] ??= issue.message;
      }
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'Please check the highlighted fields.', fields } });
    }
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Invalid JSON body.' } });
    }
    console.error(err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong.' } });
  });

  return app;
}
