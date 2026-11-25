// Decision Report mock — the "Nightwatch" weekly decision brief. Reproduces the six
// canonical stories from the web app's fixtures (scoup_ui_v2 src/mocks/handlers/
// decisionReport.ts STORY_SEEDS) so the mobile brief reads identically to the web
// screenshot: 1 ACT · 2 WATCH · 3 SKIP, 111 articles, 29,924 comments. Read-only
// generator (like campaigns.ts) — the newsletterId only resolves the display name.
import { NEWSLETTERS } from './entities';
import { hourlyShape, intBetween, rngFor, type Rand } from './util';
import type {
  IBriefWindow,
  ICanvasCoverage,
  ICanvasMetric,
  ICanvasOutlet,
  ICanvasVoice,
  IDecisionAlert,
  IDecisionComment,
  IDecisionContext,
  IDecisionCount,
  IDecisionEdition,
  IDecisionPress,
  IDecisionStory,
  IDecisionStoryDetail,
  IDecisionTracker,
  IEmotionShare,
  IPeriodTone,
  IStoryHourlyDay,
  ReportCadence,
} from '@/types';

// The 8 tracked emotions (Plutchik), in radar order; labels match theme emotionColor keys.
const EMO_LABELS = ['Anger', 'Fear', 'Disgust', 'Sadness', 'Surprise', 'Anticipation', 'Trust', 'Joy'] as const;
// A per-story 8-emotion share, biased by the story's comment stance (negative stories lean
// Anger/Fear/Disgust/Sadness; positive lean Anticipation/Trust/Joy), deterministic per id.
const storyEmotions = (id: string, neg: number, pos: number): IEmotionShare[] => {
  const rand = rngFor(`emo:${id}`);
  const raw = [
    10 + neg * 0.4, // Anger
    8 + neg * 0.2, // Fear
    5 + neg * 0.12, // Disgust
    5 + neg * 0.1, // Sadness
    8, // Surprise (neutral-ish)
    8 + pos * 0.15, // Anticipation
    6 + pos * 0.2, // Trust
    5 + pos * 0.3, // Joy
  ].map((w) => w * (0.85 + rand() * 0.3));
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  const pcts = raw.map((w) => Math.round((w / sum) * 100));
  const diff = 100 - pcts.reduce((a, b) => a + b, 0);
  pcts[pcts.indexOf(Math.max(...pcts))] += diff; // absorb the rounding drift into the top emotion
  return EMO_LABELS.map((label, i) => ({ label, pct: pcts[i] }));
};

// storyValuePoints / negativeEmotionPct / emotions are computed (not literal) — omit from the seed.
type Seed = Omit<IDecisionStory, 'rank' | 'storyValuePoints' | 'negativeEmotionPct' | 'emotions'>;

// Per-story metric raw values, stable per story id (so the dot-strip + drill ranking are
// identical no matter which story is opened). Story 1's are pinned to the screenshot.
const svPointsOf = (s: Seed): number =>
  s.id === 'telco-dropped-call' ? 72 : intBetween(rngFor(`sv:${s.id}`), 20, 95);
const negEmoOf = (s: Seed): number =>
  s.id === 'telco-dropped-call' ? 47 : intBetween(rngFor(`nemo:${s.id}`), 10, 50);

// Attach rank + the computed metric scalars to a seed to make a full IDecisionStory.
const toStory = (s: Seed, rank: number): IDecisionStory => ({
  ...s,
  rank,
  storyValuePoints: svPointsOf(s),
  negativeEmotionPct: negEmoOf(s),
  emotions: storyEmotions(s.id, s.stance.neg, s.stance.pos),
});

// Priority-descending — the rank is assigned by position below. Comment totals sum to
// 29,924 and article totals to 111 so the counts strip agrees with the per-story figures.
const STORY_SEEDS: Seed[] = [
  {
    id: 'telco-dropped-call',
    verdict: 'act',
    title: 'Senate probes dropped-call complaints against carriers',
    dek: 'Sets the regulatory tone for the quarter and frames every follow-on service story.',
    actionLine: 'Sets the regulatory tone for the quarter and frames every follow-on service story.',
    priority: 94,
    trend: 'Rising',
    momentum: 55,
    weightedEngagement: 8800,
    velocity: 3.4,
    articles: 39,
    comments: 7771,
    negativeCommentsPct: 49,
    lateSharePct: 7,
    net: -38,
    storySize: 55, risk: 88, stance: { neg: 100, neu: 0, pos: 0 }, positivePct: 16, mentions: 1079, dayStatus: 'GREEN', trackerDay: 2,
    keywordHits: [
      { term: 'telco', count: 37 },
      { term: 'service', count: 4 },
    ],
    good: false,
    opportunity: 0,
    engagements: 18400,
  },
  {
    id: 'telco-5g',
    verdict: 'skip',
    title: 'PLDT, Globe expand 5G coverage to 20 more cities',
    dek: 'Friendly rollout coverage with no downside — amplify it while it runs.',
    actionLine: 'Steady, friendly coverage you can amplify.',
    priority: 78,
    trend: 'Steady',
    momentum: 42,
    weightedEngagement: 6200,
    velocity: 2.1,
    articles: 24,
    comments: 5120,
    negativeCommentsPct: 11,
    lateSharePct: 12,
    net: 48,
    storySize: 79, risk: 18, stance: { neg: 0, neu: 0, pos: 100 }, positivePct: 58, mentions: 2289, dayStatus: 'GREEN',
    keywordHits: [
      { term: 'telco', count: 22 },
      { term: '5g', count: 9 },
    ],
    good: true,
    opportunity: 71,
    engagements: 14200,
  },
  {
    id: 'gov-flood',
    verdict: 'watch',
    title: 'DPWH fast-tracks flood-control projects in NCR',
    dek: 'Momentum is climbing and the comments are split on whether it gets delivered.',
    actionLine: 'Momentum is climbing and the comments are split.',
    priority: 66,
    trend: 'Rising',
    momentum: 48,
    weightedEngagement: 4900,
    velocity: 1.8,
    articles: 18,
    comments: 6240,
    negativeCommentsPct: 41,
    lateSharePct: 9,
    net: 2,
    storySize: 61, risk: 12, stance: { neg: 30, neu: 40, pos: 30 }, positivePct: 34, mentions: 450, dayStatus: 'GREEN', trackerDay: 1,
    keywordHits: [
      { term: 'flood', count: 15 },
      { term: 'dpwh', count: 11 },
    ],
    good: false,
    opportunity: 0,
    engagements: 9800,
  },
  {
    id: 'bank-bsp-rate',
    verdict: 'skip',
    title: 'BSP keeps benchmark rate steady amid easing inflation',
    dek: 'Calm, on-message coverage — nothing here needs a correction.',
    actionLine: 'Calm, on-message coverage — nothing to correct.',
    priority: 52,
    trend: 'Steady',
    momentum: 30,
    weightedEngagement: 3100,
    velocity: 0.9,
    articles: 14,
    comments: 2979,
    negativeCommentsPct: 14,
    lateSharePct: 18,
    net: 48,
    storySize: 74, risk: 22, stance: { neg: 0, neu: 0, pos: 100 }, positivePct: 58, mentions: 2276, dayStatus: 'GREEN',
    keywordHits: [
      { term: 'bsp', count: 12 },
      { term: 'rate', count: 6 },
    ],
    good: false,
    opportunity: 0,
    engagements: 5200,
  },
  {
    id: 'gov-permits',
    verdict: 'skip',
    title: 'Palace signs order streamlining business permits',
    dek: 'A good-news item cooling off — lend a quote while it still has reach.',
    actionLine: 'A good-news item cooling off — lend a quote while it lasts.',
    priority: 44,
    trend: 'Fading',
    momentum: 21,
    weightedEngagement: 2600,
    velocity: 0.6,
    articles: 11,
    comments: 2140,
    negativeCommentsPct: 9,
    lateSharePct: 24,
    net: 48,
    storySize: 70, risk: 20, stance: { neg: 0, neu: 0, pos: 100 }, positivePct: 58, mentions: 2079, dayStatus: 'GREEN',
    keywordHits: [
      { term: 'permits', count: 10 },
      { term: 'palace', count: 5 },
    ],
    good: true,
    opportunity: 76,
    engagements: 10900,
  },
  {
    id: 'telco-ntc-rural',
    verdict: 'watch',
    title: 'NTC orders telcos to improve rural signal',
    dek: 'Slow climb with provincial pick-up — could feed the dropped-call story.',
    actionLine: 'Slow climb, provincial pick-up — could feed the dropped-call story.',
    priority: 38,
    trend: 'Rising',
    momentum: 27,
    weightedEngagement: 1900,
    velocity: 0.5,
    articles: 5,
    comments: 5674,
    negativeCommentsPct: 33,
    lateSharePct: 15,
    net: 2,
    storySize: 48, risk: 45, stance: { neg: 30, neu: 40, pos: 30 }, positivePct: 34, mentions: 1104, dayStatus: 'GREEN',
    keywordHits: [
      { term: 'ntc', count: 8 },
      { term: 'rural', count: 4 },
    ],
    good: false,
    opportunity: 0,
    engagements: 7600,
  },
];

// The six header KPIs, verbatim from the web screenshot. Alert thresholds mirror the
// web (negative articles > 40%, negative comments > 60%) — none trip here.
const COUNTS: IDecisionCount[] = [
  { key: 'articles', label: 'Articles', value: '111', sub: 'on 6 stories' },
  { key: 'negArticles', label: 'Negative articles', value: '32%', sub: '35 of 111' },
  { key: 'sentiment', label: 'Sentiment score', value: '+0.00', sub: '0/1 days below -0.10' },
  { key: 'posts', label: 'Posts', value: '9,166', sub: 'on 6 of 6 stories' },
  { key: 'comments', label: 'Comments', value: '29,924', sub: 'on those posts' },
  { key: 'negComments', label: 'Negative comments', value: '23%', sub: 'of 29,924 read' },
];

// "Most liked comments" across the stories (How people felt). A small deterministic set.
const LIKED_COMMENTS: { text: string; sentiment: IDecisionComment['sentiment']; emotion: string }[] = [
  { text: 'Maganda ito, salamat sa mabilis na aksyon.', sentiment: 'positive', emotion: 'Gratitude' },
  { text: 'Finally some clarity — been waiting for this to move.', sentiment: 'positive', emotion: 'Hope' },
  { text: 'I will believe it when I see it on the ground.', sentiment: 'neutral', emotion: 'Concern' },
  { text: 'Dapat tuloy-tuloy ito, hindi one-time lang.', sentiment: 'neutral', emotion: 'Curiosity' },
  { text: 'Grabe ang dropped calls — kailangan talaga imbestigahan.', sentiment: 'negative', emotion: 'Frustration' },
  { text: 'Helpful breakdown, sharing this with the family group.', sentiment: 'positive', emotion: 'Gratitude' },
];
const buildMostLiked = (): IDecisionComment[] => {
  const rand = rngFor('most-liked');
  return LIKED_COMMENTS.map((c, i) => ({
    id: `liked-${i}`,
    text: c.text,
    sentiment: c.sentiment,
    emotion: c.emotion,
    likes: intBetween(rand, 120, 480),
    storyTitle: STORY_SEEDS[i % STORY_SEEDS.length].title,
  })).sort((a, b) => b.likes - a.likes);
};

// Edition-level context for "The rest of the week" — the week-against-normal figures, the
// report-level figures, the day labels, and the most-liked comments.
const CONTEXT: IDecisionContext = {
  weekAgainstNormal: [
    { label: 'Articles and broadcasts', value: '111', sub: 'across the stories in scope' },
    { label: 'Negative articles', value: '32%', sub: '35 of 111' },
    { label: 'Main-focus articles', value: '69%', sub: '77 where the story is the subject' },
    { label: 'Social posts', value: '9,166', sub: 'on 6 of the stories' },
    { label: 'Comments', value: '29,924', sub: 'on those posts' },
  ],
  reportFigures: [
    { label: 'Sentiment score', value: '+0.00', sub: 'positive minus negative, -1 to +1' },
    { label: 'Sentiment floor', value: '0 of 1 days', sub: 'below -0.10 · worst +0.00 on Thu 31' },
    { label: 'Alert status', value: '0 of 6 stories', sub: 'AMBER or RED: 60% negative or more with 50+ mentions; RED adds a contested claim' },
  ],
  dayLabels: ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
  mostLiked: buildMostLiked(),
};

// Two open crisis trackers, reproducing the web screenshot's "Crises open · 2 trackers":
// DPWH flood-control ESCALATING (Day 1, 2.3×) first (worst first), then Senate dropped-call
// STABLE (Day 2, 0.90×). Their storyIds match the ranked stories, which carry `trackerDay`.
const TRACKERS: IDecisionTracker[] = [
  {
    id: 'gov-flood',
    storyId: 'gov-flood',
    storyTitle: 'DPWH fast-tracks flood-control projects in NCR',
    verdict: 'escalating',
    day: 1,
    dateLabel: 'Thu 31',
    timesNormal: 2.3,
    decisionToday:
      'Get ahead of the delivery question — publish the project list with ward-level timelines before the split hardens into doubt.',
    move: 'Attention is climbing and two unfavorable outlets turned today, so it reads escalating.',
    peakX: 2.3,
    peakDay: 1,
    trend: 'rising',
    normalItems: 8,
    attention: [1.0, 2.3],
    changed: {
      items: 42,
      records: 31,
      comments: 180,
      newOutlets: ['Rappler', 'GMA News Online'],
      tierScore: 64,
      newClaim: 'Posts claim earlier flood-control funds went unspent — contested, no source yet.',
    },
    nextStep: 'Line up a DPWH spokesperson for a Friday-morning briefing with the ward-level timeline.',
    goals: [
      { id: '(a)', label: 'First statement out', status: 'met', value: 'Day 1, 11:20 am', detail: 'DPWH posted a holding statement within the day.' },
      { id: '(b)', label: 'Keep attention under 2×', status: 'missed', value: '2.3×', detail: 'Peaked at 2.3× a normal day, above the 2× containing line.' },
      { id: '(c)', label: 'No contested claim unanswered', status: 'behind', value: '1 open', detail: 'The unspent-funds claim has no response yet.' },
      { id: '(d)', label: 'Favorable share holding', status: 'unmeasured', value: '—', detail: 'Too few coded comments to read favorability today.' },
    ],
    goalsAsOf: 'Thu 31',
    whyReading: 'Escalating — 2 of the escalation checks are met.',
    escalation: [
      { label: 'Attention above 2× a normal day', ok: true, detail: '2.3× today vs a normal 8 items.' },
      { label: 'A new unfavorable outlet', ok: true, detail: 'Rappler and GMA News Online turned today.' },
      { label: 'A new contested claim', ok: true, detail: 'The unspent-funds claim is new and unanswered.' },
    ],
    containing: [
      { label: 'Attention at or below 2×', ok: false, detail: 'Above the line at 2.3×.' },
      { label: 'No new unfavorable outlet', ok: false, detail: 'Two turned today.' },
      { label: 'Favorable share not falling', ok: false, unmeasured: true, detail: 'Not measured — too few comments.' },
    ],
    outlets: [
      { name: 'Rappler', medium: 'Online', items: 6, unfavorable: 4 },
      { name: 'GMA News Online', medium: 'Online', items: 5, unfavorable: 3 },
      { name: 'Manila Bulletin', medium: 'Broadsheet', items: 4, unfavorable: 1 },
    ],
    accounts: [
      { name: 'Ramon dela Cruz', platform: 'Facebook', posts: 4, engagement: '12.4K' },
      { name: 'Ina Villanueva', platform: 'X', posts: 3, engagement: '8.1K' },
    ],
    log: [
      { key: 'l1', kind: 'Alert', tone: 'alert', when: 'Day 0 · Wed 6:00 pm', detail: 'Early-warning push on a flood-control spending thread.' },
      { key: 'l2', kind: 'Escalate', tone: 'bad', when: 'Day 1 · Thu 9:40 am', detail: 'Crossed 2× a normal day; the tracker opened.' },
      { key: 'l3', kind: 'Statement', tone: 'us', when: 'Day 1 · Thu 11:20 am', detail: 'DPWH posted a holding statement.' },
    ],
  },
  {
    id: 'telco-dropped-call',
    storyId: 'telco-dropped-call',
    storyTitle: 'Senate probes dropped-call complaints against carriers',
    verdict: 'stable',
    day: 2,
    dateLabel: 'Thu 31',
    timesNormal: 0.9,
    decisionToday:
      'Hold the line — keep the carrier replies factual and let the committee set the pace.',
    move: 'Attention eased below a normal day and no new outlet turned, so it reads stable.',
    peakX: 1.8,
    peakDay: 1,
    trend: 'easing',
    normalItems: 12,
    attention: [1.0, 1.8, 0.9],
    changed: {
      items: 11,
      records: 9,
      comments: 70,
      newOutlets: [],
      tierScore: 0,
    },
    nextStep: 'Keep watching the hearing schedule; prep a one-page service-quality fact sheet in case it reopens.',
    goals: [
      { id: '(a)', label: 'First statement out', status: 'met', value: 'Day 0, 5:10 pm', detail: 'Carriers issued a joint statement the evening of Day 0.' },
      { id: '(b)', label: 'Keep attention under 2×', status: 'met', value: '0.90×', detail: 'Eased to 0.90× a normal day, below the 2× line.' },
      { id: '(c)', label: 'No contested claim unanswered', status: 'ontrack', value: '0 open', detail: 'No new contested claim today.' },
      { id: '(d)', label: 'Favorable share holding', status: 'behind', value: '16%', detail: 'Favorability is low but no longer falling.' },
    ],
    goalsAsOf: 'Thu 31',
    whyReading: 'Stable — every measured containing check passes.',
    escalation: [
      { label: 'Attention above 2× a normal day', ok: false, detail: '0.90× today.' },
      { label: 'A new unfavorable outlet', ok: false, detail: 'None turned today.' },
      { label: 'A new contested claim', ok: false, detail: 'No new claim.' },
    ],
    containing: [
      { label: 'Attention at or below 2×', ok: true, detail: '0.90× today.' },
      { label: 'No new unfavorable outlet', ok: true, detail: 'None turned today.' },
      { label: 'Favorable share not falling', ok: true, detail: 'Holding at 16%.' },
    ],
    outlets: [
      { name: 'Manila Bulletin', medium: 'Broadsheet', items: 7, unfavorable: 5 },
      { name: 'Philippine Daily Inquirer', medium: 'Broadsheet', items: 4, unfavorable: 3 },
      { name: 'BusinessWorld', medium: 'Broadsheet', items: 1, unfavorable: 1 },
    ],
    accounts: [
      { name: 'Rowena Cruz', platform: 'X', posts: 5, engagement: '3.5K' },
      { name: 'Andrea Lim', platform: 'Facebook', posts: 3, engagement: '2.4K' },
    ],
    log: [
      { key: 'l1', kind: 'Alert', tone: 'alert', when: 'Day 0 · Tue 10:00 am', detail: 'Early-warning push on a dropped-call complaint thread.' },
      { key: 'l2', kind: 'Escalate', tone: 'bad', when: 'Day 0 · Tue 2:00 pm', detail: 'Crossed 2× a normal day; the tracker opened.' },
      { key: 'l3', kind: 'Statement', tone: 'us', when: 'Day 0 · Tue 5:10 pm', detail: 'Carriers issued a joint statement.' },
      { key: 'l4', kind: 'Easing', tone: 'plain', when: 'Day 2 · Thu', detail: 'Attention eased to 0.90× a normal day.' },
    ],
  },
];

// Alerts (hour-by-hour) mode — the early-warning signals that fed this brief, in time order.
// The two ESCALATE alerts are the moments the crisis trackers opened; the 2 AM incident is
// the week's busiest hour (matches the canvas "busiest hour Thu 31, 2 AM, 57 items").
const ALERTS: IDecisionAlert[] = [
  { id: 'a1', kind: 'push', time: 'Tue 29 · 10:00 am', storyId: 'telco-dropped-call', storyTitle: 'Senate probes dropped-call complaints against carriers', text: 'Early-warning push on a dropped-call complaint thread.', metric: 'first signal' },
  { id: 'a2', kind: 'escalate', time: 'Tue 29 · 2:00 pm', storyId: 'telco-dropped-call', storyTitle: 'Senate probes dropped-call complaints against carriers', text: 'Crossed 2× a normal day — the crisis tracker opened.', metric: '2.1× a normal day' },
  { id: 'a3', kind: 'push', time: 'Wed 30 · 6:00 pm', storyId: 'gov-flood', storyTitle: 'DPWH fast-tracks flood-control projects in NCR', text: 'Early-warning push on a flood-control spending thread.', metric: 'first signal' },
  { id: 'a4', kind: 'radar', time: 'Thu 31 · 1:00 am', storyId: 'telco-ntc-rural', storyTitle: 'NTC orders telcos to improve rural signal', text: 'On the radar — provincial pick-up building overnight.', metric: '18 items in the hour' },
  { id: 'a5', kind: 'incident', time: 'Thu 31 · 2:00 am', storyId: 'telco-dropped-call', storyTitle: 'Senate probes dropped-call complaints against carriers', text: 'Busiest hour of the week — an overnight thread spike.', metric: '57 items in the hour' },
  { id: 'a6', kind: 'escalate', time: 'Thu 31 · 9:40 am', storyId: 'gov-flood', storyTitle: 'DPWH fast-tracks flood-control projects in NCR', text: 'Crossed 2× a normal day — the crisis tracker opened.', metric: '2.3× a normal day' },
];
const ALERTS_SUMMARY = '6 alerts this period · the busiest hour was Thu 31, 2 AM, with 57 items.';

// The header framing changes with the cadence (web: ReportCadenceControl derives the range).
// Stories/counts stay the same in the mock; only the date + period label re-frame.
const CADENCE_LABELS: Record<ReportCadence, { date: string; periodLabel: string }> = {
  daily: { date: 'Thursday 31 December', periodLabel: 'December 31, 2026' },
  weekly: { date: 'Thursday 31 December', periodLabel: 'December 26 to 31, 2026' },
  monthly: { date: 'December 2026', periodLabel: 'December 1 to 31, 2026' },
};

// Press-coverage charts for "The rest of the week" (web: PressTiles). By-medium sums to the
// 111 articles; keyword hits aggregate every story's hits so the top terms rank across the week.
const PRESS: IDecisionPress = {
  byMedium: [
    { label: 'Online', value: 52 },
    { label: 'Broadcast', value: 34 },
    { label: 'Social', value: 18 },
    { label: 'Print', value: 7 },
  ],
  topOutlets: [
    { label: 'Manila Bulletin', value: 19 },
    { label: 'Philippine Daily Inquirer', value: 16 },
    { label: 'Rappler', value: 14 },
    { label: 'BusinessWorld', value: 11 },
    { label: 'GMA News Online', value: 9 },
    { label: 'The Philippine Star', value: 8 },
  ],
  keywordHits: (() => {
    const totals = new Map<string, number>();
    for (const s of STORY_SEEDS) for (const k of s.keywordHits) totals.set(k.term, (totals.get(k.term) ?? 0) + k.count);
    return [...totals.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })(),
};

const nlName = (id: string): string =>
  NEWSLETTERS.find((n) => n.id === id)?.name ?? 'Newsletter';

export const getDecisionEdition = (
  newsletterId: string,
  cadence: ReportCadence = 'weekly',
): IDecisionEdition => ({
  newsletterId,
  newsletterName: nlName(newsletterId),
  cadence,
  date: CADENCE_LABELS[cadence].date,
  periodLabel: CADENCE_LABELS[cadence].periodLabel,
  preparedTime: '07:00',
  writtenAt: 'written Dec 31, 2026, 6:40 AM',
  persona: 'for Marco, Comms Lead',
  crisisOpen: TRACKERS.length,
  trackers: TRACKERS,
  leadLine: 'One issue needs a response this week: Senate probes dropped-call complaints.',
  summary:
    'Senate probes dropped-call complaints is the one issue that needs a response this ' +
    'week — it sets the regulatory tone for the quarter and frames every follow-on ' +
    'service story. Two stories are worth watching, the DPWH flood-control push and the ' +
    'NTC rural-signal order, where the comments are split. The remaining three are calm ' +
    'enough to skip or amplify. Comments are heaviest on the dropped-call story, where ' +
    '49% lean negative.',
  counts: COUNTS,
  verdictCounts: { act: 1, watch: 2, skip: 3 },
  stories: STORY_SEEDS.map((s, i) => toStory(s, i + 1)),
  context: CONTEXT,
  alerts: ALERTS,
  alertsSummary: ALERTS_SUMMARY,
  timeline: weekHourly(rngFor('report:timeline'), 420),
  press: PRESS,
});

// ─── Story Canvas detail (Phase 2) ───────────────────────────────────────────
// The deep per-story canvas. Story 1 (telco-dropped-call) is reproduced exactly from
// the web screenshots; the others are generated deterministically from their seed so
// the whole brief is explorable. Reproduces the staging render (which is richer than
// the web's bundled mock — brief windows, early-warning status, voices all present).
const compactK = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};
const shareOf = (count: number, total: number) => ({
  count,
  pct: total > 0 ? Math.round((count / total) * 100) : 0,
});
const toneOf = (pos: number, neu: number, neg: number): IPeriodTone => {
  const total = pos + neu + neg;
  return {
    total,
    positive: shareOf(pos, total),
    neutral: shareOf(neu, total),
    negative: shareOf(neg, total),
  };
};

// The brief week (Thu 24 → Thu 31 Dec), matching the edition date.
const WEEK: [string, string][] = [
  ['2026-12-24', 'Thu 24'],
  ['2026-12-25', 'Fri 25'],
  ['2026-12-26', 'Sat 26'],
  ['2026-12-27', 'Sun 27'],
  ['2026-12-28', 'Mon 28'],
  ['2026-12-29', 'Tue 29'],
  ['2026-12-30', 'Wed 30'],
  ['2026-12-31', 'Thu 31'],
];
// Overnight-weighted shape (peaks ~2am) for the busy final day — matches "busiest hour 2 AM".
const NIGHT_WEIGHTS = [10, 12, 14, 11, 7, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 6, 8];
const weighted = (rand: Rand, total: number): number[] => {
  const jit = NIGHT_WEIGHTS.map((w) => w * (0.7 + rand() * 0.6));
  const sum = jit.reduce((a, b) => a + b, 0) || 1;
  return jit.map((w) => Math.round((w / sum) * total));
};
// The week's hourly channel counts: quiet until the last day, which carries the story.
const weekHourly = (rand: Rand, peak: number): IStoryHourlyDay[] =>
  WEEK.map(([date, label], i) => {
    const last = i === WEEK.length - 1;
    const scale = last ? 1 : 0.04 + rand() * 0.05;
    return {
      date,
      label,
      broadcast: (last ? weighted(rand, Math.round(peak * 0.18)) : hourlyShape(rand, Math.round(peak * 0.18 * scale))),
      online: (last ? weighted(rand, Math.round(peak * 0.34)) : hourlyShape(rand, Math.round(peak * 0.34 * scale))),
      social: (last ? weighted(rand, Math.round(peak * 0.48)) : hourlyShape(rand, Math.round(peak * 0.48 * scale))),
      print: intBetween(rand, 0, last ? 5 : 2),
    };
  });

const postsOf = (s: Seed): number =>
  s.id === 'telco-dropped-call' ? 1040 : intBetween(rngFor(`posts:${s.id}`), 200, 1600);

// A dot-strip metric built across all six stories (positions 0..1; signed metrics put 0
// at the centre). rankDir 'desc' = biggest is #1; 'asc-abs' = most-negative is #1 (net).
const metricStrip = (
  key: string,
  label: string,
  sub: string,
  valueText: string,
  selfId: string,
  rawById: Record<string, number>,
  opts: { signed?: boolean; rankDir: 'desc' | 'asc'; tone?: ICanvasMetric['tone'] },
): ICanvasMetric => {
  const ids = STORY_SEEDS.map((s) => s.id);
  const raws = ids.map((id) => rawById[id]);
  const maxAbs = Math.max(1e-9, ...raws.map((v) => Math.abs(v)));
  const pos = (v: number) => (opts.signed ? (v / maxAbs + 1) / 2 : v / maxAbs);
  const self = rawById[selfId];
  const better = raws.filter((v) =>
    opts.rankDir === 'asc' ? v < self : v > self,
  ).length;
  return {
    key,
    label,
    sub,
    value: valueText,
    rank: better + 1,
    total: ids.length,
    dots: raws.map(pos),
    self: pos(self),
    signed: opts.signed,
    tone: opts.tone,
  };
};

const metricsFor = (story: IDecisionStory): ICanvasMetric[] => {
  const svById = Object.fromEntries(STORY_SEEDS.map((s) => [s.id, svPointsOf(s)]));
  const engById = Object.fromEntries(STORY_SEEDS.map((s) => [s.id, s.weightedEngagement]));
  const netById = Object.fromEntries(STORY_SEEDS.map((s) => [s.id, s.net]));
  const nemoById = Object.fromEntries(STORY_SEEDS.map((s) => [s.id, negEmoOf(s)]));
  return [
    metricStrip('sv', 'Story value points', "sum of its items' story value", svById[story.id].toFixed(1), story.id, svById, { rankDir: 'desc' }),
    metricStrip('eng', 'Engagement', `${postsOf(story).toLocaleString()} posts`, compactK(story.weightedEngagement), story.id, engById, { rankDir: 'desc' }),
    metricStrip('net', 'Net favorability', `positive minus negative, ${story.comments.toLocaleString()} comments`, `${story.net > 0 ? '+' : ''}${story.net}`, story.id, netById, { signed: true, rankDir: 'asc', tone: story.net < 0 ? 'negative' : story.net > 0 ? 'positive' : 'neutral' }),
    metricStrip('nemo', 'Negative emotion', 'anger, disgust, fear', `${nemoById[story.id]}%`, story.id, nemoById, { rankDir: 'desc' }),
  ];
};

const windowSeverity = (count: number): IBriefWindow['severity'] =>
  count >= 90 ? 'critical' : count >= 40 ? 'high' : count >= 15 ? 'elevated' : 'quiet';

// Story 1 — the exact canvas from the screenshots.
const STORY1: Omit<IDecisionStoryDetail, 'metrics' | 'hourly'> = {
  id: 'telco-dropped-call',
  startedText: 'It started Thu 9:00 am with Alert · first_broadsheet.',
  busiestHourText: 'The busiest hour was Thu 31, 2 AM, with 57 items.',
  briefWindows: [
    { label: 'Overnight', count: 132, severity: 'critical' },
    { label: 'Morning', count: 25, severity: 'elevated' },
    { label: 'Midday', count: 0, severity: 'quiet' },
    { label: 'Evening', count: 0, severity: 'quiet' },
  ],
  unfoldNote: 'articles and posts per hour, Thu 24 to Thu 31 · the numbers mark the moments listed below',
  unfoldNarrative:
    'A Senate inquiry into dropped calls and slow data put the carriers on the defensive, and the coverage is building across broadcast and online.',
  moments: [{ n: 1, when: 'Thu 9:00 am', kind: 'Alert', label: 'first_broadsheet' }],
  involvedNote:
    "outlets by story value · accounts by Scoup's key-voice score (interactions 0.71, comments 0.29)",
  outlets: [
    { name: 'Manila Bulletin', medium: 'Broadsheet', items: 7, storyValue: 84 },
    { name: 'BusinessWorld', medium: 'Broadsheet', items: 1, storyValue: 58 },
    { name: 'Philippine Daily Inquirer', medium: 'Broadsheet', items: 4, storyValue: 28 },
  ],
  voices: [
    { name: 'Rowena Cruz', platform: 'X', keyVoice: true, voiceScore: 96, likes: 2502, comments: 757, shares: 227, engagementPct: 44, views: 117_600, negativePct: 100, topRead: 2, status: 'peaked' },
    { name: 'Andrea Lim', platform: 'Facebook', keyVoice: false, voiceScore: 66, likes: 1688, comments: 454, shares: 238, engagementPct: 29, views: 131_700, negativePct: 100, topRead: 2, status: 'peaked' },
    { name: 'Noel Bautista', platform: 'Instagram', keyVoice: false, voiceScore: 61, likes: 873, comments: 1189, shares: 248, engagementPct: 28, views: 89_000, negativePct: 100, topRead: 2, status: 'peaked' },
  ],
  reactionsSummary: '338.3K post views · 713 shares · 0 posts still rising, 3 peaked',
  feelNote: '100 top comments read by Scoup · objective view',
  feelAnalysis: 'Rising fast and the tone is turning against the carriers.',
  tone: toneOf(16, 30, 54),
  personaTone: toneOf(12, 28, 60),
  emotions: [
    { label: 'Curiosity', pct: 37 },
    { label: 'Hope', pct: 34 },
    { label: 'Frustration', pct: 24 },
    { label: 'Concern', pct: 6 },
  ],
  trustText: 'No role named often enough to read.',
  concentrationText: '40% under one post',
  concentrationDetail: '10 adverse comments; 4 sit under one post, 40% on X',
  sampleComments: [
    { text: 'Grabe ang dropped calls — kailangan talaga imbestigahan ang mga telco.', sentiment: 'negative' },
    { text: 'Finally the Senate is looking into this. Been complaining for months.', sentiment: 'neutral' },
    { text: 'Sana may konkretong aksyon, hindi lang pa-pogi points.', sentiment: 'negative' },
  ],
  suggestedAction: 'Scoup suggested no action for this story.',
  nextText: 'Expect broadsheet follow-ups and a second wave of explainer threads this week.',
  whyRanks: [
    { label: 'Story size', value: 55, tone: 'ink' },
    { label: 'Risk', value: 88, tone: 'risk' },
    { label: 'Momentum', value: 55, tone: 'momentum' },
  ],
  whyRanksNote: "Momentum and direction are each story's latest daily entry, not the whole week.",
  alertStatus: 'QUIET',
  alertText: 'No alert this period. The busiest hour, Thu 31, 2 AM, had 57 items.',
  searchVisits: 67_800,
  postViews: 338_300,
  topCoverage: [
    { rank: 1, title: 'Senate probes dropped-call complaints against carriers', outlet: 'Philippine Daily Inquirer', medium: 'Broadsheet', date: 'Nov 1, 4:00 PM', storyValue: 88 },
    { rank: 2, title: 'Senate probes dropped-call complaints against carriers', outlet: 'Manila Bulletin', medium: 'Broadsheet', date: 'Nov 3, 4:00 PM', storyValue: 78 },
    { rank: 3, title: 'Senate probes dropped-call complaints against carriers', outlet: 'BusinessWorld', medium: 'Broadsheet', date: 'Nov 4, 4:00 PM', storyValue: 76 },
    { rank: 4, title: 'Senate probes dropped-call complaints against carriers', outlet: 'The Philippine Star', medium: 'Broadsheet', date: 'Nov 2, 4:00 PM', storyValue: 65 },
  ],
};

const OUTLET_POOL = ['Philippine Daily Inquirer', 'Manila Bulletin', 'BusinessWorld', 'The Philippine Star', 'Rappler', 'GMA News Online'];
const VOICE_POOL = ['Rowena Cruz', 'Andrea Lim', 'Noel Bautista', 'Marco Reyes', 'Lara Santos', 'Ben Aquino'];
const PLATFORMS = ['X', 'Facebook', 'Instagram'];

// A generated canvas for stories 2–6 (plausible, deterministic, consistent with the seed).
const buildGenerated = (story: IDecisionStory): IDecisionStoryDetail => {
  const rand = rngFor(`canvas:${story.id}`);
  const lead = story.keywordHits[0]?.term ?? 'the issue';
  const peak = Math.max(40, Math.round(story.weightedEngagement / 120));
  const win = [intBetween(rand, 0, 140), intBetween(rand, 0, 60), intBetween(rand, 0, 30), intBetween(rand, 0, 20)];
  const outlets: ICanvasOutlet[] = OUTLET_POOL.slice(0, 3).map((name, i) => ({
    name,
    medium: 'Broadsheet',
    items: intBetween(rand, 1, 8),
    storyValue: Math.round((20 + rand() * 70) * 100) / 100,
  }));
  const voices: ICanvasVoice[] = VOICE_POOL.slice(0, 3).map((name, i) => ({
    name,
    platform: PLATFORMS[i % PLATFORMS.length],
    keyVoice: i === 0,
    voiceScore: intBetween(rand, 55, 96),
    likes: intBetween(rand, 400, 5000),
    comments: intBetween(rand, 80, 1400),
    shares: intBetween(rand, 40, 600),
    engagementPct: intBetween(rand, 18, 48),
    views: intBetween(rand, 40_000, 180_000),
    negativePct: story.net < 0 ? 100 : intBetween(rand, 20, 70),
    topRead: 2,
    status: 'peaked',
  }));
  const neg = Math.max(10, Math.min(80, 50 + Math.round(-story.net / 2)));
  const pos = Math.max(5, Math.round((100 - neg) * 0.4));
  const neu = Math.max(0, 100 - neg - pos);
  const coverage: ICanvasCoverage[] = outlets.map((o, i) => ({
    rank: i + 1,
    title: story.title,
    outlet: OUTLET_POOL[i],
    medium: 'Broadsheet',
    date: `Nov ${i + 1}, 4:00 PM`,
    storyValue: o.storyValue,
  }));
  return {
    id: story.id,
    startedText: `It started Thu 8:00 am with Alert · first_broadsheet.`,
    busiestHourText: `The busiest hour was Thu 31, ${intBetween(rand, 1, 11)} AM, with ${intBetween(rand, 12, 60)} items.`,
    briefWindows: ['Overnight', 'Morning', 'Midday', 'Evening'].map((label, i) => ({
      label,
      count: win[i],
      severity: windowSeverity(win[i]),
    })),
    hourly: weekHourly(rand, peak),
    unfoldNote: 'articles and posts per hour, Thu 24 to Thu 31 · the numbers mark the moments listed below',
    unfoldNarrative: `Coverage of ${lead} built steadily through the week across online and broadcast.`,
    moments: [{ n: 1, when: 'Thu 8:00 am', kind: 'Alert', label: 'first_broadsheet' }],
    metrics: metricsFor(story),
    involvedNote: "outlets by story value · accounts by Scoup's key-voice score (interactions 0.71, comments 0.29)",
    outlets: outlets.sort((a, b) => b.storyValue - a.storyValue),
    voices,
    reactionsSummary: `${compactK(intBetween(rand, 80_000, 420_000))} post views · ${intBetween(rand, 120, 900)} shares · 0 posts still rising, 3 peaked`,
    feelNote: '100 top comments read by Scoup · objective view',
    feelAnalysis: story.actionLine,
    tone: toneOf(pos, neu, neg),
    personaTone: toneOf(Math.max(0, pos - 3), neu, Math.min(100, neg + 3)),
    emotions: [
      { label: 'Curiosity', pct: intBetween(rand, 20, 40) },
      { label: 'Hope', pct: intBetween(rand, 15, 35) },
      { label: 'Frustration', pct: intBetween(rand, 10, 30) },
      { label: 'Concern', pct: intBetween(rand, 4, 15) },
    ],
    trustText: 'No role named often enough to read.',
    concentrationText: `${intBetween(rand, 20, 55)}% under one post`,
    concentrationDetail: `${intBetween(rand, 4, 14)} adverse comments concentrate under a single post.`,
    sampleComments:
      story.net < 0
        ? [
            { text: 'People are frustrated and want to see something actually change.', sentiment: 'negative' },
            { text: 'Sana may follow-through, hindi lang pansamantala.', sentiment: 'neutral' },
          ]
        : [
            { text: 'Good to see movement on this — about time.', sentiment: 'positive' },
            { text: 'Hope this keeps up and reaches the provinces too.', sentiment: 'neutral' },
          ],
    suggestedAction: 'Scoup suggested no action for this story.',
    nextText: 'Expect follow-up coverage to continue through the week.',
    whyRanks: [
      { label: 'Story size', value: intBetween(rand, 40, 96), tone: 'ink' },
      { label: 'Risk', value: intBetween(rand, 30, 92), tone: 'risk' },
      { label: 'Momentum', value: story.momentum, tone: 'momentum' },
    ],
    whyRanksNote: "Momentum and direction are each story's latest daily entry, not the whole week.",
    alertStatus: 'QUIET',
    alertText: `No alert this period. The busiest hour had ${intBetween(rand, 12, 60)} items.`,
    searchVisits: intBetween(rand, 2_000, 180_000),
    postViews: intBetween(rand, 80_000, 420_000),
    topCoverage: coverage,
  };
};

export const getDecisionStoryDetail = (
  _newsletterId: string,
  storyId: string,
): IDecisionStoryDetail => {
  const story = STORY_SEEDS.find((s) => s.id === storyId) ?? STORY_SEEDS[0];
  const full: IDecisionStory = toStory(story, STORY_SEEDS.indexOf(story) + 1);
  if (story.id === 'telco-dropped-call') {
    return {
      ...STORY1,
      metrics: metricsFor(full),
      hourly: weekHourly(rngFor('canvas:telco-dropped-call'), 320),
    };
  }
  return buildGenerated(full);
};
