import jwt from 'jsonwebtoken';
import { HttpError } from '../lib/errors.js';

export const signToken = (entity, config) =>
  jwt.sign({ sub: entity.id }, config.jwtSecret, { expiresIn: config.tokenTtl });

export function requireAuth(store, config) {
  return (req, _res, next) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'UNAUTHENTICATED', 'Please log in.');
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Your session has expired. Please log in again.');
    }
    const me = store.data.entities.find((e) => e.id === payload.sub && e.status === 'ACTIVE');
    if (!me) throw new HttpError(401, 'UNAUTHENTICATED', 'Please log in.');
    req.me = me;
    next();
  };
}
