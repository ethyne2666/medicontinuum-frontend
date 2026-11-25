import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 5001),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-jwt-secret-change-me',
  idPepper: process.env.ID_PEPPER ?? 'dev-only-id-pepper-change-me',
  dataFile: process.env.DATA_FILE ?? path.join(here, '..', 'data', 'db.json'),
  // patient site = 5173, organization portal = 5174
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
    .split(',').map((s) => s.trim()).filter(Boolean),
  tokenTtl: '8h',
};

export const usingDevSecrets =
  !process.env.JWT_SECRET || !process.env.ID_PEPPER;
