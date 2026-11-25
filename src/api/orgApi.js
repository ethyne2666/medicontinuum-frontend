// Read-only client for the Organization API (separate backend, default http://localhost:5001).
const BASE = import.meta.env.VITE_ORG_API_URL ?? 'http://localhost:5001';
export const ORG_PORTAL_URL = import.meta.env.VITE_ORG_PORTAL_URL ?? 'http://localhost:5174';

async function get(path) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { cache: 'no-store' });
  } catch {
    throw new Error(`Can’t reach the Organization service at ${BASE}. Make sure its backend is running.`);
  }
  if (!res.ok) throw new Error('The Organization service returned an error. Please try again.');
  return res.json();
}

export const fetchRegisteredOrganisations = () => get('/public/organizations');
