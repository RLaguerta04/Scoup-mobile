import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandX,
  IconBrandYoutube,
} from '@tabler/icons-react-native';
import { Label, Txt } from '@/components/ui/Txt';
import { compact } from '@/lib/format';
import { colors, tone } from '@/theme/tokens';
import type { ComponentType } from 'react';
import type { IArticleItem, IPostItem, IStoryCard, Lens, RankBy, ToneKey } from '@/types';

function Dot() {
  return (
    <Txt className="text-[12px] text-ink-3" style={{ marginHorizontal: 7 }}>
      ·
    </Txt>
  );
}

const TONE_LABEL: Record<ToneKey, string> = {
  positive: 'Positive',
  negative: 'Negative',
  neutral: 'Neutral',
};
const TONE_DOT: Record<ToneKey, string> = {
  positive: tone.positive,
  negative: tone.negative,
  neutral: colors.ink3,
};

// A small coloured-dot tone marker (lighter than a filled pill, fits the editorial row).
function Tone({ t }: { t: ToneKey }) {
  return (
    <View className="flex-row items-center gap-1">
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: TONE_DOT[t] }} />
      <Txt className="text-[11px] text-ink-3">{TONE_LABEL[t]}</Txt>
    </View>
  );
}

type IconComp = ComponentType<{ size?: number; color?: string }>;
// Platform badges matching the web's PlatformIcon: a brand-coloured circle with a white
// glyph (codes from entities.PLATFORMS). `bg` is the circle fill.
const PLATFORM_ICON: Record<string, { Comp: IconComp; bg: string }> = {
  FACEBOOK: { Comp: IconBrandFacebook, bg: '#1877F2' },
  TWITTER: { Comp: IconBrandX, bg: '#000000' },
  INSTAGRAM: { Comp: IconBrandInstagram, bg: '#E4405F' },
  TIKTOK: { Comp: IconBrandTiktok, bg: '#000000' },
  YOUTUBE: { Comp: IconBrandYoutube, bg: '#FF0000' },
};

// A filled brand circle with a white glyph (the web's badge style).
function PlatformBadge({ platform }: { platform: string }) {
  const brand = PLATFORM_ICON[platform];
  if (!brand) return null;
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: 20, height: 20, backgroundColor: brand.bg }}>
      <brand.Comp size={13} color="#ffffff" />
    </View>
  );
}

// Bind the last two words with a non-breaking space so a two-line headline never drops a single
// word onto its own line (no widow). Works on web and native Fabric; CSS text-wrap:pretty doesn't.
const noWidow = (s: string) => s.replace(/\s+(\S+)\s*$/, ' $1');

// Daily-feed story card (web: StoryCardFeed). Headline + an optional "ranked last" badge +
// bucket tag + summary + the figure row (articles / posts / score / comments). Tapping the card
// opens the Story page; the legacy AVE lines live there (in the Snapshot), not on the feed card.
export function StoryCardView({
  story,
  lens,
  rankBy,
}: {
  story: IStoryCard;
  lens: Lens;
  rankBy: RankBy;
}) {
  const router = useRouter();

  const hasPress = lens !== 'sv';
  const hasSocial = lens !== 'mw';
  // "No press/social data · ranked last" when the story has nothing for the active Rank-by.
  const socialValue = rankBy === 'posts' ? story.posts : rankBy === 'comments' ? story.comments : story.engScore;
  const missing =
    rankBy === 'articles'
      ? story.articles === 0
        ? 'No press data · ranked last'
        : null
      : socialValue === 0
        ? 'No social data · ranked last'
        : null;

  const figures: { key: string; value: string; label: string }[] = [
    ...(hasPress ? [{ key: 'articles', value: compact(story.articles), label: story.articles === 1 ? 'article' : 'articles' }] : []),
    ...(hasSocial
      ? [
          // Labels trimmed for the mobile row ("social posts"→"posts", the long score label→"score")
          // so the figures fit one line; the full wording lives on the Story page.
          { key: 'posts', value: compact(story.posts), label: story.posts === 1 ? 'post' : 'posts' },
          { key: 'score', value: compact(story.engScore), label: 'score' },
          { key: 'comments', value: compact(story.comments), label: story.comments === 1 ? 'comment' : 'comments' },
        ]
      : []),
  ];

  return (
    <View className="px-4 py-4">
      <Pressable
        onPress={() => router.push({ pathname: '/story/[id]', params: { id: story.id } })}
        accessibilityRole="button"
        accessibilityLabel={story.title}
        className="flex-row active:opacity-70"
        style={{ gap: 10 }}>
        <View className="min-w-0 flex-1">
          <Txt weight="bold" className="text-[16px] leading-[21px]" numberOfLines={2}>
            {noWidow(story.title)}
          </Txt>
          {missing && (
            <View className="mt-1.5 self-start rounded-md border border-dashed border-border px-2 py-0.5">
              <Txt mono className="text-[9.5px] uppercase tracking-wide text-ink-3">{missing}</Txt>
            </View>
          )}
          {!!story.bucketName && (
            <View className="mt-1.5 self-start rounded-md bg-surface2 px-2 py-0.5">
              <Txt mono weight="semibold" className="text-[10px] uppercase tracking-wide text-ink-2">{story.bucketName}</Txt>
            </View>
          )}
          <Txt className="mt-1.5 text-[13px] leading-[18px] text-ink-3" numberOfLines={2}>
            {story.summary}
          </Txt>
        </View>
        <View className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-surface3">
          <Image source={story.thumbnailUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={250} />
        </View>
      </Pressable>

      {/* Figure row — ONE Text block so it word-wraps within the card on both web and native (a
          flex-wrap row can overflow/clip on native Fabric). A non-breaking space binds each value to
          its label, so a label never orphans onto its own line; lines break only at the gaps. */}
      <Txt className="mt-2.5 text-[12px] leading-[17px] text-ink-3">
        {figures.map((f, i) => (
          <Txt key={f.key}>
            {i > 0 ? '     ' : ''}
            <Txt weight="bold" className="text-[13px] text-ink">{f.value}</Txt>
            {` ${f.label}`}
          </Txt>
        ))}
      </Txt>
    </View>
  );
}

// Posts feed — borderless editorial row (same shell as Stories). Account + platform icon
// kicker, the post text leads, then the linked story. The whole row opens the story.
export function PostCardView({ post }: { post: IPostItem }) {
  const router = useRouter();
  const open = () =>
    post.storyId && router.push({ pathname: '/story/[id]', params: { id: post.storyId } });
  return (
    <Pressable onPress={open} className="px-4 py-4 active:bg-surface2">
      <View className="flex-row items-center">
        <PlatformBadge platform={post.platform} />
        <Txt weight="medium" className="ml-2 text-[12px] text-ink-2">
          {post.author}
        </Txt>
        <Dot />
        <Txt mono className="text-[12px] text-ink-3">
          {post.date}
        </Txt>
      </View>

      <View className="mt-1.5 flex-row items-center gap-3">
        <View className="flex-1">
          <Txt className="text-[14px] leading-[19px] text-ink" numberOfLines={3}>
            {post.text}
          </Txt>
        </View>
        {post.thumbnailUrl ? (
          <View className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-surface3">
            <Image
              source={post.thumbnailUrl}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={250}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// Articles feed — borderless editorial row. Publication kicker + tone, headline leads, then
// one muted meta line (emphasis · story value · published). The whole row opens the story.
export function ArticleCardView({ article }: { article: IArticleItem }) {
  const router = useRouter();
  const open = () =>
    article.storyId && router.push({ pathname: '/story/[id]', params: { id: article.storyId } });
  return (
    <Pressable onPress={open} className="px-4 py-4 active:bg-surface2">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1">
          <Label>
            {article.publication} · {article.medium}
          </Label>
        </View>
        <Tone t={article.sentiment} />
      </View>

      <View className="mt-1.5 flex-row gap-3">
        <View className="flex-1">
          <Txt weight="bold" className="text-[16px] leading-[21px]" numberOfLines={2}>
            {noWidow(article.title)}
          </Txt>
          <View className="mt-1.5 flex-row flex-wrap items-center">
            <Txt className="text-[12px] text-ink-3">{article.emphasis ?? '—'}</Txt>
            <Dot />
            <Txt className="text-[12px] text-ink-3">SV </Txt>
            <Txt weight="semibold" className="text-[12px] text-ink-2">
              {article.sv != null ? article.sv.toFixed(2) : '—'}
            </Txt>
            <Dot />
            <Txt mono className="text-[12px] text-ink-3">
              {article.date}
            </Txt>
          </View>
        </View>
        {article.thumbnailUrl ? (
          <View className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-surface3">
            <Image
              source={article.thumbnailUrl}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={250}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
