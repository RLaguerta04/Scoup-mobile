// Newsletter Settings mock — the BUCKETS tab's data. A mutable session store (like
// recipientGroups.ts) seeded lazily from NEWSLETTERS, so add/rename/delete persist for the
// app session without touching the shared readonly NEWSLETTERS. Deterministic seeding.
import { NEWSLETTERS } from './entities';
import { intBetween, rngFor, type Rand } from './util';
import type {
  IBucketGroupSummary,
  IBucketSettings,
  IKeywordGroupSummary,
  INewsletterSettings,
} from '@/types';

const KEYWORD_GROUP_POOL = [
  'Core terms',
  'Brand watch',
  'Product news',
  'Pricing',
  'Service quality',
  'Executives',
  'Campaigns',
  'Regulation',
];
// Plausible Main/Additional/Excluded keyword sets per group theme (web: main/additional/excluded).
// Stored UPPERCASE, quote-free — the editor/cards add the display quoting.
const KEYWORD_SETS: Record<string, { main: string[]; additional: string[]; excluded: string[] }> = {
  'Core terms': { main: ['TELCO', 'BROADBAND', 'MOBILE DATA', '5G', 'FIBER'], additional: ['PREPAID', 'POSTPAID', 'ROAMING'], excluded: ['GAMING'] },
  'Brand watch': { main: ['GLOBE', 'PLDT', 'SMART', 'DITO', 'CONVERGE'], additional: ['REBRAND', 'SPONSORSHIP'], excluded: [] },
  'Product news': { main: ['NEW PLAN', 'DEVICE LAUNCH', 'PROMO', 'BUNDLE'], additional: ['UNLIMITED DATA', '5G ROUTER'], excluded: ['RUMOR'] },
  'Pricing': { main: ['PRICE HIKE', 'RATE CUT', 'LOAD', 'DATA PROMO'], additional: ['PROMO CODE', 'DISCOUNT'], excluded: [] },
  'Service quality': { main: ['OUTAGE', 'SLOW INTERNET', 'DOWNTIME', 'SIGNAL DROP'], additional: ['LATENCY', 'DROPPED CALL'], excluded: [] },
  'Executives': { main: ['CEO', 'CHAIRMAN', 'PRESIDENT', 'SPOKESPERSON'], additional: ['INTERVIEW', 'STATEMENT'], excluded: [] },
  'Campaigns': { main: ['HASHTAG', 'TRENDING', 'VIRAL', 'ADVOCACY'], additional: ['INFLUENCER', 'ENDORSEMENT'], excluded: [] },
  'Regulation': { main: ['NTC', 'DICT', 'SPECTRUM AUCTION', 'FRANCHISE RENEWAL', 'SIM REGISTRATION ACT'], additional: ['NET NEUTRALITY', 'TOWER SHARING', 'OPEN ACCESS'], excluded: [] },
};
// Normalize editor input: trim, UPPERCASE, drop blanks, de-dupe (preserve order).
const normKeywords = (arr: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of arr) {
    const k = raw.trim().toUpperCase();
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
};
// Plausible bucket summaries (web: bucket_summary), assigned deterministically per bucket.
const DESCRIPTION_POOL = [
  'Tracks core operational signals — outages, coverage gaps, signal quality, downtime, and overall service reliability.',
  'Captures government and compliance activity affecting the sector, including regulatory actions, proceedings, bills, and licensing decisions.',
  'Monitors campaign tags, trending topics, and issue-driven hashtags across the social platforms you track.',
  'Follows product launches, pricing moves, promos, and competitor campaigns as they unfold.',
  'Identifies reputational threats and active backlash — incidents, lawsuits, controversies, and complaint surges.',
  'Captures local-language terms that signal subscriber frustration before formal complaints emerge.',
  'Watches executive statements, leadership moves, and the narratives that shape the brand.',
  'Follows the applications and services that drive data demand and shape network load.',
];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const formatCreated = (rand: Rand): string =>
  `${MONTHS[intBetween(rand, 0, 11)]} ${intBetween(rand, 1, 28)}, 2026`;

const buildBucket = (nlId: string, b: { id: number; name: string }): IBucketSettings => {
  const rand = rngFor(`settings:${nlId}:${b.id}`);
  const n = intBetween(rand, 1, 3);
  const keywordGroups: IKeywordGroupSummary[] = Array.from({ length: n }, (_, i) => {
    const name = KEYWORD_GROUP_POOL[(b.id + i) % KEYWORD_GROUP_POOL.length];
    const set = KEYWORD_SETS[name] ?? { main: ['TELCO'], additional: [], excluded: [] };
    return {
      id: `kg-${b.id}-${i}`,
      name,
      summary: '',
      mainKeywords: [...set.main],
      additionalKeywords: [...set.additional],
      excludedKeywords: [...set.excluded],
    };
  });
  return {
    id: b.id,
    name: b.name,
    description: DESCRIPTION_POOL[intBetween(rand, 0, DESCRIPTION_POOL.length - 1)],
    keywordGroups,
    sourceRestrict: false,
    sourceCount: 0,
    sourceIds: [],
    createdAt: formatCreated(rand),
  };
};

const buildGroups = (nlId: string, buckets: IBucketSettings[]): IBucketGroupSummary[] => {
  if (buckets.length < 2) return [];
  const first = buckets.slice(0, Math.min(3, buckets.length));
  const last = buckets.slice(-2);
  return [
    { id: `grp-${nlId}-1`, name: 'Competitor Benchmark', bucketIds: first.map((b) => b.id), bucketNames: first.map((b) => b.name) },
    { id: `grp-${nlId}-2`, name: 'Regulatory Watch', bucketIds: last.map((b) => b.id), bucketNames: last.map((b) => b.name) },
  ];
};

const buildSettings = (nlId: string): INewsletterSettings => {
  const nl = NEWSLETTERS.find((n) => n.id === nlId) ?? NEWSLETTERS[0];
  const buckets = nl.buckets.map((b) => buildBucket(nl.id, b));
  return { newsletterId: nl.id, newsletterName: nl.name, buckets, groups: buildGroups(nl.id, buckets) };
};

// Mutable session store, seeded lazily per newsletter.
const store = new Map<string, INewsletterSettings>();
const ensure = (nlId: string): INewsletterSettings => {
  let s = store.get(nlId);
  if (!s) {
    s = buildSettings(nlId);
    store.set(nlId, s);
  }
  return s;
};
const clone = (s: INewsletterSettings): INewsletterSettings => ({
  ...s,
  buckets: s.buckets.map((b) => ({
    ...b,
    keywordGroups: b.keywordGroups.map((k) => ({
      ...k,
      mainKeywords: [...k.mainKeywords],
      additionalKeywords: [...k.additionalKeywords],
      excludedKeywords: [...k.excludedKeywords],
    })),
    sourceIds: [...b.sourceIds],
  })),
  groups: s.groups.map((g) => ({ ...g, bucketIds: [...g.bucketIds], bucketNames: [...g.bucketNames] })),
});

// Monotonic ids minted this session (no Date.now / Math.random).
let nextBucketId = 99001;
let nextLocalId = 1;

const nameOf = (s: INewsletterSettings, id: number): string =>
  s.buckets.find((b) => b.id === id)?.name ?? `Bucket ${id}`;
// Keep each group's member names (and drop removed buckets) in sync after a bucket change.
const resyncGroups = (s: INewsletterSettings) => {
  s.groups = s.groups
    .map((g) => {
      const ids = g.bucketIds.filter((id) => s.buckets.some((b) => b.id === id));
      return { ...g, bucketIds: ids, bucketNames: ids.map((id) => nameOf(s, id)) };
    })
    .filter((g) => g.bucketIds.length > 0);
};

// ─── Reads ───────────────────────────────────────────────────────────────────
export const getNewsletterSettings = (nlId: string): INewsletterSettings => clone(ensure(nlId));

// ─── Mutations ───────────────────────────────────────────────────────────────
export const renameNewsletter = (nlId: string, name: string): INewsletterSettings => {
  const s = ensure(nlId);
  s.newsletterName = name.trim() || s.newsletterName;
  return clone(s);
};

export const createBucket = (
  nlId: string,
  input: { name: string; description?: string },
): INewsletterSettings => {
  const s = ensure(nlId);
  s.buckets = [
    {
      id: nextBucketId++,
      name: input.name.trim() || 'Untitled bucket',
      description: input.description?.trim() ?? '',
      keywordGroups: [],
      sourceRestrict: false,
      sourceCount: 0,
      sourceIds: [],
      createdAt: 'Just now',
    },
    ...s.buckets,
  ];
  return clone(s);
};

export const renameBucket = (nlId: string, bucketId: number, name: string): INewsletterSettings => {
  const s = ensure(nlId);
  s.buckets = s.buckets.map((b) => (b.id === bucketId ? { ...b, name: name.trim() || b.name } : b));
  resyncGroups(s);
  return clone(s);
};

export const deleteBucket = (nlId: string, bucketId: number): INewsletterSettings => {
  const s = ensure(nlId);
  s.buckets = s.buckets.filter((b) => b.id !== bucketId);
  resyncGroups(s);
  return clone(s);
};

export const duplicateBucket = (nlId: string, bucketId: number): INewsletterSettings => {
  const s = ensure(nlId);
  const idx = s.buckets.findIndex((b) => b.id === bucketId);
  if (idx >= 0) {
    const src = s.buckets[idx];
    const copy: IBucketSettings = {
      ...src,
      id: nextBucketId++,
      name: `${src.name} (Copy)`,
      keywordGroups: src.keywordGroups.map((k) => ({
        ...k,
        id: `kg-copy-${nextLocalId++}`,
        mainKeywords: [...k.mainKeywords],
        additionalKeywords: [...k.additionalKeywords],
        excludedKeywords: [...k.excludedKeywords],
      })),
      createdAt: 'Just now',
    };
    s.buckets = [...s.buckets.slice(0, idx + 1), copy, ...s.buckets.slice(idx + 1)];
  }
  return clone(s);
};

export const saveBucketGroup = (
  nlId: string,
  input: { id?: string; name: string; bucketIds: number[] },
): INewsletterSettings => {
  const s = ensure(nlId);
  const names = input.bucketIds.map((id) => nameOf(s, id));
  if (input.id) {
    s.groups = s.groups.map((g) =>
      g.id === input.id ? { ...g, name: input.name.trim() || g.name, bucketIds: input.bucketIds, bucketNames: names } : g,
    );
  } else {
    s.groups = [...s.groups, { id: `grp-local-${nextLocalId++}`, name: input.name.trim() || 'Untitled group', bucketIds: input.bucketIds, bucketNames: names }];
  }
  return clone(s);
};

export const deleteBucketGroup = (nlId: string, groupId: string): INewsletterSettings => {
  const s = ensure(nlId);
  s.groups = s.groups.filter((g) => g.id !== groupId);
  return clone(s);
};

export const setSourceIntake = (
  nlId: string,
  bucketId: number,
  restrict: boolean,
  sourceIds: string[],
): INewsletterSettings => {
  const s = ensure(nlId);
  const ids = restrict ? [...new Set(sourceIds)] : [];
  s.buckets = s.buckets.map((b) =>
    b.id === bucketId
      ? { ...b, sourceRestrict: restrict, sourceIds: ids, sourceCount: ids.length }
      : b,
  );
  return clone(s);
};

// ─── Keyword groups (a bucket's Main/Additional/Excluded keyword sets) ─────────
type KeywordGroupInput = {
  name: string;
  mainKeywords: string[];
  additionalKeywords: string[];
  excludedKeywords: string[];
};
const mapBucket = (
  s: INewsletterSettings,
  bucketId: number,
  fn: (b: IBucketSettings) => IBucketSettings,
) => {
  s.buckets = s.buckets.map((b) => (b.id === bucketId ? fn(b) : b));
};

export const createKeywordGroup = (
  nlId: string,
  bucketId: number,
  input: KeywordGroupInput,
): INewsletterSettings => {
  const s = ensure(nlId);
  const group: IKeywordGroupSummary = {
    id: `kg-local-${nextLocalId++}`,
    name: input.name.trim() || 'Untitled group',
    summary: '',
    mainKeywords: normKeywords(input.mainKeywords),
    additionalKeywords: normKeywords(input.additionalKeywords),
    excludedKeywords: normKeywords(input.excludedKeywords),
  };
  mapBucket(s, bucketId, (b) => ({ ...b, keywordGroups: [group, ...b.keywordGroups] }));
  return clone(s);
};

export const updateKeywordGroup = (
  nlId: string,
  bucketId: number,
  groupId: string,
  input: KeywordGroupInput,
): INewsletterSettings => {
  const s = ensure(nlId);
  mapBucket(s, bucketId, (b) => ({
    ...b,
    keywordGroups: b.keywordGroups.map((k) =>
      k.id === groupId
        ? {
            ...k,
            name: input.name.trim() || k.name,
            mainKeywords: normKeywords(input.mainKeywords),
            additionalKeywords: normKeywords(input.additionalKeywords),
            excludedKeywords: normKeywords(input.excludedKeywords),
          }
        : k,
    ),
  }));
  return clone(s);
};

export const duplicateKeywordGroup = (
  nlId: string,
  bucketId: number,
  groupId: string,
): INewsletterSettings => {
  const s = ensure(nlId);
  mapBucket(s, bucketId, (b) => {
    const idx = b.keywordGroups.findIndex((k) => k.id === groupId);
    if (idx < 0) return b;
    const src = b.keywordGroups[idx];
    const copy: IKeywordGroupSummary = {
      ...src,
      id: `kg-copy-${nextLocalId++}`,
      name: `${src.name} (Copy)`,
      mainKeywords: [...src.mainKeywords],
      additionalKeywords: [...src.additionalKeywords],
      excludedKeywords: [...src.excludedKeywords],
    };
    return {
      ...b,
      keywordGroups: [...b.keywordGroups.slice(0, idx + 1), copy, ...b.keywordGroups.slice(idx + 1)],
    };
  });
  return clone(s);
};

export const deleteKeywordGroup = (
  nlId: string,
  bucketId: number,
  groupId: string,
): INewsletterSettings => {
  const s = ensure(nlId);
  mapBucket(s, bucketId, (b) => ({
    ...b,
    keywordGroups: b.keywordGroups.filter((k) => k.id !== groupId),
  }));
  return clone(s);
};
