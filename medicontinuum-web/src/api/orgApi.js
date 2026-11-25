// The patient site no longer calls a backend: organisations registered in the Organization portal
// arrive through the shared in-browser registry (see lib/registry.js and public/hub.html).
export { listPublicOrganisations as fetchRegisteredOrganisations } from '@/lib/registry';

export const ORG_PORTAL_URL =
  import.meta.env.VITE_ORG_PORTAL_URL ?? `${location.protocol}//${location.hostname}:5174`;
