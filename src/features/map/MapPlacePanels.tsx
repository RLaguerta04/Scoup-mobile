import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { Pill, SegmentedControl, type PillTone, type SegOption } from '@/components/ui/controls';
import { compact } from '@/lib/format';
import { choroplethFor, colors, sentiment as toneColor } from '@/theme/tokens';
import type { IMapPage, IMapPlaceDetail, MapStance, MapTone } from '@/types';

// The four web "Local" panels (Sentiment · Most posts · Facebook pages · Top posts) + a
// place-profile header, scoped to the selected city. Layout mirrors the web's MonitorRail.

const TONE_LABEL: Record<MapTone, { label: string; tone: PillTone }> = {
  pos: { label: 'Positive', tone: 'positive' },
  neu: { label: 'Neutral', tone: 'neutral' },
  neg: { label: 'Negative', tone: 'negative' },
};
const STANCE: Record<MapStance, { label: string; tone: PillTone }> = {
  ally: { label: 'Ally', tone: 'positive' },
  neutral: { label: 'Neutral', tone: 'neutral' },
  critic: { label: 'Critic', tone: 'negative' },
};

// Soft-tinted avatars, color picked deterministically from the name (like the web's page chips).
const AVATAR_COLORS = [
  { bg: '#fdefd4', fg: '#9a6413' },
  { bg: '#e3edf9', fg: '#2f5b96' },
  { bg: '#e4f0ea', fg: '#0a7a52' },
  { bg: '#fbe6dc', fg: '#b24a14' },
  { bg: '#f1e4f7', fg: '#7a3a9a' },
  { bg: '#fde3ea', fg: '#a8144a' },
];
const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
const avatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
function Avatar({ name }: { name: string }) {
  const c = avatarColor(name);
  return (
    <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: c.bg }}>
      <Txt weight="bold" className="text-[11px]" style={{ color: c.fg }}>
        {initials(name)}
      </Txt>
    </View>
  );
}

function Divider({ first }: { first: boolean }) {
  return first ? null : <View className="my-3 h-px bg-border" />;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-lg border border-border bg-surface px-3 py-2">
      <Txt mono weight="bold" className="text-[15px]">
        {value}
      </Txt>
      <Txt className="text-[10px] uppercase tracking-wider text-ink-3">{label}</Txt>
    </View>
  );
}

function CountChip({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-border bg-surface px-2.5 py-1">
      <Txt mono className="text-[11px] text-ink-2">
        {label}
      </Txt>
    </View>
  );
}

function Metric({
  Icon,
  value,
}: {
  Icon: typeof Heart;
  value: number;
}) {
  return (
    <View className="mr-4 flex-row items-center">
      <Icon size={13} color={colors.ink3} />
      <Txt mono className="ml-1 text-[11px] text-ink-2">
        {compact(value)}
      </Txt>
    </View>
  );
}

// Positive → Neutral → Negative, matching the web's order (green left, red right) + square swatches.
function SentimentBar({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) {
  const seg = [
    { color: toneColor.positive, label: 'Positive', pct: positive },
    { color: toneColor.neutral, label: 'Neutral', pct: neutral },
    { color: toneColor.negative, label: 'Negative', pct: negative },
  ];
  return (
    <View>
      <View className="h-2 flex-row overflow-hidden rounded-full">
        {seg.map((s) => (
          <View key={s.label} style={{ flex: Math.max(s.pct, 0.01), backgroundColor: s.color }} />
        ))}
      </View>
      <View className="mt-2.5 flex-row flex-wrap gap-x-4 gap-y-1">
        {seg.map((s) => (
          <View key={s.label} className="flex-row items-center">
            <View className="mr-1.5 h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: s.color }} />
            <Txt className="text-[12px] text-ink-2">{s.label} </Txt>
            <Txt weight="semibold" className="text-[12px] text-ink">
              {s.pct}%
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

function PageRow({ page }: { page: IMapPage }) {
  const s = STANCE[page.stance];
  return (
    <View className="flex-row">
      <Avatar name={page.name} />
      <View className="ml-3 flex-1">
        <View className="flex-row items-start">
          <Txt weight="semibold" className="flex-1 text-[13px]" numberOfLines={2}>
            {page.name}
          </Txt>
          <View className="ml-2 items-end">
            <Pill label={s.label} tone={s.tone} />
            {page.official && <Txt className="mt-0.5 text-[10px] text-ink-3">official</Txt>}
          </View>
        </View>
        <Txt className="mt-0.5 text-[11px] text-ink-3">
          {page.kind === 'page' ? 'Facebook page' : 'Facebook group'} · {compact(page.followers)}{' '}
          followers
        </Txt>
        <View className="mt-1.5 flex-row gap-2">
          <CountChip label={`${page.posts} posts`} />
          <CountChip label={`${compact(page.comments)} comments`} />
        </View>
      </View>
    </View>
  );
}

function PagesCard({ pages, place }: { pages: IMapPage[]; place: string }) {
  const [tab, setTab] = useState<'all' | MapStance>('all');
  const counts = useMemo(
    () => ({
      all: pages.length,
      ally: pages.filter((p) => p.stance === 'ally').length,
      neutral: pages.filter((p) => p.stance === 'neutral').length,
      critic: pages.filter((p) => p.stance === 'critic').length,
    }),
    [pages],
  );
  const tabs: SegOption<'all' | MapStance>[] = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'ally', label: 'Allies', count: counts.ally },
    { value: 'neutral', label: 'Neutral', count: counts.neutral },
    { value: 'critic', label: 'Critics', count: counts.critic },
  ];
  const shown = tab === 'all' ? pages : pages.filter((p) => p.stance === tab);
  return (
    <Card>
      <Label>Facebook pages and groups · {place}</Label>
      <View className="mt-3">
        <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      </View>
      <View className="mt-3">
        {shown.length === 0 ? (
          <Txt className="text-[12px] text-ink-3">No pages in this group.</Txt>
        ) : (
          shown.map((p, i) => (
            <View key={p.id}>
              <Divider first={i === 0} />
              <PageRow page={p} />
            </View>
          ))
        )}
      </View>
    </Card>
  );
}

export function MapPlacePanels({ detail }: { detail: IMapPlaceDetail }) {
  const { profile, sentiment, mostPosts, pages, posts } = detail;

  return (
    <View className="gap-3 px-4 pb-14 pt-1">
      {/* Place profile header */}
      <View>
        <Txt weight="extrabold" className="text-[22px]">
          {profile.name}
        </Txt>
        <Txt className="text-[12px] text-ink-3">{profile.district}</Txt>
        <View className="mt-3 flex-row gap-2">
          <StatTile label="Posts" value={compact(profile.posts)} />
          <StatTile label="Engagements" value={compact(profile.engagements)} />
          <StatTile label="Comments" value={compact(profile.comments)} />
        </View>
      </View>

      {/* Sentiment */}
      <Card>
        <Label>Sentiment · {profile.name}</Label>
        <Txt weight="extrabold" className="mt-2 text-[20px]">
          {sentiment.emotion}
        </Txt>
        <Txt className="text-[12px] text-ink-3">
          most common emotion in {sentiment.comments} comments on {sentiment.analysed} posts
        </Txt>
        <View className="mt-3">
          <SentimentBar
            positive={sentiment.positive}
            neutral={sentiment.neutral}
            negative={sentiment.negative}
          />
        </View>
      </Card>

      {/* Most posts — ranked cities */}
      <Card>
        <Label>Most posts · Last 7 days</Label>
        <View className="mt-2">
          {mostPosts.map((p, i) => (
            <View key={p.code}>
              <Divider first={i === 0} />
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <Txt mono className="w-5 text-[12px] text-ink-3">
                    {i + 1}
                  </Txt>
                  <View className="flex-1">
                    <Txt weight="semibold" className="text-[13px]" numberOfLines={1}>
                      {p.name}
                    </Txt>
                    <Txt className="text-[11px] text-ink-3">{p.district}</Txt>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Txt mono weight="bold" className="mr-2 text-[13px]">
                    {p.posts}
                  </Txt>
                  <View
                    className="h-3 w-3 rounded-[2px]"
                    style={{ backgroundColor: choroplethFor(p.posts) }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Facebook pages and groups */}
      <PagesCard pages={pages} place={profile.name} />

      {/* Top posts */}
      <Card>
        <Label>Top posts · {profile.name}</Label>
        <View className="mt-2">
          {posts.map((p, i) => {
            const t = TONE_LABEL[p.tone];
            return (
              <View key={p.id}>
                <Divider first={i === 0} />
                <View className="flex-row">
                  <Avatar name={p.author} />
                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center">
                      <Txt weight="semibold" className="shrink text-[13px]" numberOfLines={1}>
                        {p.author}
                      </Txt>
                      <View className="ml-1.5">
                        <Pill label={p.kind === 'page' ? 'Page' : 'Group'} tone="default" />
                      </View>
                      <View className="flex-1" />
                      <Txt className="text-[11px] text-ink-3">{p.hoursAgo}h</Txt>
                    </View>
                    <Txt className="mt-1 text-[13px] text-ink-2">{p.text}</Txt>
                    <View className="mt-2 flex-row items-center">
                      <Metric Icon={Heart} value={p.reactions} />
                      <Metric Icon={MessageCircle} value={p.comments} />
                      <Metric Icon={Share2} value={p.shares} />
                    </View>
                    <View className="mt-2">
                      <Pill label={t.label} tone={t.tone} />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
