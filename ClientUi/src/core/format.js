const currency = import.meta.env.VITE_CURRENCY || 'USD';

export const formatMoney = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value) || 0);

export const formatDate = (value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', opts) : '—';

export const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000);
  return diff > 0 ? diff : 0;
};

export const todayISO = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const statusLabel = (status) => status.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());

export const STATUS_STYLES = {
  pending: 'bg-brass-100 text-brass-600',
  confirmed: 'bg-ocean-100 text-ocean-700',
  checked_in: 'bg-moss-100 text-moss',
  checked_out: 'bg-ocean/5 text-ink/60',
  cancelled: 'bg-coral-100 text-coral',
};
