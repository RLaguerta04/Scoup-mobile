export const compact = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
};

export const peso = (n: number): string => `PHP ${compact(n)}`;

export const withCommas = (n: number): string => n.toLocaleString('en-US');

export const signedPct = (n: number): string =>
  `${n >= 0 ? '↑' : '↓'} ${Math.abs(n).toFixed(1)}%`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 'yyyy-MM-dd' → 'Nov 4' (UTC, to match the seeded dates).
export const formatMonthDay = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

// 0 → '12 AM', 12 → '12 PM', 13 → '1 PM'.
export const formatHour = (h: number): string => {
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour} ${period}`;
};

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ISO datetime → 'October 2, 2026' (UTC). Empty/invalid input → 'Just now' (used for
// session-new records with no stored timestamp).
export const formatLongDate = (iso: string): string => {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Just now';
  return `${FULL_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};
