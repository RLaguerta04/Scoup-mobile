// Builds the mobile view-models from the shared entities. Deterministic (seeded),
// so every reload is identical. All generators are pure.
import type {
  EntityType,
  IArticleItem,
  IBucket,
  IDashAnalysisSection,
  IDashboardCharts,
  IDashDrill,
  IDashKeyFigures,
  IDashRecord,
  IGeoMap,
  ILocalMap,
  IMapPage,
  IMapPlaceDetail,
  IMapPlaceProfile,
  IMapPost,
  IMapRankedPlace,
  IMapSentiment,
  IMediumAve,
  INewsletter,
  INewsletterTreeItem,
  IPlaceDetail,
  IPostItem,
  IStoryCard,
  IStoryMap,
  IThisPeriod,
  Lens,
  RankBy,
  ToneKey,
} from '@/types';
import { TODAY, type DateRange } from '@/lib/dateRange';
import {
  AUTHORS,
  EMOTIONS,
  HEADLINES,
  MEDIUMS,
  NCR_REGION_CODE,
  NEWSLETTERS,
  OUTLETS,
  PLATFORMS,
  STORY_PLACES,
  SUBJECTS,
} from './entities';
import { eachDay, hourlyShape, intBetween, pick, rngFor, shuffle } from './util';

const nl = (id: string): INewsletter =>
  NEWSLETTERS.find((n) => n.id === id) ?? NEWSLETTERS[0];

export const getNewsletters = (): INewsletter[] => [...NEWSLETTERS];

// Stories generated per newsletter. The tree counts and the (bucket-)scoped feed
// agree because both tally the same deterministic per-story bucket assignment.
const STORIES_PER_NL = 12;

// Deterministic bucket for story i — stable across range/lens/rank/filters so a
// story keeps its bucket and the tree counts match the scoped feed.
const storyBucket = (newsletterId: string, i: number, buckets: IBucket[]): IBucket =>
  pick(rngFor(`bucket:${newsletterId}:${i}`), buckets);

// Newsletters with per-newsletter and per-bucket story counts (the switcher tree).
export const getNewsletterTree = (): INewsletterTreeItem[] =>
  NEWSLETTERS.map((n) => {
    const counts = new Map<number, number>();
    for (let i = 0; i < STORIES_PER_NL; i++) {
      const b = storyBucket(n.id, i, n.buckets);
      counts.set(b.id, (counts.get(b.id) ?? 0) + 1);
    }
    return {
      id: n.id,
      name: n.name,
      storyCount: STORIES_PER_NL,
      buckets: n.buckets.map((b) => ({ id: b.id, name: b.name, storyCount: counts.get(b.id) ?? 0 })),
    };
  });

// ─── This period ─────────────────────────────────────────────────────────────
const AVE_PER_CLIP: Record<string, number> = {
  ONLINE_NEWS: 85_000, BROADSHEET: 240_000, TABLOID: 70_000, TV: 520_000, RADIO: 150_000,
};
const MEDIUM_SHARE: Record<string, number> = {
  ONLINE_NEWS: 0.52, BROADSHEET: 0.16, TABLOID: 0.12, TV: 0.11, RADIO: 0.09,
};

// ─── Story → place tags (Dashboard location filter) ──────────────────────────
// Each story is deterministically tagged to 1–2 places (STORY_PLACES). The map counts, the
// story list and the charts all derive from the same tags, so a tapped place scopes them
// together — the mobile take on the web's place-driven Dashboard.
const NCR_PLACES = STORY_PLACES.filter((p) => p.region === NCR_REGION_CODE);
const MAJOR_PLACES = STORY_PLACES.filter((p) => p.region !== NCR_REGION_CODE);
const isNcrCode = (code: string): boolean =>
  STORY_PLACES.find((p) => p.code === code)?.region === NCR_REGION_CODE;

const storyPlaceCodes = (newsletterId: string, i: number): string[] => {
  const rand = rngFor(`place:${newsletterId}:${i}`);
  if (rand() < 0.08) return []; // a few stories aren't placed in a city
  const primary = rand() < 0.7 ? pick(rand, NCR_PLACES) : pick(rand, MAJOR_PLACES);
  const codes = [primary.code];
  if (rand() < 0.4) {
    const extra = pick(rand, NCR_PLACES);
    if (!codes.includes(extra.code)) codes.push(extra.code);
  }
  return codes;
};

// A story is "in" a place when it carries that code — or any NCR code when the merged
// Metro Manila bubble (region code) is picked.
const storyInPlace = (newsletterId: string, i: number, placeCode: string): boolean => {
  const codes = storyPlaceCodes(newsletterId, i);
  return placeCode === NCR_REGION_CODE ? codes.some(isNcrCode) : codes.includes(placeCode);
};

const placeShare = (newsletterId: string, placeCode: string): number => {
  let n = 0;
  for (let i = 0; i < STORIES_PER_NL; i++) if (storyInPlace(newsletterId, i, placeCode)) n++;
  return Math.max(0.2, n / STORIES_PER_NL);
};

// Scale a period panel to a place's share of the stories, keeping totals/percentages consistent.
const scalePeriod = (p: IThisPeriod, s: number): IThisPeriod => {
  const r = (n: number) => Math.max(0, Math.round(n * s));
  const heat = p.heat.map((d) => {
    const hours = d.hours.map(r);
    const print = r(d.print);
    return { ...d, hours, print, total: hours.reduce((a, b) => a + b, 0) + print };
  });
  const results = heat.reduce((sum, d) => sum + d.total, 0);
  const analysed = Math.round(results * 0.46);
  const pos = Math.round(analysed * 0.44);
  const neg = Math.round(analysed * 0.17);
  const neu = analysed - pos - neg;
  const pct = (n: number) => (analysed === 0 ? 0 : Number(((n / analysed) * 100).toFixed(1)));
  return {
    ...p,
    results,
    ave: r(p.ave),
    pressBroadcast: Math.round(results * 0.98),
    tone: {
      total: analysed,
      positive: { count: pos, pct: pct(pos) },
      neutral: { count: neu, pct: pct(neu) },
      negative: { count: neg, pct: pct(neg) },
    },
    heat,
    byMedium: p.byMedium.map((m) => ({ ...m, ave: r(m.ave) })),
    social: {
      posts: r(p.social.posts),
      comments: r(p.social.comments),
      byPlatform: p.social.byPlatform.map((b) => ({ ...b, count: Math.max(1, r(b.count)) })),
    },
  };
};

export const getThisPeriod = (
  newsletterId: string,
  range: DateRange,
  placeCode: string | null = null,
): IThisPeriod => {
  const { from, to } = range;
  const rand = rngFor(`period:${newsletterId}:${from}:${to}:${placeCode ?? 'all'}`);
  const days = eachDay(from, to);

  const heat = days.map(({ date, label }) => {
    const print = intBetween(rand, 2, 14);
    const hours = hourlyShape(rand, intBetween(rand, 38, 120));
    const total = hours.reduce((a, b) => a + b, 0) + print;
    return { date, label, hours, print, total };
  });
  const results = heat.reduce((sum, d) => sum + d.total, 0);

  const byMedium: IMediumAve[] = MEDIUMS.map(({ medium, label }) => {
    const clips = Math.max(1, Math.round(results * (MEDIUM_SHARE[medium] ?? 0.1)));
    return { medium: label, ave: clips * (AVE_PER_CLIP[medium] ?? 100_000) };
  });
  const ave = byMedium.reduce((sum, m) => sum + m.ave, 0);

  const analysed = Math.round(results * 0.46);
  const pos = Math.round(analysed * 0.44);
  const neg = Math.round(analysed * 0.17);
  const neu = analysed - pos - neg;
  const pct = (n: number) => (analysed === 0 ? 0 : Number(((n / analysed) * 100).toFixed(1)));

  const posts = intBetween(rand, 680, 1_640);
  const byPlatform = PLATFORMS.map(({ label }, i) => ({
    platform: label,
    count: Math.max(8, Math.round(posts * [0.56, 0.18, 0.12, 0.08, 0.06][i])),
  }));

  const outlet = pick(rand, OUTLETS);
  const period: IThisPeriod = {
    from, to, results,
    resultsDelta: Number((rand() * 34 - 8).toFixed(1)),
    ave,
    pressBroadcast: Math.round(results * 0.98),
    topOutlet: { name: outlet.name, value: intBetween(rand, 18, 64), delta: Number((rand() * 40 - 12).toFixed(1)) },
    topAuthor: { name: pick(rand, AUTHORS), value: intBetween(rand, 9, 28), delta: Number((rand() * 30 - 10).toFixed(1)) },
    tone: {
      total: analysed,
      positive: { count: pos, pct: pct(pos) },
      neutral: { count: neu, pct: pct(neu) },
      negative: { count: neg, pct: pct(neg) },
    },
    heat,
    byMedium,
    social: { posts, comments: posts * intBetween(rand, 5, 12), byPlatform },
  };
  return placeCode ? scalePeriod(period, placeShare(newsletterId, placeCode)) : period;
};

// ─── Stories ─────────────────────────────────────────────────────────────────
// `lens` is the L3 source filter (All / MediaWatch / SharedView) and `sig` is the
// advanced-filter signature — both feed the seed so each selection yields its own
// view. `rankBy` is the explicit Sort control and decides the ordering.
export const getStories = (
  newsletterId: string,
  range: DateRange,
  lens: Lens = 'all',
  rankBy: RankBy = 'engagement',
  sig = '',
  bucketId: number | null = null,
  placeCode: string | null = null,
): IStoryCard[] => {
  const n = nl(newsletterId);
  const { from, to } = range;
  const rand = rngFor(`stories:${newsletterId}:${from}:${to}:${lens}:${sig}`);
  const pool = HEADLINES[n.theme];
  const subj = SUBJECTS[n.theme];
  const cards = Array.from({ length: STORIES_PER_NL }, (_, i) => {
    const bucket = storyBucket(newsletterId, i, n.buckets);
    const posts = intBetween(rand, 40, 620);
    const emotion = pick(rand, EMOTIONS);
    const articles = intBetween(rand, 0, 14);
    // Legacy AVE lines are press-derived — stories with no articles have none ("Not known").
    const adValue = articles > 0 ? articles * intBetween(rand, 180_000, 420_000) : 0;
    return {
      id: `story-${newsletterId}-${i}`,
      bucketId: bucket.id,
      bucketName: bucket.name,
      title: pool[i % pool.length],
      summary: `Online outlets lead the early pickup, with broadcast coverage building through the week and social chatter picking up each evening. The conversation skews ${emotion.toLowerCase()}, with ${subj[0]} named most often.`,
      thumbnailUrl: `https://picsum.photos/seed/scoup-${newsletterId}-${i}/240/240`,
      articles,
      posts,
      comments: posts * intBetween(rand, 6, 22),
      engScore: intBetween(rand, 1_800, 94_000),
      emotion,
      emotionPct: intBetween(rand, 38, 72),
      trend: pick(rand, ['up', 'down', 'flat'] as const),
      adValue,
      prValue: adValue > 0 ? Math.round(adValue * 2.8) : 0,
    };
  });
  const key =
    rankBy === 'articles'
      ? (s: IStoryCard) => s.articles
      : rankBy === 'posts'
        ? (s: IStoryCard) => s.posts
        : rankBy === 'comments'
          ? (s: IStoryCard) => s.comments
          : (s: IStoryCard) => s.engScore;
  const placeScoped = placeCode
    ? cards.filter((_, i) => storyInPlace(newsletterId, i, placeCode))
    : cards;
  const scoped =
    bucketId == null ? placeScoped : placeScoped.filter((c) => c.bucketId === bucketId);
  return scoped.sort((a, b) => key(b) - key(a));
};

// The rich Story-detail model lives in ./storyDetail (getStoryDetail), which
// builds on getStories so the detail's stats reconcile with the feed card.

// ─── Live posts / articles ────────────────────────────────────────────────────
const HANDLES = ['juan_delacruz', 'mariaclara_ph', 'newswatchph', 'konsumerph', 'tita_of_manila', 'pinoy_ako'];
const POST_TEXTS = [
  'Finally saw improvement in our area this week. Sana tuloy-tuloy. 🙏',
  'Anyone else experiencing this? Been going on for days na.',
  'Grabe the queue this morning. Plan your trip, mga ka-commute.',
  'Props to the team who responded fast. This is the service we deserve.',
  'Hindi ko gets bakit ganito pa rin after all this time. 😤',
  'Sharing this for awareness. Stay safe everyone!',
  'Thank you sa mga nag-volunteer. Bayanihan at its finest. ❤️',
  'Reminder to bring your IDs and complete requirements.',
];

const fmtDate = (base: string, hoursBack: number): string => {
  const d = new Date(`${base}T12:00:00Z`);
  d.setUTCHours(d.getUTCHours() - hoursBack);
  const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${mon} ${d.getUTCDate()} ${hh}:${mm}`;
};

// Sample "Emphasis" labels for the Articles feed (the web's EmphasisTag equivalent).
const EMPHASES = ['Headline', 'Prominent', 'Passing'] as const;

export const getPosts = (
  newsletterId: string,
  lens: Lens = 'all',
  sig = '',
  bucketId: number | null = null,
): IPostItem[] => {
  const n = nl(newsletterId);
  const pool = HEADLINES[n.theme];
  return PLATFORMS.flatMap(({ code }, p) => {
    const rand = rngFor(`posts:${newsletterId}:${code}:${lens}:${sig}:${bucketId ?? 'all'}`);
    return Array.from({ length: 5 }, (_, i) => {
      const likes = intBetween(rand, 40, 9_600);
      const si = (i + p) % STORIES_PER_NL;
      const storyTitle = pool[si % pool.length];
      return {
        id: `post-${code}-${i}`,
        platform: code,
        author: `@${pick(rand, HANDLES)}`,
        text: `${pick(rand, POST_TEXTS)} (${storyTitle})`,
        date: fmtDate(TODAY, i * 3 + p),
        likes,
        comments: intBetween(rand, 3, 1_400),
        shares: intBetween(rand, 0, 900),
        views: likes * intBetween(rand, 6, 22),
        storyId: `story-${newsletterId}-${si}`,
        storyTitle,
        // ~60% of posts carry media; the rest are text-only (rand() last so the metrics above
        // keep their values).
        thumbnailUrl:
          rand() > 0.4 ? `https://picsum.photos/seed/scoup-post-${code}-${i}/160/160` : undefined,
      };
    });
  }).sort((a, b) => b.likes - a.likes);
};

export const getArticles = (
  newsletterId: string,
  lens: Lens = 'all',
  sig = '',
  bucketId: number | null = null,
): IArticleItem[] => {
  const n = nl(newsletterId);
  const pool = HEADLINES[n.theme];
  return MEDIUMS.flatMap(({ medium, label }, m) => {
    const rand = rngFor(`articles:${newsletterId}:${medium}:${lens}:${sig}:${bucketId ?? 'all'}`);
    const outlets = OUTLETS.filter((o) => o.medium === medium);
    return Array.from({ length: 4 }, (_, i) => {
      const outlet = outlets.length ? outlets[i % outlets.length] : pick(rand, OUTLETS);
      const si = (i + m) % STORIES_PER_NL;
      const storyTitle = pool[si % pool.length];
      return {
        id: `art-${medium}-${i}`,
        title: storyTitle,
        publication: outlet.name,
        medium: label,
        date: fmtDate(TODAY, i * 4 + m),
        ave: intBetween(rand, 40_000, 900_000),
        sv: Number((intBetween(rand, 50, 9_900) / 100).toFixed(2)),
        emphasis: pick(rand, EMPHASES),
        storyId: `story-${newsletterId}-${si}`,
        storyTitle,
        thumbnailUrl: `https://picsum.photos/seed/scoup-art-${newsletterId}-${medium}-${i}/160/160`,
        searchVisits: medium === 'ONLINE_NEWS' ? intBetween(rand, 300, 48_000) : null,
        sentiment: pick(rand, ['positive', 'neutral', 'positive', 'neutral', 'negative'] as const),
      };
    });
  });
};

// ─── Local map ─────────────────────────────────────────────────────────────────
type Tier = 0 | 1 | 2 | 3;
interface City { name: string; district: string; tier: Tier }

export const CITIES: readonly City[] = [
  { name: 'Manila', district: 'NCR 1st', tier: 0 },
  { name: 'Quezon City', district: 'NCR 2nd', tier: 0 },
  { name: 'Makati', district: 'NCR 4th', tier: 0 },
  { name: 'Taguig', district: 'NCR 4th', tier: 0 },
  { name: 'Pasig', district: 'NCR 2nd', tier: 1 },
  { name: 'Caloocan', district: 'NCR 3rd', tier: 1 },
  { name: 'Parañaque', district: 'NCR 4th', tier: 1 },
  { name: 'Pasay', district: 'NCR 4th', tier: 1 },
  { name: 'Mandaluyong', district: 'NCR 2nd', tier: 1 },
  { name: 'Marikina', district: 'NCR 2nd', tier: 1 },
  { name: 'Muntinlupa', district: 'NCR 4th', tier: 2 },
  { name: 'Las Piñas', district: 'NCR 4th', tier: 2 },
  { name: 'Valenzuela', district: 'NCR 3rd', tier: 2 },
  { name: 'Malabon', district: 'NCR 3rd', tier: 2 },
  { name: 'Navotas', district: 'NCR 3rd', tier: 2 },
  { name: 'San Juan', district: 'NCR 2nd', tier: 2 },
  { name: 'Pateros', district: 'NCR 4th', tier: 3 },
];

const POST_RANGE: Record<Tier, [number, number]> = {
  0: [55, 80], 1: [28, 54], 2: [8, 27], 3: [3, 9],
};

const cityPosts = (name: string, tier: Tier): number =>
  intBetween(rngFor(`geo:${name}`), POST_RANGE[tier][0], POST_RANGE[tier][1]);

export const getLocalMap = (newsletterId: string): ILocalMap => {
  void newsletterId;
  const areas = CITIES.map((c) => ({ name: c.name, posts: cityPosts(c.name, c.tier) }));
  const placed = areas.reduce((s, a) => s + a.posts, 0);
  const unplaced = intBetween(rngFor('geo:unplaced'), 60, 140);
  return { areas, totalPosts: placed + unplaced, unplaced };
};

// Dashboard "Where the stories happened" — counts per place from the story→place tags above,
// so the map, the story list and the charts all agree.
export const getStoryMap = (newsletterId: string): IStoryMap => {
  const counts: Record<string, number> = {};
  let unplaced = 0;
  for (let i = 0; i < STORIES_PER_NL; i++) {
    const codes = storyPlaceCodes(newsletterId, i);
    if (codes.length === 0) {
      unplaced++;
      continue;
    }
    for (const code of codes) counts[code] = (counts[code] ?? 0) + 1;
  }
  const areas = STORY_PLACES.filter((p) => counts[p.code] > 0).map((p) => ({
    code: p.code,
    name: p.name,
    short: p.short,
    region: p.region,
    stories: counts[p.code],
  }));
  const total = areas.reduce((s, a) => s + a.stories, 0);
  return { counts, areas, total, placeCount: areas.length, unplaced };
};

// ─── Dashboard charts (the web's MediaWatch chart stack) ─────────────────────
// All six charts draw from one deterministic, place-aware build so they agree with each other
// and with the story list; a picked place scales the volumes down to that place's share.
const SECTIONS = ['News', 'Business', 'Nation', 'Metro', 'Technology', 'Opinion'];

export const getDashboardCharts = (
  newsletterId: string,
  range: DateRange,
  placeCode: string | null = null,
): IDashboardCharts => {
  const n = nl(newsletterId);
  const { from, to } = range;
  const rand = rngFor(`dash:${newsletterId}:${from}:${to}:${placeCode ?? 'all'}`);
  const share = placeCode ? placeShare(newsletterId, placeCode) : 1;
  const days = eachDay(from, to);

  // 1) Over time — a peaked weekly curve, scaled by the place's share.
  const counts = days.map(() => Math.round(intBetween(rand, 0, 9) * share));
  const peakIdx = Math.min(days.length - 1, 3 + Math.floor(rand() * 2));
  counts[peakIdx] = Math.round(intBetween(rand, 14, 24) * share);
  const overDays = days.map((d, i) => ({ label: d.label, value: Math.max(0, counts[i]) }));
  const total = overDays.reduce((s, d) => s + d.value, 0);
  const peakDay = overDays.reduce((a, b) => (b.value > a.value ? b : a), overDays[0]);
  const activeDays = overDays.filter((d) => d.value > 0).length;

  // 2) Media exposure — distribute the total across mediums, with per-day splits.
  const weights = MEDIUMS.map(() => 0.4 + rand());
  const wSum = weights.reduce((a, b) => a + b, 0);
  const shares = MEDIUMS.map((m, i) => ({ medium: m.label, count: Math.round((total * weights[i]) / wSum) }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
  const shareTotal = shares.reduce((s, m) => s + m.count, 0) || 1;
  const exposureShares = shares.map((s) => ({ ...s, pct: Number(((s.count / shareTotal) * 100).toFixed(1)) }));
  const exposureByDay = overDays.map((d) => ({
    label: d.label,
    values: exposureShares.map((s) => Math.round(d.value * (s.count / shareTotal))),
  }));

  // 3) Tonality — split the total, and per day.
  const neg = Math.round(total * (0.14 + rand() * 0.22));
  const pos = Math.round(total * (0.3 + rand() * 0.2));
  const neu = Math.max(0, total - neg - pos);
  const toneByDay = overDays.map((d) => {
    const dn = Math.round(d.value * (neg / (total || 1)));
    const dp = Math.round(d.value * (pos / (total || 1)));
    return { label: d.label, neg: dn, pos: dp, neu: Math.max(0, d.value - dn - dp) };
  });
  const peakNegDay = toneByDay.reduce((a, b) => (b.neg > a.neg ? b : a), toneByDay[0]).label;

  // 4) Top publishers — up to 10 outlets, one article per day count.
  const topPublishers = shuffle(rand, OUTLETS)
    .slice(0, 10)
    .map((o) => {
      const perDay = overDays.map((d) => (d.value > 0 && rand() < 0.5 ? intBetween(rand, 0, Math.min(4, d.value)) : 0));
      return { name: o.name, total: perDay.reduce((a, b) => a + b, 0), perDay };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // 5) Entities — orgs (the theme's subjects) + a few places and people.
  const entityPool: { name: string; type: EntityType }[] = [
    ...SUBJECTS[n.theme].map((s) => ({ name: s, type: 'Organisation' as const })),
    ...shuffle(rand, [...CITIES]).slice(0, 3).map((c) => ({ name: c.name, type: 'Place' as const })),
    ...shuffle(rand, [...AUTHORS]).slice(0, 2).map((a) => ({ name: a, type: 'Person' as const })),
  ];
  const entities = shuffle(rand, entityPool)
    .slice(0, 10)
    .map((e) => ({ ...e, count: intBetween(rand, 2, 20) }))
    .sort((a, b) => b.count - a.count);

  // 6) Key figures — leaders pulled from the charts above.
  const topMedium = exposureShares[0] ?? { medium: '—', count: 0, pct: 0 };
  const tones = [
    { label: 'Negative', n: neg },
    { label: 'Positive', n: pos },
    { label: 'Neutral', n: neu },
  ].sort((a, b) => b.n - a.n);
  const keyFigures: IDashKeyFigures = {
    total,
    topPublisher: topPublishers[0]
      ? { name: topPublishers[0].name, count: topPublishers[0].total }
      : { name: '—', count: 0 },
    topMedium: { label: topMedium.medium, count: topMedium.count, pct: topMedium.pct },
    dominantSection: pick(rand, SECTIONS),
    topAuthor: { name: pick(rand, AUTHORS), count: intBetween(rand, 3, 14) },
    busiestDay: { label: peakDay.label, count: peakDay.value },
    topTone: { label: tones[0].label, pct: total ? Number(((tones[0].n / total) * 100).toFixed(0)) : 0 },
    topEntity: entities[0] ?? { name: '—', count: 0 },
  };

  return {
    days: days.map((d) => d.label),
    overTime: {
      days: overDays,
      total,
      peak: { label: peakDay.label, value: peakDay.value },
      avgPerDay: activeDays ? Math.round(total / activeDays) : 0,
      busiestDay: peakDay.label,
      lead: pick(rand, HEADLINES[n.theme]),
    },
    keyFigures,
    exposure: { shares: exposureShares, byDay: exposureByDay },
    tonality: { total, positive: pos, neutral: neu, negative: neg, byDay: toneByDay, peakNegDay },
    topPublishers,
    entities,
  };
};

// ─── Dashboard drill — tap a figure, get its records + a short analysis ──────
// The web resolves these from the loaded stories; the mobile mock has only aggregates, so we
// read the tapped figure's count straight from the charts and synthesise exactly that many
// article records (one dimension pinned to the figure, the rest seeded). Records therefore
// always sum back to the number shown, and are stable across reloads.
const TONE_KEY: Record<string, ToneKey> = {
  Positive: 'positive',
  Neutral: 'neutral',
  Negative: 'negative',
};
const TONE_WEIGHTED: readonly ToneKey[] = [
  'positive',
  'neutral',
  'positive',
  'neutral',
  'negative',
];
const DRILL_SUBTITLE: Record<string, string> = {
  outlet: 'Top publisher',
  medium: 'Medium',
  author: 'Top author',
  section: 'Dominant section',
  tone: 'Tonality',
  entity: 'Entity',
  day: 'Day',
  total: 'Everything in scope',
};
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const getDashboardDrill = (
  newsletterId: string,
  range: DateRange,
  placeCode: string | null,
  spec: string,
): IDashDrill => {
  const n = nl(newsletterId);
  const charts = getDashboardCharts(newsletterId, range, placeCode);
  const kf = charts.keyFigures;
  const total = kf.total;
  const colon = spec.indexOf(':');
  const kind = colon === -1 ? spec : spec.slice(0, colon);
  const arg = colon === -1 ? '' : spec.slice(colon + 1);

  const rand = rngFor(`dash-drill:${newsletterId}:${range.from}:${range.to}:${placeCode ?? 'all'}:${spec}`);
  const pool = HEADLINES[n.theme];
  const dayLabels = charts.days.length ? charts.days : ['—'];

  // Resolve the figure: its own label, how many records back it, and which record dimension is
  // pinned to it.
  let title = arg || 'All articles';
  let count = 0;
  let pinnedOutlet: string | null = null;
  let pinnedMedium: string | null = null;
  let pinnedAuthor: string | null = null;
  let pinnedTone: ToneKey | null = null;
  let pinnedDay: string | null = null;

  switch (kind) {
    case 'outlet':
      count = charts.topPublishers.find((p) => p.name === arg)?.total ?? intBetween(rand, 2, 8);
      pinnedOutlet = arg;
      break;
    case 'medium':
      count = charts.exposure.shares.find((s) => s.medium === arg)?.count ?? intBetween(rand, 2, 8);
      pinnedMedium = arg;
      break;
    case 'author':
      count = arg === kf.topAuthor.name ? kf.topAuthor.count : intBetween(rand, 2, 6);
      pinnedAuthor = arg;
      break;
    case 'section':
      count = Math.max(2, Math.round(total * (0.25 + rand() * 0.25)));
      break;
    case 'tone': {
      pinnedTone = TONE_KEY[arg] ?? 'neutral';
      count =
        pinnedTone === 'negative'
          ? charts.tonality.negative
          : pinnedTone === 'positive'
            ? charts.tonality.positive
            : charts.tonality.neutral;
      break;
    }
    case 'entity':
      // Entity isn't a record field, so nothing is pinned — the header carries the entity name.
      count = charts.entities.find((e) => e.name === arg)?.count ?? intBetween(rand, 2, 12);
      break;
    case 'day':
      count = charts.overTime.days.find((d) => d.label === arg)?.value ?? intBetween(rand, 1, 8);
      pinnedDay = arg;
      break;
    case 'total':
    default:
      title = 'All articles';
      count = total;
      break;
  }
  count = Math.max(1, Math.min(count, 100));

  const records: IDashRecord[] = Array.from({ length: count }, (_, i) => {
    let outletObj;
    if (pinnedOutlet) outletObj = OUTLETS.find((o) => o.name === pinnedOutlet) ?? pick(rand, OUTLETS);
    else if (pinnedMedium) {
      const cands = OUTLETS.filter((o) => o.mediumLabel === pinnedMedium);
      outletObj = cands.length ? pick(rand, cands) : pick(rand, OUTLETS);
    } else outletObj = pick(rand, OUTLETS);
    return {
      id: `drill-${spec}-${i}`,
      title: pick(rand, pool),
      outlet: outletObj.name,
      medium: pinnedMedium ?? outletObj.mediumLabel,
      date: pinnedDay ?? pick(rand, dayLabels),
      author: pinnedAuthor ?? pick(rand, AUTHORS),
      tone: pinnedTone ?? pick(rand, TONE_WEIGHTED),
    };
  });

  // The two-line reading for the Analysis tab.
  const lead =
    kind === 'outlet'
      ? `${title} ran ${plural(count, 'article')}${arg === kf.topPublisher.name ? ' — the most of any outlet this period' : ''}, ${count} of the ${total} in scope.`
      : kind === 'medium'
        ? `${title} carried ${plural(count, 'article')}, ${charts.exposure.shares.find((s) => s.medium === arg)?.pct ?? 0}% of the coverage.`
        : kind === 'author'
          ? `${title} filed ${plural(count, 'article')} in scope.`
          : kind === 'section'
            ? `${plural(count, 'article')} fell under ${title}.`
            : kind === 'tone'
              ? `${plural(count, 'article')} read ${title.toLowerCase()} — ${total ? Math.round((count / total) * 100) : 0}% of the ${total}.`
              : kind === 'entity'
                ? `${title} was named in ${plural(count, 'article')} this period.`
                : kind === 'day'
                  ? `${plural(count, 'article')} ran on ${title}${arg === charts.overTime.busiestDay ? ' — the busiest day' : ''}.`
                  : `${plural(count, 'article')} in scope across ${charts.days.length} days.`;
  const context = `Coverage peaked on ${charts.overTime.busiestDay} (${charts.overTime.peak.value}); ${kf.topTone.label.toLowerCase()} tone led at ${kf.topTone.pct}%, and ${kf.topPublisher.name} ran the most overall (${kf.topPublisher.count}).`;

  // ── Analysis sections (mirrors the web AnalysisPanel: a titled "What the figure shows"
  // card with a bold lede + bullets + prose, then a "Behind the figure" card). ──
  const shares = [...charts.exposure.shares].sort((a, b) => b.count - a.count);
  const [m1, m2, m3] = shares;
  const activeDays = charts.overTime.days.filter((d) => d.value > 0).length || charts.days.length;
  const avgActive = activeDays ? Math.max(1, Math.round(total / activeDays)) : total;

  const bullets = [
    `Peak: ${charts.overTime.peak.value} on ${charts.overTime.busiestDay}.`,
    `${kf.topTone.label} tone leads at ${kf.topTone.pct}%.`,
    m1
      ? `${m1.medium} carries ${m1.pct}% of coverage${m2 ? `, ahead of ${m2.medium} (${m2.pct}%)` : ''}.`
      : null,
  ].filter((b): b is string => b !== null);

  const byMedium = m1
    ? `By medium, ${m1.medium} carries ${m1.pct}%${m2 ? `, ${m2.medium} ${m2.pct}%` : ''}${m3 ? ` and ${m3.medium} ${m3.pct}%` : ''}.`
    : '';
  const rangePara = `In scope: ${plural(total, 'article')} across ${plural(activeDays, 'active day')}; the average active day carries ${avgActive}.`;

  // "Behind the figure" — read off the records backing this figure (outlets, byline, tone split).
  const outletCounts = new Map<string, number>();
  const authorCounts = new Map<string, number>();
  const toneCounts: Record<ToneKey, number> = { positive: 0, neutral: 0, negative: 0 };
  for (const r of records) {
    outletCounts.set(r.outlet, (outletCounts.get(r.outlet) ?? 0) + 1);
    authorCounts.set(r.author, (authorCounts.get(r.author) ?? 0) + 1);
    toneCounts[r.tone] += 1;
  }
  const topOutlet = [...outletCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topAuthor = [...authorCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const tonePct = (x: number) => (count ? Math.round((x / count) * 100) : 0);

  const behindParas = [
    `These ${plural(count, 'article')} come from ${plural(outletCounts.size, 'outlet')}. ${topOutlet[0]} ran the most (${topOutlet[1]})${topAuthor ? `; ${topAuthor[0]} is the most frequent byline (${topAuthor[1]})` : ''}.`,
    `Tone splits ${tonePct(toneCounts.positive)}% positive, ${tonePct(toneCounts.neutral)}% neutral and ${tonePct(toneCounts.negative)}% negative across the set.`,
    `Scoup’s read: this is how the ${title} figure sits against the rest of the coverage this period.`,
  ];

  const analysis: IDashAnalysisSection[] = [
    {
      title: 'What the figure shows',
      subtitle: `${DRILL_SUBTITLE[kind] ?? 'Everything in scope'} · ${count} of ${total} in scope`,
      blurb: lead,
      bullets,
      paras: [context, rangePara, byMedium].filter((p): p is string => p !== ''),
    },
    {
      title: 'Behind the figure',
      subtitle: 'The records that produce it, with Scoup’s reading of each',
      paras: behindParas,
    },
  ];

  const media = Array.from(new Set(records.map((r) => r.medium)));

  return {
    spec,
    title,
    subtitle: DRILL_SUBTITLE[kind] ?? 'Everything in scope',
    count,
    unit: 'article',
    analysis,
    records,
    media,
  };
};

const PLACE_TEXTS: Record<'positive' | 'neutral' | 'negative', string[]> = {
  positive: [
    'Thank you to the 300+ volunteers who joined the weekend clean-up!',
    'Free check-ups at the city health center are fully booked today.',
    'Street food and live bands at the fiesta tonight. See you there!',
  ],
  neutral: [
    'Business-permit renewal goes fully online for 2027. Here’s how to apply.',
    'The public market reopens Monday after its scheduled renovation.',
    'Scheduled power interruption on Thursday, 9 AM to 3 PM.',
  ],
  negative: [
    'Heads up: the main road is flooded again after the afternoon rain.',
    'Heavy traffic reported near the public market this morning.',
    'Residents are asking the city when the pumping station will be fixed.',
  ],
};
const FB_SOURCES: { name: string; kind: 'page' | 'group' }[] = [
  { name: 'Manila PIO', kind: 'page' },
  { name: 'QC Government', kind: 'page' },
  { name: 'Taga-Makati', kind: 'group' },
  { name: 'Pasig City Government', kind: 'page' },
  { name: 'Marikina River Watch', kind: 'group' },
  { name: 'Parañaque PIO', kind: 'page' },
  { name: 'MMDA', kind: 'page' },
];

export const getPlaceDetail = (city: string): IPlaceDetail => {
  const rand = rngFor(`place:${city}`);
  const sents = ['positive', 'neutral', 'negative'] as const;
  const topPosts = shuffle(rand, FB_SOURCES).slice(0, 6).map((src, i) => {
    const s = pick(rand, sents);
    return {
      id: `pp-${city}-${i}`,
      author: src.name,
      text: pick(rand, PLACE_TEXTS[s]),
      engagements: intBetween(rand, 400, 9_600),
      sentiment: s,
    };
  }).sort((a, b) => b.engagements - a.engagements);

  const mostPosts = [...CITIES]
    .map((c) => ({ name: c.name, district: c.district, posts: cityPosts(c.name, c.tier) }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 8);

  const pos = intBetween(rand, 20, 45);
  const neg = intBetween(rand, 20, 45);
  return {
    city,
    sentiment: { positive: pos, negative: neg, neutral: Math.max(0, 100 - pos - neg) },
    sentimentPostCount: intBetween(rand, 12, 40),
    mostPosts,
    fbPages: shuffle(rand, FB_SOURCES).map((s) => ({
      name: s.name, kind: s.kind, posts: intBetween(rngFor(`fb:${city}:${s.name}`), 4, 40),
    })),
    topPosts,
  };
};

// ─── Map monitor ("Local" map tab) ───────────────────────────────────────────
// The web's Local view: a post-count map + four city-scoped panels. Built from STORY_PLACES
// (the PSGC codes the choropleth needs) enriched with each NCR city's district + tier from
// CITIES; the 6 major cities get a region label and a mid tier.
const REGION_NAMES: Record<string, string> = {
  '1100000000': 'Davao Region',
  '0700000000': 'Central Visayas',
  '1400000000': 'Cordillera (CAR)',
  '1000000000': 'Northern Mindanao',
  '0600000000': 'Western Visayas',
  '0900000000': 'Zamboanga Peninsula',
};

interface MapPlace {
  code: string;
  name: string;
  short: string;
  region: string;
  district: string;
  tier: Tier;
}
const MAP_PLACES: readonly MapPlace[] = STORY_PLACES.map((p) => {
  const city = CITIES.find((c) => c.name === p.short); // NCR cities match CITIES by short name
  return {
    code: p.code,
    name: p.name,
    short: p.short,
    region: p.region,
    district: city ? `${city.district} District` : REGION_NAMES[p.region] ?? 'Philippines',
    tier: city?.tier ?? 1,
  };
});

const geoPosts = (newsletterId: string, code: string, tier: Tier): number =>
  intBetween(rngFor(`geopost:${newsletterId}:${code}`), POST_RANGE[tier][0], POST_RANGE[tier][1]);

export const getGeoMap = (newsletterId: string): IGeoMap => {
  const areas = MAP_PLACES.map((p) => ({
    code: p.code,
    name: p.name,
    short: p.short,
    region: p.region,
    district: p.district,
    posts: geoPosts(newsletterId, p.code, p.tier),
  }));
  const counts: Record<string, number> = {};
  for (const a of areas) counts[a.code] = a.posts;
  const placed = areas.reduce((s, a) => s + a.posts, 0);
  const unplaced = intBetween(rngFor(`geo:unplaced:${newsletterId}`), 40, 90);
  return { counts, areas, total: placed + unplaced, placeCount: areas.length, unplaced };
};

// Web-style comment emotions (the "reaction" label above the sentiment bar).
const MAP_EMOTIONS = ['Curiosity', 'Optimism', 'Concern', 'Frustration', 'Approval', 'Hope', 'Relief', 'Anger'];
// LGU-style FB pages/groups for the Local panels; each gets prefixed with the place name.
const MAP_SOURCES: { name: string; kind: 'page' | 'group' }[] = [
  { name: 'City Government', kind: 'page' },
  { name: 'City PIO', kind: 'page' },
  { name: 'City Updates', kind: 'group' },
  { name: 'City Hall', kind: 'page' },
  { name: 'Barangay Watch', kind: 'group' },
  { name: 'Traffic Alerts', kind: 'group' },
  { name: 'Public Market Vendors', kind: 'group' },
  { name: 'DRRMO', kind: 'page' },
  { name: 'Residents United', kind: 'group' },
  { name: 'Local News Desk', kind: 'page' },
];
const MAP_STANCES = ['ally', 'ally', 'neutral', 'neutral', 'critic'] as const; // weighted to ally/neutral
const TONE_TO_SENT = { pos: 'positive', neu: 'neutral', neg: 'negative' } as const;

export const getMapPlaceDetail = (
  newsletterId: string,
  placeCode: string,
): IMapPlaceDetail | null => {
  const place = MAP_PLACES.find((p) => p.code === placeCode);
  if (!place) return null;
  const geo = getGeoMap(newsletterId);
  const posts = geo.counts[placeCode] ?? geoPosts(newsletterId, placeCode, place.tier);
  const rand = rngFor(`mapdetail:${newsletterId}:${placeCode}`);

  const reactions = posts * intBetween(rand, 80, 180);
  const comments = posts * intBetween(rand, 10, 28);
  const shares = posts * intBetween(rand, 4, 12);
  const profile: IMapPlaceProfile = {
    code: place.code,
    name: place.name,
    district: place.district,
    posts,
    engagements: reactions + comments + shares,
    reactions,
    comments,
    shares,
  };

  const pos = intBetween(rand, 28, 44);
  const neg = intBetween(rand, 18, 34);
  const sentiment: IMapSentiment = {
    emotion: pick(rand, MAP_EMOTIONS),
    positive: pos,
    negative: neg,
    neutral: Math.max(0, 100 - pos - neg),
    comments: intBetween(rand, 90, 180),
    analysed: intBetween(rand, 40, 90),
  };

  const mostPosts: IMapRankedPlace[] = geo.areas
    .map((a) => ({ code: a.code, name: a.name, district: a.district, posts: a.posts }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 8);

  const prefix = place.name.replace(/ City$/, ''); // "Taguig City" → "Taguig"
  const pages: IMapPage[] = shuffle(rand, MAP_SOURCES).map((src, i) => ({
    id: `pg-${placeCode}-${i}`,
    name: `${prefix} ${src.name}`,
    kind: src.kind,
    followers: intBetween(rand, 80, 920) * 1_000,
    posts: intBetween(rand, 16, 44),
    comments: intBetween(rand, 240, 1_400),
    stance: pick(rand, MAP_STANCES),
    official: src.kind === 'page' && rand() < 0.7,
  }));

  const topPosts: IMapPost[] = shuffle(rand, MAP_SOURCES)
    .slice(0, 8)
    .map((src, i) => {
      const tone = pick(rand, ['pos', 'neu', 'neg'] as const);
      const r = intBetween(rand, 1_500, 9_600);
      const c = intBetween(rand, 80, 1_400);
      const s = intBetween(rand, 60, 600);
      return {
        id: `pp-${placeCode}-${i}`,
        author: `${prefix} ${src.name}`,
        kind: src.kind,
        text: pick(rand, PLACE_TEXTS[TONE_TO_SENT[tone]]),
        reactions: r,
        comments: c,
        shares: s,
        engagements: r + c + s,
        hoursAgo: intBetween(rand, 1, 12),
        tone,
      };
    })
    .sort((a, b) => b.engagements - a.engagements);

  return { profile, sentiment, mostPosts, pages, posts: topPosts };
};
