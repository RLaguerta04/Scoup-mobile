// Publishers mock — the managed list of news outlets. Ported from the web app's
// mock handler (scoup_ui_v2/src/mocks/handlers/publishers.ts) so names, domains and
// statuses reconcile with Media Meter. Unlike the read-only generators, this module
// keeps a mutable in-memory list so Add / Edit / Delete reflect for the session; the
// shape matches the real `*/publishers/` endpoints, so the swap is invisible.
import type { IPublisher, IPublisherStatus } from '@/types';
import { NEWSLETTERS, OUTLETS } from './entities';
import { intBetween, pick, rngFor, type Rand } from './util';

// Real PH domains per shared outlet, so a publisher's URL reconciles with the name
// shown on Media Meter and other screens.
const DOMAINS: Readonly<Record<string, string>> = {
  'Philippine Daily Inquirer': 'inquirer.net',
  'The Philippine Star': 'philstar.com',
  'Manila Bulletin': 'mb.com.ph',
  BusinessWorld: 'bworldonline.com',
  Rappler: 'rappler.com',
  'GMA News Online': 'gmanetwork.com/news',
  'ABS-CBN News': 'news.abs-cbn.com',
  'Philstar.com': 'philstar.com',
  'Manila Times': 'manilatimes.net',
  Abante: 'abante.com.ph',
  Bandera: 'bandera.inquirer.net',
  'GMA-7': 'gmanetwork.com',
  TV5: 'tv5.com.ph',
  DZRH: 'dzrh.com.ph',
  'DZMM TeleRadyo': 'dzmm.abs-cbn.com',
  SunStar: 'sunstar.com.ph',
};

// Most national outlets are headquartered in Metro Manila; SunStar is Cebu-based.
const REGIONS: Readonly<Record<string, string>> = {
  SunStar: 'Region VII (Central Visayas)',
};
const DEFAULT_REGION = 'NCR (Metro Manila)';

// Fictional internal desks that "added" each publisher record.
const CREATORS: readonly string[] = [
  'research.desk@scoup.ph',
  'media.ops@scoup.ph',
  'newsroom@scoup.ph',
];

type PublisherSeed = { name: string; domain: string; region: string };

// Two extra PH titles beyond the shared OUTLETS, so the list has 18 rows.
const EXTRA_SEEDS: readonly PublisherSeed[] = [
  { name: 'Daily Tribune', domain: 'tribune.net.ph', region: DEFAULT_REGION },
  { name: 'Malaya Business Insight', domain: 'malaya.com.ph', region: DEFAULT_REGION },
];

const PUBLISHER_SEEDS: readonly PublisherSeed[] = [
  ...OUTLETS.map((outlet) => ({
    name: outlet.name,
    domain: DOMAINS[outlet.name] ?? 'example.com.ph',
    region: REGIONS[outlet.name] ?? DEFAULT_REGION,
  })),
  ...EXTRA_SEEDS,
];

// Fixed reference instant (no Date.now) so created/updated stamps are stable.
const BASE_MS = Date.parse('2026-11-01T09:00:00Z');
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

// Mostly processed, with a realistic tail of in-flight and failed records.
const rollStatus = (rand: Rand): IPublisherStatus => {
  const r = rand();
  if (r < 0.68) return 'Done';
  if (r < 0.8) return 'Processing';
  if (r < 0.88) return 'Queued';
  if (r < 0.93) return 'Failed';
  if (r < 0.97) return 'Error';
  return 'DoesNotExist';
};

const faviconFor = (domain: string): string =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

// Stable 8-hex id per publisher name (survives sorting/filtering/reload).
const publisherId = (name: string): string =>
  `pub_${Math.floor(rngFor(`pub-id:${name}`)() * 0xff_ff_ff_ff)
    .toString(16)
    .padStart(8, '0')}`;

const buildPublishers = (): IPublisher[] => {
  const rand = rngFor('publishers:list:v1');
  return PUBLISHER_SEEDS.map((seed) => {
    const createdMs =
      BASE_MS - intBetween(rand, 12, 150) * DAY_MS - intBetween(rand, 0, 23) * HOUR_MS;
    const updatedMs = Math.min(
      BASE_MS,
      createdMs + intBetween(rand, 1, 25) * DAY_MS + intBetween(rand, 0, 23) * HOUR_MS,
    );
    return {
      id: publisherId(seed.name),
      publisher_name: seed.name,
      website_url: `https://${seed.domain}`,
      region: seed.region,
      created_by: pick(rand, CREATORS),
      publisher_logo_url: faviconFor(seed.domain),
      created_at: new Date(createdMs).toISOString(),
      updated_at: new Date(updatedMs).toISOString(),
      status: rollStatus(rand),
    };
  });
};

// Mutable session list — Add/Edit/Delete operate here. Seeded once at module load.
let PUBLISHERS: IPublisher[] = buildPublishers();

// Monotonic counter for ids minted this session (no Date.now / Math.random).
let nextLocalId = 1;

const domainOf = (url: string): string =>
  url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0] ?? url;

const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

// ─── Reads ───────────────────────────────────────────────────────────────────
export const getPublishers = (): IPublisher[] => [...PUBLISHERS];

// ─── Mutations ───────────────────────────────────────────────────────────────
// New records start as 'Queued' (the backend ingests + crawls them), mirroring the
// web, so the status column shows the just-added row working through the pipeline.
export const addPublisher = (input: {
  website_url: string;
  publisher_name: string;
}): IPublisher => {
  const website_url = normalizeUrl(input.website_url);
  const domain = domainOf(website_url);
  const row: IPublisher = {
    id: `pub_local_${nextLocalId++}`,
    publisher_name: input.publisher_name.trim() || domain,
    website_url,
    region: DEFAULT_REGION,
    created_by: CREATORS[0],
    publisher_logo_url: faviconFor(domain),
    created_at: new Date(BASE_MS).toISOString(),
    updated_at: new Date(BASE_MS).toISOString(),
    status: 'Queued',
  };
  PUBLISHERS = [row, ...PUBLISHERS];
  return row;
};

export const updatePublisher = (input: {
  id: string;
  website_url: string;
  publisher_name: string;
}): IPublisher | null => {
  const website_url = normalizeUrl(input.website_url);
  let updated: IPublisher | null = null;
  PUBLISHERS = PUBLISHERS.map((p) => {
    if (p.id !== input.id) return p;
    updated = {
      ...p,
      publisher_name: input.publisher_name.trim() || p.publisher_name,
      website_url,
      publisher_logo_url: faviconFor(domainOf(website_url)),
      updated_at: new Date(BASE_MS).toISOString(),
    };
    return updated;
  });
  return updated;
};

export const deletePublishers = (ids: readonly string[]): { deleted: number } => {
  const kill = new Set(ids);
  const before = PUBLISHERS.length;
  PUBLISHERS = PUBLISHERS.filter((p) => !kill.has(p.id));
  return { deleted: before - PUBLISHERS.length };
};

// ─── Buckets ─────────────────────────────────────────────────────────────────
// Which keyword buckets each publisher feeds, for a given newsletter — the web's
// "Show buckets for:" selector. Deterministic: each publisher is assigned 0–2 of the
// chosen newsletter's buckets, stable across reloads. Returns a name→bucket-names map.
export const getPublisherBuckets = (newsletterId: string): Record<string, string[]> => {
  const newsletter = NEWSLETTERS.find((n) => n.id === newsletterId);
  if (!newsletter) return {};
  const map: Record<string, string[]> = {};
  for (const p of PUBLISHERS) {
    const rand = rngFor(`pub-bucket:${newsletterId}:${p.id}`);
    const count = intBetween(rand, 0, 2);
    if (count === 0) continue;
    const picked = new Set<string>();
    for (let i = 0; i < count; i++) picked.add(pick(rand, newsletter.buckets).name);
    map[p.id] = [...picked];
  }
  return map;
};
