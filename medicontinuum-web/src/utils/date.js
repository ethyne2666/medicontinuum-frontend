export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const daysUntil = (iso) => Math.ceil((new Date(iso) - new Date()) / 86400000);

export const humanize = (value) =>
  value.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
