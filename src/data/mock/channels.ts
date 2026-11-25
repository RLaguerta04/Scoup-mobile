// Channels mock — the "Social Media Channels" list (the web's influencers). Ported so the
// handles, platforms, followers and statuses match the web screen. Like publishers, keeps a
// mutable in-memory list so Add / Edit / Delete reflect for the session; the shape matches the
// real `/api/v1/influencer/` endpoints, so the swap is invisible.
import type { ChannelPlatform, IChannel, IPublisherStatus } from '@/types';
import { NEWSLETTERS } from './entities';
import { intBetween, pick, rngFor } from './util';

type ChannelSeed = {
  handle: string;
  name: string;
  platform: ChannelPlatform;
  followers: number;
  status: IPublisherStatus;
  // Parent org's website — its favicon is the channel's avatar (a news brand's social avatar
  // is its org logo). Reddit subs fall back to reddit.com (the Reddit mark).
  domain: string;
};

// Real PH news accounts across the four platforms shown on the web (statuses + follower
// counts mirror the screenshot so the two reconcile).
const CHANNEL_SEEDS: readonly ChannelSeed[] = [
  // Facebook
  { handle: 'abscbnNEWS', name: 'ABS-CBN News', platform: 'FACEBOOK', followers: 15_900_000, status: 'Done', domain: 'news.abs-cbn.com' },
  { handle: 'gmanews', name: 'GMA News', platform: 'FACEBOOK', followers: 25_300_000, status: 'Done', domain: 'gmanetwork.com' },
  { handle: 'rapplerdotcom', name: 'Rappler', platform: 'FACEBOOK', followers: 4_300_000, status: 'Done', domain: 'rappler.com' },
  { handle: 'inquirerdotnet', name: 'Inquirer', platform: 'FACEBOOK', followers: 6_200_000, status: 'Processing', domain: 'inquirer.net' },
  { handle: 'manilabulletin', name: 'Manila Bulletin', platform: 'FACEBOOK', followers: 2_200_000, status: 'Done', domain: 'mb.com.ph' },
  { handle: 'philstarnews', name: 'Philstar', platform: 'FACEBOOK', followers: 3_400_000, status: 'Done', domain: 'philstar.com' },
  { handle: 'PTVph', name: 'PTV', platform: 'FACEBOOK', followers: 1_700_000, status: 'Queued', domain: 'ptvnews.ph' },
  // X / Twitter
  { handle: 'ABSCBNNews', name: 'ABS-CBN News', platform: 'TWITTER', followers: 9_400_000, status: 'Done', domain: 'news.abs-cbn.com' },
  { handle: 'gmanews', name: 'GMA News', platform: 'TWITTER', followers: 6_900_000, status: 'Done', domain: 'gmanetwork.com' },
  { handle: 'rapplerdotcom', name: 'Rappler', platform: 'TWITTER', followers: 2_700_000, status: 'Done', domain: 'rappler.com' },
  { handle: 'inquirerdotnet', name: 'Inquirer', platform: 'TWITTER', followers: 2_900_000, status: 'Error', domain: 'inquirer.net' },
  { handle: 'manila_bulletin', name: 'Manila Bulletin', platform: 'TWITTER', followers: 798_600, status: 'Done', domain: 'mb.com.ph' },
  // YouTube
  { handle: 'ABSCBNNews', name: 'ABS-CBN News', platform: 'YOUTUBE', followers: 13_800_000, status: 'Done', domain: 'news.abs-cbn.com' },
  { handle: 'GMAPublicAffairs', name: 'GMA Public Affairs', platform: 'YOUTUBE', followers: 10_200_000, status: 'Done', domain: 'gmanetwork.com' },
  { handle: 'KapamilyaOnlineLive', name: 'Kapamilya Online Live', platform: 'YOUTUBE', followers: 16_400_000, status: 'Done', domain: 'abs-cbn.com' },
  { handle: 'PhilstarTV', name: 'Philstar TV', platform: 'YOUTUBE', followers: 398_200, status: 'Failed', domain: 'philstar.com' },
  // Reddit
  { handle: 'r/Philippines', name: 'Philippines', platform: 'REDDIT', followers: 1_700_000, status: 'Done', domain: 'reddit.com' },
  { handle: 'r/manila', name: 'Manila', platform: 'REDDIT', followers: 211_600, status: 'Done', domain: 'reddit.com' },
  { handle: 'r/studentsph', name: 'Students PH', platform: 'REDDIT', followers: 87_500, status: 'DoesNotExist', domain: 'reddit.com' },
];

// Org logo via Google's favicon service, keyed to the parent site — the same source the
// Publishers list uses, so it loads reliably in the app.
const faviconFor = (domain: string): string =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

// Build each platform's profile URL from the handle (Reddit handle already carries "r/").
export const channelUrl = (platform: ChannelPlatform, handle: string): string => {
  switch (platform) {
    case 'FACEBOOK':
      return `https://www.facebook.com/${handle}`;
    case 'TWITTER':
      return `https://x.com/${handle}`;
    case 'YOUTUBE':
      return `https://www.youtube.com/@${handle}`;
    case 'REDDIT':
      return `https://www.reddit.com/${handle}`;
    case 'INSTAGRAM':
      return `https://www.instagram.com/${handle}`;
  }
};

// Stable 8-hex id per handle+platform (survives sorting/filtering/reload).
const channelId = (handle: string, platform: ChannelPlatform): string =>
  `chn_${Math.floor(rngFor(`chn-id:${platform}:${handle}`)() * 0xff_ff_ff_ff)
    .toString(16)
    .padStart(8, '0')}`;

const buildChannels = (): IChannel[] =>
  CHANNEL_SEEDS.map((s) => ({
    id: channelId(s.handle, s.platform),
    handle: s.handle,
    name: s.name,
    profile_url: channelUrl(s.platform, s.handle),
    followers: s.followers,
    platform: s.platform,
    status: s.status,
    logoUrl: faviconFor(s.domain),
  }));

// Mutable session list — Add/Edit/Delete operate here. Seeded once at module load.
let CHANNELS: IChannel[] = buildChannels();
let nextLocalId = 1;

const normalizeUrl = (raw: string): string => {
  const t = raw.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

// Detect the platform from a profile URL (the web's detectPlatformFromUrl).
const detectPlatform = (url: string): ChannelPlatform => {
  const u = url.toLowerCase();
  if (u.includes('x.com') || u.includes('twitter.com')) return 'TWITTER';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YOUTUBE';
  if (u.includes('reddit.com')) return 'REDDIT';
  if (u.includes('instagram.com')) return 'INSTAGRAM';
  return 'FACEBOOK';
};

// Pull a display handle out of a profile URL (r/<sub> for Reddit, @handle for YouTube).
const extractHandle = (url: string, platform: ChannelPlatform): string => {
  const path = url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('?')[0]
    .replace(/\/+$/, '');
  const parts = path.split('/').filter(Boolean);
  if (platform === 'REDDIT') {
    const i = parts.findIndex((p) => p.toLowerCase() === 'r');
    return i >= 0 && parts[i + 1] ? `r/${parts[i + 1]}` : path;
  }
  const last = parts[parts.length - 1] ?? path;
  return last.replace(/^@/, '');
};

// ─── Reads ───────────────────────────────────────────────────────────────────
export const getChannels = (): IChannel[] => [...CHANNELS];

// ─── Mutations ───────────────────────────────────────────────────────────────
// New channels start as 'Queued' (the backend ingests + crawls them) and have 0 followers
// until the crawl resolves — mirroring the web.
export const addChannel = (input: { profile_url: string; name: string }): IChannel => {
  const profile_url = normalizeUrl(input.profile_url);
  const platform = detectPlatform(profile_url);
  const handle = extractHandle(profile_url, platform);
  const row: IChannel = {
    id: `chn_local_${nextLocalId++}`,
    handle,
    name: input.name.trim() || handle,
    profile_url,
    followers: 0,
    platform,
    status: 'Queued',
  };
  CHANNELS = [row, ...CHANNELS];
  return row;
};

export const updateChannel = (input: {
  id: string;
  profile_url: string;
  name: string;
}): IChannel | null => {
  const profile_url = normalizeUrl(input.profile_url);
  const platform = detectPlatform(profile_url);
  let updated: IChannel | null = null;
  CHANNELS = CHANNELS.map((c) => {
    if (c.id !== input.id) return c;
    updated = {
      ...c,
      profile_url,
      platform,
      handle: extractHandle(profile_url, platform),
      name: input.name.trim() || c.name,
    };
    return updated;
  });
  return updated;
};

export const deleteChannels = (ids: readonly string[]): { deleted: number } => {
  const kill = new Set(ids);
  const before = CHANNELS.length;
  CHANNELS = CHANNELS.filter((c) => !kill.has(c.id));
  return { deleted: before - CHANNELS.length };
};

// ─── Buckets ─────────────────────────────────────────────────────────────────
// Which keyword buckets each channel feeds, for a given newsletter — the web's "Show buckets
// for:" selector. Deterministic: 0–2 of the chosen newsletter's buckets per channel.
export const getChannelBuckets = (newsletterId: string): Record<string, string[]> => {
  const newsletter = NEWSLETTERS.find((n) => n.id === newsletterId);
  if (!newsletter) return {};
  const map: Record<string, string[]> = {};
  for (const c of CHANNELS) {
    const rand = rngFor(`chn-bucket:${newsletterId}:${c.id}`);
    const count = intBetween(rand, 0, 2);
    if (count === 0) continue;
    const picked = new Set<string>();
    for (let i = 0; i < count; i++) picked.add(pick(rand, newsletter.buckets).name);
    map[c.id] = [...picked];
  }
  return map;
};
