// Campaign ("Evaluation") DETAIL mock — a lean, hand-authored version of the web's
// Home / Goals / Report screens. The web composes these from large feed/figures/sheets/
// readings fixtures (hundreds of KB per campaign); here we author just enough per sample
// to drive the mobile screens faithfully. Phase is derived exactly as the list is.
import { phaseOf } from '@/features/campaigns/phase';
import type {
  ICampaignDetail,
  ICampaignGoalDetail,
  ICampaignPhase,
} from '@/types';
import { getDraftDetail } from './campaignDrafts';

const phaseFor = (
  launch: string,
  window: [string, string],
  locked_at: string | null,
): ICampaignPhase => phaseOf({ launch, window, locked_at });

// ─── HONOR 600S — live, a real mid-flight mix (3 on track) ───────────────────
const HONOR_GOALS: ICampaignGoalDetail[] = [
  {
    id: 'share',
    name: 'HONOR wins the mid-range conversation',
    short: 'Launch share',
    st: 'good',
    big: '38%',
    line: 'HONOR holds 38% of the mid-range conversation.',
    reading:
      'HONOR is the loudest mid-range voice three weeks running — 11 points clear of realme. The price-and-battery story is doing the work.',
    target: 'Stay above 32% share to the window close.',
    chanceMet: 82,
    forecastBand: '36–41%',
    forecastNote: 'Trending up; pace holding.',
    bars: [
      { label: 'HONOR', value: 38, mark: 32, highlight: true },
      { label: 'realme', value: 27 },
      { label: 'Others', value: 35 },
    ],
    barMax: 50,
    barUnit: '%',
    evidence: {
      title: 'Share of conversation',
      story: [
        'HONOR appears in 38% of mid-range handset coverage this period, measured across 240 coded items.',
        'realme sits at 27%; the rest is split across five brands. The gap has widened each week since launch.',
      ],
      items: [
        { headline: 'HONOR 600S undercuts realme on battery', outlet: 'GMA News Online', tone: 'Positive' },
        { headline: 'Mid-range shootout: HONOR vs realme', outlet: 'Unbox PH', tone: 'Neutral' },
        { headline: 'Why the 600S is the value pick this quarter', outlet: 'YugaTech', tone: 'Positive' },
      ],
    },
  },
  {
    id: 'messages',
    name: 'Stories carry the price and the battery',
    short: 'Message pull-through',
    st: 'warn',
    big: '61%',
    line: '61% of stories carry the price or battery line.',
    reading:
      'Pull-through slipped 4 points this week as launch coverage aged. The battery line still lands; the price line is fading from headlines.',
    target: 'Get back above 70% — re-seed the price line with the must-win outlets.',
    chanceMet: 48,
    forecastBand: '58–66%',
    forecastNote: 'Flat to down; needs a push.',
    bars: [
      { label: 'Carries the line', value: 61, mark: 70, highlight: true },
      { label: 'No line', value: 39 },
    ],
    barMax: 100,
    barUnit: '%',
    evidence: {
      title: 'Message pull-through',
      story: [
        '61% of the 240 coded stories carry either the price or the battery line — down from 65% last week.',
        'The battery line appears in 52% of stories; the price line in 34% and falling.',
      ],
      items: [
        { headline: '600S battery lasts two days, HONOR says', outlet: 'Manila Bulletin Tech', tone: 'Positive' },
        { headline: 'HONOR 600S review: the battery is the story', outlet: 'GadgetMatch', tone: 'Positive' },
      ],
    },
  },
  {
    id: 'spox',
    name: 'An HONOR executive is quoted in most stories',
    short: 'Executive quoted',
    st: 'good',
    big: '72%',
    line: 'An HONOR executive is quoted in 72% of stories.',
    reading:
      'Spokesperson visibility is strong and steady — the GM’s battery quote is the most-picked-up line of the launch.',
    target: 'Hold above 60% to the window close.',
    chanceMet: 88,
    forecastBand: '68–75%',
    forecastNote: 'Steady.',
    bars: [
      { label: 'Quoted', value: 72, mark: 60, highlight: true },
      { label: 'Not quoted', value: 28 },
    ],
    barMax: 100,
    barUnit: '%',
    evidence: {
      title: 'Executive visibility',
      story: [
        'An HONOR executive is quoted in 72% of stories — most often the country GM on the battery claim.',
        'Quotes skew to the battery and price lines, reinforcing the two core messages.',
      ],
      items: [
        { headline: '“Two days on a charge,” says HONOR GM', outlet: 'ABS-CBN News', tone: 'Positive' },
        { headline: 'HONOR exec on taking the mid-range crown', outlet: 'Inquirer Tech', tone: 'Neutral' },
      ],
    },
  },
  {
    id: 'tone',
    name: 'Coverage gets warmer than before launch',
    short: 'Warmer than rival',
    st: 'early',
    big: '+0.3',
    line: 'Coverage is slightly warmer than the baseline.',
    reading:
      'Too early to call — tone sits just above the pre-launch baseline but hasn’t separated from it with confidence yet.',
    target: 'Reach +0.5 vs baseline by week 5.',
    chanceMet: 0,
    forecastBand: '—',
    forecastNote: 'Too early to call.',
    bars: [
      { label: 'Baseline', value: 50 },
      { label: 'Now', value: 53, highlight: true },
    ],
    barMax: 100,
    barUnit: '',
    evidence: {
      title: 'Tone vs baseline',
      story: [
        'Net tone is +0.3 against a pre-launch baseline of 0 — inside the margin, so not a confident call yet.',
        'A fuller read lands once volume doubles over the next week.',
      ],
      items: [
        { headline: 'First impressions: the 600S feels premium', outlet: 'Unbox PH', tone: 'Positive' },
      ],
    },
  },
  {
    id: 'search',
    name: 'People search for the 600S as much as the rival',
    short: 'Search interest',
    st: 'good',
    big: '1.1×',
    line: 'People search for the 600S 1.1× as much as the rival.',
    reading:
      'Search interest overtook realme in week 2 and is holding just ahead — the price cut drove the spike.',
    target: 'Stay at or above parity (1.0×).',
    chanceMet: 76,
    forecastBand: '1.0–1.2×',
    forecastNote: 'Holding ahead.',
    bars: [
      { label: '600S', value: 110, mark: 100, highlight: true },
      { label: 'Rival', value: 100 },
    ],
    barMax: 130,
    barUnit: '',
    evidence: {
      title: 'Search interest',
      story: [
        'Search interest for the 600S runs at 1.1× the rival’s, indexed to the rival at 100.',
        'The lead opened after the week-2 price announcement and has held since.',
      ],
      items: [
        { headline: 'HONOR 600S price trends on launch day', outlet: 'Google Trends PH', tone: 'Neutral' },
      ],
    },
  },
  {
    id: 'mustwin',
    name: 'The must-win outlets run the story',
    short: 'Must-win outlets',
    st: 'bad',
    big: '2 of 5',
    line: '2 of 5 must-win outlets have run the story.',
    reading:
      'Off track — three must-win outlets are still silent three weeks in. This is the week’s biggest risk to share.',
    target: 'Land the remaining three before the window closes.',
    chanceMet: 22,
    forecastBand: '2–3 of 5',
    forecastNote: 'Behind pace.',
    bars: [
      { label: 'Ran the story', value: 2, mark: 5, highlight: true },
      { label: 'Still pending', value: 3 },
    ],
    barMax: 5,
    barUnit: '',
    evidence: {
      title: 'Must-win outlets',
      story: [
        'Two of the five must-win outlets have run the launch story: GMA News Online and YugaTech.',
        'Pending: Inquirer Tech, Rappler, and Philstar Technology. All three are the week’s outreach priority.',
      ],
      items: [
        { headline: 'HONOR 600S launch coverage', outlet: 'GMA News Online', tone: 'Positive' },
        { headline: 'HONOR 600S first look', outlet: 'YugaTech', tone: 'Positive' },
      ],
    },
  },
];

// ─── Jollibee — live but all too early to call ───────────────────────────────
const JOLLIBEE_GOALS: ICampaignGoalDetail[] = [
  {
    id: 'share',
    name: 'Jollibee wins the fried-chicken conversation',
    short: 'Launch share',
    st: 'early',
    big: '—',
    line: 'Too early to call — coverage is still thin.',
    reading: 'Not enough coverage yet to judge share. Volume is building but below the read threshold.',
    target: 'Win 40%+ of the fried-chicken conversation.',
    chanceMet: 0,
    forecastBand: '—',
    forecastNote: 'Too early to call.',
    bars: [],
    barMax: 100,
    barUnit: '%',
    evidence: {
      title: 'Launch share',
      story: ['Coverage volume is still below the threshold needed for a confident share read.'],
      items: [{ headline: 'Jollibee teases a “Red Flag” drop', outlet: 'When In Manila', tone: 'Neutral' }],
    },
  },
  {
    id: 'messages',
    name: 'Stories name the red-flag line',
    short: 'Message pull-through',
    st: 'early',
    big: '—',
    line: 'Too early to call.',
    reading: 'The red-flag line is landing in early teasers, but it’s too soon to judge pull-through.',
    target: '70% of stories carry the red-flag line.',
    chanceMet: 0,
    forecastBand: '—',
    forecastNote: 'Too early to call.',
    bars: [],
    barMax: 100,
    barUnit: '%',
    evidence: {
      title: 'Message pull-through',
      story: ['Early teasers carry the line, but the sample is too small to read.'],
      items: [{ headline: 'What is Jollibee’s “Red Flag”?', outlet: 'Spot.ph', tone: 'Neutral' }],
    },
  },
  {
    id: 'spox',
    name: 'A Jollibee executive is quoted',
    short: 'Executive quoted',
    st: 'early',
    big: '—',
    line: 'Too early to call.',
    reading: 'A handful of quotes so far — not enough to judge visibility.',
    target: 'An executive quoted in half the stories.',
    chanceMet: 0,
    forecastBand: '—',
    forecastNote: 'Too early to call.',
    bars: [],
    barMax: 100,
    barUnit: '%',
    evidence: {
      title: 'Executive visibility',
      story: ['Too few quoted stories so far to read.'],
      items: [{ headline: 'Jollibee marketing lead on the campaign', outlet: 'Marketing-Interactive', tone: 'Neutral' }],
    },
  },
  {
    id: 'tone',
    name: 'Coverage gets warmer than before the campaign',
    short: 'Warmer than rival',
    st: 'early',
    big: '—',
    line: 'Too early to call.',
    reading: 'Tone hasn’t separated from the baseline yet.',
    target: 'Coverage turns warmer than McDonald’s by week 4.',
    chanceMet: 0,
    forecastBand: '—',
    forecastNote: 'Too early to call.',
    bars: [],
    barMax: 100,
    barUnit: '',
    evidence: {
      title: 'Tone vs baseline',
      story: ['Not enough volume to separate tone from the baseline.'],
      items: [],
    },
  },
];

// ─── Samsung Galaxy S26 Ultra — live and winning (5 of 5 on track) ───────────
const SAMSUNG_GOALS: ICampaignGoalDetail[] = [
  {
    id: 'share',
    name: 'Samsung wins the flagship conversation',
    short: 'Launch share',
    st: 'good',
    big: '44%',
    line: 'Samsung holds 44% of the flagship conversation.',
    reading:
      'Samsung is the loudest flagship voice four weeks running — 13 points clear of Apple. The camera and on-device AI story is carrying it.',
    target: 'Stay above 35% share to the window close.',
    chanceMet: 90,
    forecastBand: '42–47%',
    forecastNote: 'Trending up; pace strong.',
    bars: [
      { label: 'Samsung', value: 44, mark: 35, highlight: true },
      { label: 'Apple', value: 31 },
      { label: 'Others', value: 25 },
    ],
    barMax: 50,
    barUnit: '%',
    evidence: {
      title: 'Share of conversation',
      story: [
        'Samsung appears in 44% of flagship coverage this period, 13 points clear of Apple at 31%.',
        'The lead has widened every week since launch, driven by camera and AI reviews.',
      ],
      items: [
        { headline: 'Galaxy S26 Ultra camera sets a new bar', outlet: 'Unbox PH', tone: 'Positive' },
        { headline: 'Samsung’s on-device AI steals the show', outlet: 'GadgetMatch', tone: 'Positive' },
        { headline: 'S26 Ultra vs iPhone: the flagship to beat', outlet: 'YugaTech', tone: 'Positive' },
      ],
    },
  },
  {
    id: 'messages',
    name: 'Stories carry the camera and on-device AI lines',
    short: 'Message pull-through',
    st: 'good',
    big: '78%',
    line: '78% of stories carry the camera or AI line.',
    reading:
      'Pull-through is strong and climbing — the 200MP camera line is the most-repeated message of the launch.',
    target: 'Hold above 70% to the window close.',
    chanceMet: 86,
    forecastBand: '75–81%',
    forecastNote: 'Steady and strong.',
    bars: [
      { label: 'Carries the line', value: 78, mark: 70, highlight: true },
      { label: 'No line', value: 22 },
    ],
    barMax: 100,
    barUnit: '%',
    evidence: {
      title: 'Message pull-through',
      story: [
        '78% of coded stories carry either the camera or the on-device AI line — up from 74% last week.',
        'The camera line leads at 61% of stories; the AI line follows at 44%.',
      ],
      items: [
        { headline: '200MP camera is the S26 Ultra’s headline act', outlet: 'Manila Bulletin Tech', tone: 'Positive' },
        { headline: 'Galaxy AI runs on-device — here’s what that means', outlet: 'Inquirer Tech', tone: 'Positive' },
      ],
    },
  },
  {
    id: 'spox',
    name: 'A Samsung executive is quoted in most stories',
    short: 'Executive quoted',
    st: 'good',
    big: '81%',
    line: 'A Samsung executive is quoted in 81% of stories.',
    reading:
      'Executive visibility is excellent — the mobile president’s AI quote leads most pieces.',
    target: 'Hold above 60%.',
    chanceMet: 92,
    forecastBand: '78–84%',
    forecastNote: 'Steady.',
    bars: [
      { label: 'Quoted', value: 81, mark: 60, highlight: true },
      { label: 'Not quoted', value: 19 },
    ],
    barMax: 100,
    barUnit: '%',
    evidence: {
      title: 'Executive visibility',
      story: [
        'A Samsung executive is quoted in 81% of stories — most often the mobile president on Galaxy AI.',
        'Quotes skew to the camera and AI lines, reinforcing the two core messages.',
      ],
      items: [
        { headline: '“AI you can trust, on your device,” says Samsung', outlet: 'ABS-CBN News', tone: 'Positive' },
      ],
    },
  },
  {
    id: 'tone',
    name: 'Coverage runs warmer than Apple',
    short: 'Warmer than rival',
    st: 'good',
    big: '+0.6',
    line: 'Coverage runs clearly warmer than Apple.',
    reading:
      'Net tone is strongly positive and ahead of Apple’s — the design and battery coverage is glowing.',
    target: 'Stay above +0.4 vs baseline.',
    chanceMet: 84,
    forecastBand: '+0.5 to +0.7',
    forecastNote: 'Holding warm.',
    bars: [
      { label: 'Apple', value: 46 },
      { label: 'Samsung', value: 62, highlight: true },
    ],
    barMax: 100,
    barUnit: '',
    evidence: {
      title: 'Tone vs rival',
      story: [
        'Samsung’s net tone sits at +0.6 against a baseline of 0 — and ahead of Apple’s +0.2 this period.',
        'The warmest coverage clusters around the camera, battery and design.',
      ],
      items: [
        { headline: 'The S26 Ultra is the best-built Galaxy yet', outlet: 'GMA News Online', tone: 'Positive' },
      ],
    },
  },
  {
    id: 'search',
    name: 'People search for the S26 more than the rival',
    short: 'Search interest',
    st: 'good',
    big: '1.3×',
    line: 'People search for the S26 1.3× as much as the rival.',
    reading:
      'Search interest pulled ahead at launch and keeps widening — the camera demos drove the spike.',
    target: 'Stay at or above parity (1.0×).',
    chanceMet: 88,
    forecastBand: '1.2–1.4×',
    forecastNote: 'Widening lead.',
    bars: [
      { label: 'S26 Ultra', value: 130, mark: 100, highlight: true },
      { label: 'Rival', value: 100 },
    ],
    barMax: 150,
    barUnit: '',
    evidence: {
      title: 'Search interest',
      story: [
        'Search interest for the S26 Ultra runs at 1.3× the rival’s, indexed to the rival at 100.',
        'The lead opened on launch day and has widened with each camera-feature story.',
      ],
      items: [
        { headline: 'Galaxy S26 Ultra tops launch-day searches', outlet: 'Google Trends PH', tone: 'Neutral' },
      ],
    },
  },
];

const DETAILS: Record<string, ICampaignDetail> = {
  samsungs26: {
    id: 'samsungs26',
    name: 'Samsung Galaxy S26 Ultra launch',
    brand: 'Samsung',
    phase: phaseFor('2026-10-06', ['2026-10-06', '2026-11-16'], '2026-09-30'),
    hasFigures: true,
    onTrackCount: 5,
    goalTotal: 5,
    tooEarly: false,
    goalSummaries: SAMSUNG_GOALS.map((g) => ({ id: g.id, name: g.name, short: g.short, st: g.st })),
    home: {
      decide:
        'Keep the momentum — hold the camera-and-AI line and the executive cadence. Seed two more hands-on camera features before the window closes to bank the share lead.',
      since: [
        { text: 'Launch share +4 pts', dir: 'up' },
        { text: 'Search interest +8 pts', dir: 'up' },
        { text: 'Tone holding warm', dir: 'flat' },
      ],
      chain:
        'Strong camera coverage is pulling search interest up, which keeps widening Samsung’s share lead over Apple.',
      story:
        'Samsung owns the flagship conversation four weeks in. The camera and on-device AI lines are landing, executives are visible, and coverage runs warmer than Apple every week — all five goals are on track.',
      glance: SAMSUNG_GOALS.map((g) => ({
        short: g.short,
        st: g.st,
        now: g.big,
        since:
          g.id === 'share' ? '▲ +4' : g.id === 'search' ? '▲ +8' : g.id === 'tone' ? '– warm' : '▲',
        forecast: g.forecastNote,
      })),
    },
    goals: SAMSUNG_GOALS,
    report: {
      headline: 'Week 4 — Samsung is winning across the board.',
      sections: [
        {
          heading: 'Where we stand',
          body: 'All five goals are on track. Samsung holds 44% of the flagship conversation (13 points clear of Apple), message pull-through is at 78%, executives are quoted in 81% of stories, tone runs warmer than Apple at +0.6, and search interest is 1.3× the rival.',
        },
        {
          heading: 'What it means',
          body: 'The camera-and-AI narrative is doing exactly what the brief set out — driving share, search and warmth together. Apple’s response coverage hasn’t dented the lead.',
        },
        {
          heading: 'What to do now',
          body: 'Keep the momentum: hold the executive cadence and seed two more hands-on camera features before the window closes to bank the share lead.',
        },
      ],
    },
    brief: null,
  },
  honor600s: {
    id: 'honor600s',
    name: 'HONOR 600S launch',
    brand: 'HONOR',
    phase: phaseFor('2026-10-01', ['2026-10-01', '2026-11-09'], '2026-09-24'),
    hasFigures: true,
    onTrackCount: 3,
    goalTotal: 6,
    tooEarly: false,
    goalSummaries: HONOR_GOALS.map((g) => ({ id: g.id, name: g.name, short: g.short, st: g.st })),
    home: {
      decide:
        'Push the three silent must-win outlets — that’s the week’s biggest risk. Re-seed the price line with a fresh battery angle before the weekend.',
      since: [
        { text: 'Launch share +6 pts', dir: 'up' },
        { text: 'Message pull-through −4 pts', dir: 'down' },
        { text: 'Search interest steady', dir: 'flat' },
      ],
      chain:
        'Aging launch coverage pulled message pull-through down, which is loosening HONOR’s grip on the price line.',
      story:
        'HONOR owns the mid-range conversation three weeks in, carried by the price-and-battery story. Coverage runs warmer than launch, but two must-win outlets are still silent and the price line is slipping out of headlines.',
      glance: HONOR_GOALS.map((g) => ({
        short: g.short,
        st: g.st,
        now: g.big,
        since:
          g.id === 'share' ? '▲ +6' : g.id === 'messages' ? '▼ −4' : g.id === 'search' ? '– steady' : '–',
        forecast: g.forecastNote,
      })),
    },
    goals: HONOR_GOALS,
    report: {
      headline: 'Week 5 — HONOR is winning the conversation; the must-win list is the risk.',
      sections: [
        {
          heading: 'Where we stand',
          body: 'Three of six goals are on track: share of conversation (38%), executive visibility (72%) and search interest (1.1× the rival). Message pull-through has slipped to 61%, and only two of five must-win outlets have run the story.',
        },
        {
          heading: 'What it means',
          body: 'The launch narrative is aging. HONOR still leads, but the price line — the strongest driver of share — is fading from headlines, and the must-win gap caps how far share can climb.',
        },
        {
          heading: 'What to do now',
          body: 'Land the three silent must-win outlets this week and re-seed the price line with a fresh battery-life angle. Hold the spokesperson cadence; it’s working.',
        },
      ],
    },
    brief: null,
  },
  spicychickenjoy: {
    id: 'spicychickenjoy',
    name: 'Spicy Chickenjoy “Red Flag” campaign',
    brand: 'Jollibee',
    phase: phaseFor('2026-10-15', ['2026-10-15', '2026-11-15'], '2026-10-11'),
    hasFigures: true,
    onTrackCount: 0,
    goalTotal: 4,
    tooEarly: true,
    goalSummaries: JOLLIBEE_GOALS.map((g) => ({ id: g.id, name: g.name, short: g.short, st: g.st })),
    home: {
      decide:
        'Too early to call — hold the plan. Keep seeding the red-flag line; the first real read lands after week 3 as volume builds.',
      since: [
        { text: 'Coverage volume building', dir: 'up' },
        { text: 'Tone flat vs baseline', dir: 'flat' },
      ],
      story:
        'The Red Flag campaign is building. Coverage is still thin and tone hasn’t separated from McDonald’s yet — the plan is on track, the figures just aren’t in.',
      glance: JOLLIBEE_GOALS.map((g) => ({
        short: g.short,
        st: g.st,
        now: '—',
        since: '–',
        forecast: 'Too early',
      })),
    },
    goals: JOLLIBEE_GOALS,
    report: {
      headline: 'Week 3 — too early to call.',
      sections: [
        {
          heading: 'Where we stand',
          body: 'All four goals are still too early to call. Coverage volume is building but below the read threshold.',
        },
        {
          heading: 'What to do now',
          body: 'Hold the plan and keep seeding the red-flag line. The first real read lands next week as volume doubles.',
        },
      ],
    },
    brief: null,
  },
  vinfastvf8: {
    id: 'vinfastvf8',
    name: 'VinFast VF 8 launch',
    brand: 'VinFast',
    phase: phaseFor('2026-11-14', ['2026-11-14', '2026-12-14'], null),
    hasFigures: false,
    onTrackCount: 0,
    goalTotal: 4,
    tooEarly: false,
    goalSummaries: [],
    home: null,
    goals: null,
    report: null,
    brief: {
      product: 'VinFast VF 8',
      brand: 'VinFast',
      competitor: 'BYD',
      launchLabel: '14 Nov 2026',
      windowLabel: '14 Nov – 14 Dec 2026',
      locked: false,
      goals: [
        { short: 'Launch share', target: 'Win 30%+ of the EV-launch conversation.' },
        { short: 'Message pull-through', target: '70% of stories carry the range or price line.' },
        { short: 'Executive quoted', target: 'A VinFast executive quoted in most stories.' },
        { short: 'Warmer than rival', target: 'Coverage turns warmer than BYD by week 4.' },
      ],
      background:
        'VinFast enters the Philippine EV market against BYD. This evaluation measures launch share of voice, message pull-through, executive visibility, and whether coverage turns warmer than BYD through the first month. Lock the brief before launch day so the pre-launch baseline is captured.',
    },
  },
};

export const getCampaignDetail = (id: string): ICampaignDetail | null =>
  getDraftDetail(id) ?? DETAILS[id] ?? null;
