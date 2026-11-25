// Pure helpers + display maps for the Decision Report — the mobile mirror of the
// relevant bits of the web's src/utils/mediaMeterReport.ts (verdict words, trend
// direction, period word, compact figures).
import type { PillTone } from '@/components/ui/controls';
import type { ReportCadence, ReportTrend, ReportVerdict, TrackerVerdict } from '@/types';

export const VERDICT: Record<ReportVerdict, { label: string; word: string; tone: PillTone }> = {
  act: { label: 'ACT', word: 'Act on it', tone: 'negative' },
  watch: { label: 'WATCH', word: 'Watch', tone: 'brand' },
  skip: { label: 'SKIP', word: 'No action', tone: 'neutral' },
};

// Crisis-tracker reading → badge label + tone (web: TRACKER_VERDICT danger/warning/success).
export const TRACKER_VERDICT: Record<TrackerVerdict, { label: string; tone: PillTone }> = {
  escalating: { label: 'Escalating', tone: 'negative' },
  stable: { label: 'Stable', tone: 'brand' },
  containing: { label: 'Containing', tone: 'positive' },
};

// Attention multiple → "2.3×" / "0.90×" (web: formatTimes — two decimals below 1, one above).
export const formatTimesNormal = (x: number): string => `${x >= 1 ? x.toFixed(1) : x.toFixed(2)}×`;

// Trend arrow glyph, e.g. "↑ Rising" / "→ Steady" / "↓ Fading".
export const TREND_GLYPH: Record<ReportTrend, string> = {
  Rising: '↑',
  Steady: '→',
  Fading: '↓',
};

export const periodWord = (cadence: ReportCadence): string =>
  cadence === 'daily' ? 'today' : cadence === 'monthly' ? 'this month' : 'this week';

// Compact engagement number, e.g. 8800 → "8.8K", 10900 → "10.9K", 1_200_000 → "1.2M".
export const compactNum = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};
