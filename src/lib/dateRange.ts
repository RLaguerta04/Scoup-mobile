import type { RangePreset } from '@/types';

// Fixed "today" so the sample data is stable (matches the web mock era).
export const TODAY = '2026-11-04';

export interface DateRange {
  from: string; // yyyy-MM-dd
  to: string;
}

export const addDays = (iso: string, delta: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

export const presetRange = (preset: RangePreset): DateRange => {
  const days = preset === 'today' ? 1 : preset === '7d' ? 7 : 30;
  return { from: addDays(TODAY, -(days - 1)), to: TODAY };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const short = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

// "Nov 4" for a single day, else "Oct 29 – Nov 4".
export const rangeLabel = ({ from, to }: DateRange): string =>
  from === to ? short(to) : `${short(from)} – ${short(to)}`;
