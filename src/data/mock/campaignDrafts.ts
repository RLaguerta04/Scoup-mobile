// User-created draft evaluations — the "+ New evaluation" flow. A draft is a blank brief
// the user fills and then locks; once it exists it shows in the list and opens the brief
// read. Kept in a mutable session store (the real endpoints create/patch/lock a campaign).
import { addDays, TODAY } from '@/lib/dateRange';
import { formatCampaignDay, phaseOf } from '@/features/campaigns/phase';
import type {
  ICampaignBriefInput,
  ICampaignBriefRead,
  ICampaignDetail,
  ICampaignDraftForm,
  ICampaignSummary,
} from '@/types';

type DraftGoal = { short: string; target: string };

interface Draft {
  id: string;
  name: string;
  product: string;
  brand: string;
  competitor: string;
  launch: string;
  window: [string, string];
  locked: boolean;
  lockedAt: string | null;
  goals: DraftGoal[];
  updatedAt: string;
}

// The six default goals a new brief starts with (web: defaultGoals), as short + target.
const DEFAULT_GOALS: DraftGoal[] = [
  { short: 'Launch share', target: 'Win the launch conversation' },
  { short: 'Message pull-through', target: 'Stories carry the key line' },
  { short: 'Executive quoted', target: 'An executive quoted in most stories' },
  { short: 'Warmer than rival', target: 'Coverage turns warmer than the rival' },
  { short: 'Search interest', target: 'People search for it as much as the rival' },
  { short: 'Must-win outlets', target: 'The must-win outlets run the story' },
];

let SEQ = 0;
const DRAFTS: Draft[] = [];

const find = (id: string): Draft | undefined => DRAFTS.find((d) => d.id === id);

// A draft's window is launch → launch + 30 days (the lean builder sets one launch date).
const windowFor = (launch: string): [string, string] =>
  launch ? [launch, addDays(launch, 30)] : ['', ''];

export const createDraft = (): { id: string } => {
  SEQ += 1;
  const id = `draft-${SEQ}`;
  DRAFTS.unshift({
    id,
    name: 'New evaluation',
    product: '',
    brand: '',
    competitor: '',
    launch: '',
    window: ['', ''],
    locked: false,
    lockedAt: null,
    goals: DEFAULT_GOALS.map((g) => ({ ...g })),
    updatedAt: TODAY,
  });
  return { id };
};

export const deleteDraft = (id: string): void => {
  const i = DRAFTS.findIndex((d) => d.id === id);
  if (i >= 0) DRAFTS.splice(i, 1);
};

const toSummary = (d: Draft): ICampaignSummary => ({
  id: d.id,
  name: d.name,
  brand: d.brand || 'Draft',
  launch: d.launch,
  competitor: d.competitor,
  example: false,
  updated_at: d.updatedAt,
  locked_at: d.lockedAt,
  phase: phaseOf({ launch: d.launch, window: d.window, locked_at: d.lockedAt }),
  goals: null, // a draft/pre-launch has no figures yet
  left: null,
});

export const getDraftSummaries = (): ICampaignSummary[] => DRAFTS.map(toSummary);

const toDetail = (d: Draft): ICampaignDetail => {
  const brief: ICampaignBriefRead = {
    product: d.product || '—',
    brand: d.brand || '—',
    competitor: d.competitor || '—',
    launchLabel: d.launch ? formatCampaignDay(d.launch) : 'Not set',
    windowLabel:
      d.window[0] && d.window[1]
        ? `${formatCampaignDay(d.window[0])} – ${formatCampaignDay(d.window[1])}`
        : 'Not set',
    locked: d.locked,
    goals: d.goals.map((g) => ({ short: g.short, target: g.target })),
    background: `${d.product || 'This launch'} is measured against ${
      d.competitor || 'the rival'
    } from launch day. Lock the brief before launch day so the pre-launch baseline is captured.`,
  };
  return {
    id: d.id,
    name: d.name,
    brand: d.brand || 'Draft',
    phase: phaseOf({ launch: d.launch, window: d.window, locked_at: d.lockedAt }),
    hasFigures: false,
    onTrackCount: 0,
    goalTotal: d.goals.length,
    tooEarly: false,
    goalSummaries: [],
    home: null,
    goals: null,
    report: null,
    brief,
  };
};

export const getDraftDetail = (id: string): ICampaignDetail | null => {
  const d = find(id);
  return d ? toDetail(d) : null;
};

export const getDraftForm = (id: string): ICampaignDraftForm | null => {
  const d = find(id);
  if (!d) return null;
  return {
    id: d.id,
    product: d.product,
    brand: d.brand,
    competitor: d.competitor,
    launch: d.launch,
    goals: d.goals.map((g) => ({ ...g })),
    locked: d.locked,
  };
};

const applyBrief = (d: Draft, input: ICampaignBriefInput): void => {
  d.product = input.product.trim();
  d.brand = input.brand.trim();
  d.competitor = input.competitor.trim();
  d.launch = input.launch;
  d.window = windowFor(input.launch);
  d.goals = input.goals.map((g) => ({ short: g.short.trim(), target: g.target.trim() }));
  // Name the evaluation after the product, as the web does.
  if (d.product) d.name = `${d.product} launch`;
  d.updatedAt = TODAY;
};

export const updateDraftBrief = (input: ICampaignBriefInput): ICampaignDetail | null => {
  const d = find(input.id);
  if (!d) return null;
  applyBrief(d, input);
  return toDetail(d);
};

export const lockDraftBrief = (input: ICampaignBriefInput): ICampaignDetail | null => {
  const d = find(input.id);
  if (!d) return null;
  applyBrief(d, input);
  d.locked = true;
  d.lockedAt = TODAY;
  return toDetail(d);
};
