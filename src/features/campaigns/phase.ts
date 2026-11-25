// Pure campaign timing logic, ported verbatim from the web app
// (scoup_ui_v2 src/utils/campaigns.ts + src/features/campaigns/mocks/campaignsMock.ts:phaseOf).
// Kept framework-agnostic so the card and the mock share one source of truth.
import { TODAY, addDays } from '@/lib/dateRange';
import type { GoalStatus, ICampaignPhase } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Calendar days between two 'yyyy-MM-dd' dates (UTC), matching date-fns differenceInCalendarDays.
export const daysBetween = (from: string, to: string): number =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  );

// 'yyyy-MM-dd' → '16 Oct 2026' (the web's formatCampaignDay, d MMM yyyy).
export const formatCampaignDay = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

// 'yyyy-MM-dd' → '9 Nov' (the web's formatCampaignShortDay, d MMM).
export const formatCampaignShortDay = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

// The campaign's place in its own timeline — the badge text (big) and the pre-figures line (sub).
export const phaseOf = (
  campaign: { launch: string; window: [string, string]; locked_at: string | null },
  today: string = TODAY,
): ICampaignPhase => {
  const launch = campaign.launch;
  const closes = campaign.window[1];
  if (!launch)
    return {
      phase: 'planning',
      big: 'No launch date',
      sub: 'Add the launch day in the brief to start the countdown.',
    };
  const total = closes ? daysBetween(launch, closes) + 1 : null;
  if (today < launch) {
    const n = daysBetween(today, launch);
    return {
      phase: n <= 28 ? 'baseline' : 'planning',
      big: n === 1 ? 'Launch tomorrow' : `Launch in ${n} days`,
      sub: `Coverage before launch is the baseline the tone goal is measured against.${campaign.locked_at ? '' : ' Lock the brief before launch day.'}`,
    };
  }
  if (!closes || today <= closes) {
    const day = daysBetween(launch, today) + 1;
    return {
      phase: 'live',
      big: `Day ${day}${total ? ` of ${total}` : ''}`,
      sub: total ? `${total - day} days left in the window.` : 'The campaign is live.',
    };
  }
  return {
    phase: today <= addDays(closes, 7) ? 'closed' : 'report',
    big: 'Window closed',
    sub: 'Final checks on the coding are under way.',
  };
};

// Days left in the window for a live campaign (the card's "N days left"); null otherwise.
export const daysLeft = (
  campaign: { launch: string; window: [string, string] },
  today: string = TODAY,
): number | null => {
  const closes = campaign.window[1];
  if (!campaign.launch || today < campaign.launch || (closes && today > closes)) return null;
  return closes ? daysBetween(today, closes) : null;
};

export const isAllEarly = (goals: ReadonlyArray<{ st: GoalStatus }>): boolean =>
  goals.length > 0 && goals.every((goal) => goal.st === 'early');

export const onTrackCount = (goals: ReadonlyArray<{ st: GoalStatus }>): number =>
  goals.filter((goal) => goal.st === 'good').length;
