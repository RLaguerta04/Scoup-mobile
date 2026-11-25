// Account usage mock — the web account menu's Usage panel reads this. Numbers reproduce
// the web screenshot: tokens at 100% of the limit (Prompt 83% / Completion 10% / Cache 8%
// of the total), buckets 0%, stories 0 used. Shape matches the real user-usage endpoint.
import type { IUsageReport, IUserUsage } from '@/types';

const USAGE: IUserUsage = {
  promptTokensUsed: 825_000,
  completionTokensUsed: 100_000,
  cacheTokensUsed: 75_000,
  tokenLimit: 1_000_000,
  bucketsUsed: 0,
  bucketLimit: 10,
  storiesUsed: 0,
  storyLimit: null, // unlimited → shown as "0 used"
};

export const getUserUsage = (): IUserUsage => ({ ...USAGE });

// The full Usage & plan page (mirrors the web's forecast page). This account is on an
// unlimited plan: tokens/scrapes are unlimited but tracked with alert thresholds (ticks),
// stories/personas are unlimited-plain. Tokens carry a composition breakdown. null = unlimited.
const ALERTS = [75, 80, 85, 100];
export const getUsageReport = (): IUsageReport => ({
  resetDate: '2026-12-01',
  metrics: [
    {
      group: 'tokens',
      key: 'total',
      label: 'Total tokens',
      used: 937_411_049,
      limit: null,
      alertThresholds: ALERTS,
      shares: [
        { key: 'writeups', label: 'Write-ups', share: 99.2, color: '#578bd9' },
        { key: 'chat', label: 'Chat', share: 0.8, color: '#e8890c' },
        { key: 'analysis', label: 'Analysis', share: 0.0, color: '#127a53' },
        { key: 'mail', label: 'Mail', share: 0.0, color: '#7c5cbf' },
      ],
    },
    {
      group: 'scrapes',
      key: 'scrapes',
      label: 'Total scrapes',
      unit: 'posts and articles scraped',
      used: 34_761,
      limit: null,
      alertThresholds: ALERTS,
    },
    { group: 'creation', key: 'stories', label: 'Stories', used: 835, limit: null },
    { group: 'plan', key: 'personas', label: 'Personas', used: 0, limit: null },
  ],
});
