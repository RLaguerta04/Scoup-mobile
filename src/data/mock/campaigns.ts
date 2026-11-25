// Campaigns ("Evaluations") mock — the three worked examples from the web app's
// fixtures (scoup_ui_v2 src/features/campaigns/mocks/campaigns.json), reduced to the
// list-card summary shape. phase + days-left are computed from the window against the
// app's fixed TODAY, exactly as the web derives them, so the cards read the same.
import { daysLeft, phaseOf } from '@/features/campaigns/phase';
import type { GoalStatus, ICampaignGoalSummary, ICampaignSummary } from '@/types';
import { deleteDraft, getDraftSummaries } from './campaignDrafts';

interface Sample {
  id: string;
  name: string;
  brand: string;
  launch: string; // '' for no launch date
  window: [string, string];
  competitor: string;
  locked_at: string | null;
  updated_at: string;
  goals: Array<{ id: string; short: string; name: string; st: GoalStatus }> | null;
}

const goals = (
  rows: Array<[id: string, short: string, name: string, st: GoalStatus]>,
): ICampaignGoalSummary[] => rows.map(([id, short, name, st]) => ({ id, short, name, st }));

// Six goals, a real mid-flight mix (3 on track, 1 at risk, 1 off track, 1 too early).
const HONOR_GOALS = goals([
  ['share', 'Launch share', 'HONOR wins the mid-range conversation', 'good'],
  ['messages', 'Message pull-through', 'Stories carry the price and the battery', 'warn'],
  ['spox', 'Executive quoted', 'An HONOR executive is quoted in most stories', 'good'],
  ['tone', 'Warmer than rival', 'Coverage gets warmer than before launch', 'early'],
  ['search', 'Search interest', 'People search for the 600S as much as the rival', 'good'],
  ['mustwin', 'Must-win outlets', 'The must-win outlets run the story', 'bad'],
]);

// Four goals, all too early to call — the "Too early to call on all N goals" state.
const JOLLIBEE_GOALS = goals([
  ['share', 'Launch share', 'Jollibee wins the fried-chicken conversation', 'early'],
  ['messages', 'Message pull-through', 'Stories name the red-flag line and the flaglets', 'early'],
  ['spox', 'Executive quoted', 'A Jollibee executive is quoted in half the stories', 'early'],
  ['tone', 'Warmer than rival', 'Coverage gets warmer than before the campaign', 'early'],
]);

// Five goals, all on track — the winning "On track on 5 of 5 goals" state.
const SAMSUNG_GOALS = goals([
  ['share', 'Launch share', 'Samsung wins the flagship conversation', 'good'],
  ['messages', 'Message pull-through', 'Stories carry the camera and on-device AI lines', 'good'],
  ['spox', 'Executive quoted', 'A Samsung executive is quoted in most stories', 'good'],
  ['tone', 'Warmer than rival', 'Coverage runs warmer than Apple', 'good'],
  ['search', 'Search interest', 'People search for the S26 more than the rival', 'good'],
]);

const SAMPLES: Sample[] = [
  {
    id: 'samsungs26',
    name: 'Samsung Galaxy S26 Ultra launch',
    brand: 'Samsung',
    launch: '2026-10-06',
    window: ['2026-10-06', '2026-11-16'],
    competitor: 'Apple',
    locked_at: '2026-09-30',
    updated_at: '2026-11-03',
    goals: SAMSUNG_GOALS, // all on track — "On track on 5 of 5 goals"
  },
  {
    id: 'honor600s',
    name: 'HONOR 600S launch',
    brand: 'HONOR',
    launch: '2026-10-01',
    window: ['2026-10-01', '2026-11-09'],
    competitor: 'realme',
    locked_at: '2026-09-24',
    updated_at: '2026-10-26',
    goals: HONOR_GOALS,
  },
  {
    id: 'spicychickenjoy',
    name: 'Spicy Chickenjoy “Red Flag” campaign',
    brand: 'Jollibee',
    launch: '2026-10-15',
    window: ['2026-10-15', '2026-11-15'],
    competitor: 'McDonald’s',
    locked_at: '2026-10-11',
    updated_at: '2026-10-26',
    goals: JOLLIBEE_GOALS,
  },
  {
    id: 'vinfastvf8',
    name: 'VinFast VF 8 launch',
    brand: 'VinFast',
    launch: '2026-11-14', // still to come — a locked-date-pending draft
    window: ['2026-11-14', '2026-12-14'],
    competitor: 'BYD',
    locked_at: null, // brief not locked
    updated_at: '2026-10-24',
    goals: null, // no figures before launch
  },
  // Live campaigns — the list reads "The campaign is live." (goal detail lives behind Open).
  {
    id: 'globe5g',
    name: 'Globe 5G Rollout Q4 launch',
    brand: 'Globe Telecom',
    launch: '2026-10-06',
    window: ['2026-10-06', '2026-11-15'],
    competitor: '',
    locked_at: '2026-09-30',
    updated_at: '2026-10-28',
    goals: null,
  },
  {
    id: 'bdoholiday',
    name: 'BDO Holiday Savings Push',
    brand: 'BDO Unibank',
    launch: '2026-10-20',
    window: ['2026-10-20', '2026-11-29'],
    competitor: '',
    locked_at: '2026-10-15',
    updated_at: '2026-10-29',
    goals: null,
  },
  {
    id: 'dictbroadband',
    name: 'DICT Broadband Awareness',
    brand: 'Department of Information and Communications Technology',
    launch: '2026-09-29',
    window: ['2026-09-29', '2026-11-08'],
    competitor: '',
    locked_at: '2026-09-22',
    updated_at: '2026-10-27',
    goals: null,
  },
  {
    id: 'pldthomefibr',
    name: 'PLDT Home Fibr Upgrade launch',
    brand: 'PLDT Inc.',
    launch: '2026-10-13',
    window: ['2026-10-13', '2026-11-22'],
    competitor: '',
    locked_at: '2026-10-08',
    updated_at: '2026-10-28',
    goals: null,
  },
  {
    id: 'gcashpadala',
    name: 'GCash Padala Festival',
    brand: 'GCash (Mynt)',
    launch: '2026-10-27',
    window: ['2026-10-27', '2026-12-06'],
    competitor: '',
    locked_at: null, // brief not locked
    updated_at: '2026-10-30',
    goals: null,
  },
  {
    id: 'smartsignalboost',
    name: 'Smart Signal Boost Visayas launch',
    brand: 'Smart Communications',
    launch: '2026-11-01',
    window: ['2026-11-01', '2026-12-11'],
    competitor: '',
    locked_at: null, // brief not locked
    updated_at: '2026-11-02',
    goals: null,
  },
];

const toSummary = (s: Sample): ICampaignSummary => ({
  id: s.id,
  name: s.name,
  brand: s.brand,
  launch: s.launch,
  competitor: s.competitor,
  example: true,
  updated_at: s.updated_at,
  locked_at: s.locked_at,
  phase: phaseOf({ launch: s.launch, window: s.window, locked_at: s.locked_at }),
  goals: s.goals,
  left: s.goals ? daysLeft({ launch: s.launch, window: s.window }) : null,
});

// Mutable session list so a delete persists for the session (the real endpoint removes it).
let LIVE: Sample[] = [...SAMPLES];

// User-created drafts show first (newest on top), then the worked examples.
export const getCampaigns = (): ICampaignSummary[] => [
  ...getDraftSummaries(),
  ...LIVE.map(toSummary),
];

export const deleteCampaign = (id: string): ICampaignSummary[] => {
  LIVE = LIVE.filter((s) => s.id !== id);
  deleteDraft(id);
  return getCampaigns();
};
