import { Router } from 'express';
import { HttpError } from '../lib/errors.js';
import { FailureLimiter } from '../lib/rateLimit.js';
import { registerSchema, signupSchema, loginSchema } from '../schemas.js';
import { activateAccount, registerEntity, registrationView, selfView, verifyLogin } from '../services/entities.js';
import { requireAuth, signToken } from '../middleware/auth.js';

export function authRoutes({ store, config }) {
  const r = Router();
  const limiter = new FailureLimiter();

  // 1) register with licence + government ID (organization) or doctor ID (individual doctor)
  r.post('/register', (req, res) => {
    const entity = registerEntity(store, registerSchema.parse(req.body));
    res.status(201).json(registrationView(entity));
  });

  // 2) create the login — requires the issued 16-digit number AND the registered email
  r.post('/signup', async (req, res) => {
    const entity = await activateAccount(store, signupSchema.parse(req.body));
    res.status(201).json({ token: signToken(entity, config), entity: selfView(entity) });
  });

  // 3) log in with the 16-digit number + password
  r.post('/login', async (req, res) => {
    const body = loginSchema.parse(req.body);
    const key = `${req.ip}:${body.orgNumber}`;
    const wait = limiter.retryAfterMs(key);
    if (wait) throw new HttpError(429, 'LOCKED', `Too many failed attempts. Try again in ${Math.ceil(wait / 60000)} minute(s).`);
    const entity = await verifyLogin(store, body);
    if (!entity) {
      limiter.fail(key);
      throw new HttpError(401, 'BAD_CREDENTIALS', 'Incorrect organization number or password.');
    }
    limiter.reset(key);
    res.json({ token: signToken(entity, config), entity: selfView(entity) });
  });

  r.get('/me', requireAuth(store, config), (req, res) => res.json({ entity: selfView(req.me) }));
  return r;
}
