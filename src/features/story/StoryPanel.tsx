import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { AlignmentQuadrant } from '@/components/charts/AlignmentQuadrant';
import { BarList } from '@/components/charts/BarList';
import { EmotionRadar } from '@/components/charts/EmotionRadar';
import { HourByHour } from '@/components/charts/HourByHour';
import { ToneBar } from '@/components/charts/ToneBar';
import { Divider } from '@/components/ui/Card';
import { Chip, Pill, SegmentedControl } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { compact, withCommas } from '@/lib/format';
import { colors, mediumColor, sentiment } from '@/theme/tokens';
import type { IStoryComment, IStoryDetail, ToneKey } from '@/types';

// The Story page's "Charts and comments" panel — the mobile take on the web's story-page
// side drawer. Three tabs: Charts (the active lens's chart cards), Comments (filterable,
// with source posts), and a chat-styled AI Assistant placeholder.

type StoryLens = 'narrative' | 'coverage' | 'social';
export type PanelTab = 'charts' | 'comments' | 'chat';
type Reading = 'objective' | 'persona';

const TONE: Record<ToneKey, 'positive' | 'neutral' | 'negative'> = {
  positive: 'positive',
  neutral: 'neutral',
  negative: 'negative',
};

function PanelCard({
  title,
  note,
  action,
  children,
}: {
  title: string;
  note?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="rounded-card border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Txt weight="bold" className="text-[15px]">
          {title}
        </Txt>
        {action}
      </View>
      <View className="mt-3">{children}</View>
      {note ? <Txt className="mt-3 text-[11px] leading-5 text-ink-3">{note}</Txt> : null}
    </View>
  );
}

// ── Charts tab ────────────────────────────────────────────────────────────────

function ReadingToggle({ value, onChange }: { value: Reading; onChange: (r: Reading) => void }) {
  return (
    <View style={{ width: 164 }}>
      <SegmentedControl
        options={[
          { value: 'persona', label: 'Persona' },
          { value: 'objective', label: 'Objective' },
        ]}
        value={value}
        onChange={onChange}
      />
    </View>
  );
}

// Coverage "Snapshot" — the MediaWatch key figures as a tile grid. (The legacy AVE lines live on
// the Story page's always-visible Key numbers card, not here.)
function SnapshotGrid({ story }: { story: IStoryDetail }) {
  const tiles = [
    { label: 'Articles', value: String(story.articles) },
    { label: 'Story value', value: story.storyValue > 0 ? `${story.storyValue}/10` : '—' },
    { label: 'Main focus', value: `${story.mainFocus} of ${story.articles}` },
    { label: 'Negative tone', value: `${story.negativeTone}%` },
  ];
  return (
    <View className="flex-row flex-wrap">
      {tiles.map((t) => (
        <View key={t.label} className="w-1/2 pb-2 pr-2">
          <Txt mono className="text-[9px] uppercase tracking-wide text-ink-3">
            {t.label}
          </Txt>
          <Txt weight="bold" className="mt-0.5 text-[18px]">
            {t.value}
          </Txt>
        </View>
      ))}
    </View>
  );
}

// The Charts tab swaps its chart set by the active lens, mirroring the web: the panel
// shows the charts attached to the current lens's sections.
function ChartsTab({ story, section }: { story: IStoryDetail; section: StoryLens }) {
  const { sentiment: s, alignment, trust, social, hourly, coverage } = story;
  const [reading, setReading] = useState<Reading>('objective');
  const tone = reading === 'persona' ? s.personaTone : s.tone;
  const platforms = social.platforms.filter((p) => p.available);

  const hourCard = (
    <PanelCard title="Hour by hour" action={<Pill label={section === 'social' ? 'Scoup' : 'Both'} />}>
      <HourByHour
        days={hourly}
        lens={section}
        undatedArticles={story.undatedArticles}
        undatedPosts={story.undatedPosts}
      />
    </PanelCard>
  );
  const sentimentTotal = tone.negative.count + tone.neutral.count + tone.positive.count;
  const sentimentCard = (
    <PanelCard
      title="Comment sentiment"
      note={s.read}
      action={<ReadingToggle value={reading} onChange={setReading} />}>
      <ToneBar positive={tone.positive} neutral={tone.neutral} negative={tone.negative} />
      {/* Web parity: a negative-alert banner fires at ≥70% negative. */}
      {tone.negative.pct >= 70 ? (
        <View className="mt-3 rounded-lg px-3 py-2" style={{ backgroundColor: '#fee9e7' }}>
          <Txt className="text-[12px] leading-[16px]" style={{ color: '#c00f0c' }}>
            <Txt weight="bold" className="text-[12px]" style={{ color: '#c00f0c' }}>
              Overwhelmingly negative.
            </Txt>{' '}
            {Math.round(tone.negative.pct)}% of {withCommas(sentimentTotal)} sampled comments,{' '}
            {reading === 'objective' ? 'objective' : 'persona-aligned'} reading.
          </Txt>
        </View>
      ) : null}
    </PanelCard>
  );
  const emotionsCard = (
    <PanelCard title="Emotions" note={s.emotionNote}>
      <EmotionRadar items={s.emotions} />
    </PanelCard>
  );
  const alignmentCard = (
    <PanelCard title="Audience alignment">
      <AlignmentQuadrant alignment={alignment} />
    </PanelCard>
  );
  const trustCard = (
    <PanelCard title="Trust by role">
      <BarList
        items={trust.map((t) => ({ label: t.role, value: t.trust }))}
        format={(v) => `${v}%`}
        colorFor={() => sentiment.positive}
        valueWidth="w-12"
      />
    </PanelCard>
  );
  const platformsCard = (title: string) => (
    <PanelCard title={title}>
      <BarList
        items={platforms.map((p) => ({ label: p.name, value: p.postCount }))}
        format={compact}
        colorFor={() => colors.ink3}
        valueWidth="w-12"
      />
    </PanelCard>
  );

  if (section === 'coverage') {
    return (
      <View className="gap-3">
        {hourCard}
        <PanelCard title="Snapshot">
          <SnapshotGrid story={story} />
        </PanelCard>
        <PanelCard title="Articles by medium">
          <BarList
            items={coverage.byMedium.map((m) => ({ label: m.medium, value: m.count }))}
            format={(v) => String(v)}
            colorFor={(l) => mediumColor[l] ?? colors.ink3}
            valueWidth="w-10"
          />
        </PanelCard>
        <PanelCard title="Keyword hits">
          <BarList
            items={coverage.keywords.map((k) => ({ label: k.keyword, value: k.count }))}
            format={(v) => String(v)}
            colorFor={() => colors.ink3}
            valueWidth="w-10"
          />
        </PanelCard>
      </View>
    );
  }

  if (section === 'social') {
    return (
      <View className="gap-3">
        {hourCard}
        {sentimentCard}
        {emotionsCard}
        {alignmentCard}
        {platformsCard('Platform engagement')}
        {trustCard}
      </View>
    );
  }

  // narrative (ALL)
  return (
    <View className="gap-3">
      {hourCard}
      {sentimentCard}
      {emotionsCard}
      {alignmentCard}
      {trustCard}
      {platformsCard('Platforms')}
    </View>
  );
}

// ── Comments tab ──────────────────────────────────────────────────────────────

function CommentRow({ comment }: { comment: IStoryComment }) {
  return (
    <View className="py-3">
      <Txt className="text-[14px] leading-snug text-ink">{comment.text}</Txt>
      <View className="mt-1.5 flex-row flex-wrap items-center gap-x-2.5 gap-y-1">
        <Pill label={comment.sentiment} tone={TONE[comment.sentiment]} />
        <Txt className="text-[11px] text-ink-3">{comment.emotion}</Txt>
        <Txt mono className="text-[11px] text-ink-3">♥ {compact(comment.likes)}</Txt>
        <Txt mono className="text-[11px] text-ink-3">💬 {compact(comment.replies)}</Txt>
        <Txt mono className="text-[11px] text-ink-3">↗ {compact(comment.shares)}</Txt>
      </View>
      <View className="mt-1.5 flex-row items-center">
        <Txt className="text-[11px] text-ink-3">On </Txt>
        <Txt className="flex-1 text-[11px]" numberOfLines={1} style={{ color: colors.link }}>
          {comment.postTitle}
        </Txt>
        <Txt className="ml-2 text-[11px] text-ink-3">· {comment.platform}</Txt>
      </View>
    </View>
  );
}

const TONE_FILTERS: { value: 'all' | ToneKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'negative', label: 'Negative' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'positive', label: 'Positive' },
];

function CommentsTab({ story }: { story: IStoryDetail }) {
  const [reading, setReading] = useState<Reading>('objective');
  const [tone, setTone] = useState<'all' | ToneKey>('all');
  const [platform, setPlatform] = useState<string>('all');
  const comments = story.social.comments;
  const platformNames = Array.from(new Set(comments.map((c) => c.platform)));

  const countFor = (pf: string): number =>
    pf === 'all' ? comments.length : comments.filter((c) => c.platform === pf).length;
  const toneCount = (t: 'all' | ToneKey): number =>
    t === 'all' ? comments.length : comments.filter((c) => c.sentiment === t).length;

  const filtered = comments.filter(
    (c) =>
      (tone === 'all' || c.sentiment === tone) && (platform === 'all' || c.platform === platform),
  );

  return (
    <View>
      <View className="flex-row items-start">
        <Txt className="flex-1 text-[12px] leading-5 text-ink-3">
          Top comments on the most-engaged posts, most liked first. The story has{' '}
          <Txt weight="semibold" className="text-[12px] text-ink">
            {withCommas(story.comments)}
          </Txt>{' '}
          comments in all.
        </Txt>
        <View className="ml-2 mt-0.5">
          <Pill label="Scoup" tone="brand" />
        </View>
      </View>

      <View className="mt-3 flex-row items-center">
        <Txt className="mr-2 text-[11px] text-ink-3">Reading</Txt>
        <ReadingToggle value={reading} onChange={setReading} />
      </View>

      {/* Platform filter */}
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Chip
          label={`All platforms ${countFor('all')}`}
          active={platform === 'all'}
          onPress={() => setPlatform('all')}
        />
        {platformNames.map((p) => (
          <Chip key={p} label={`${p} ${countFor(p)}`} active={platform === p} onPress={() => setPlatform(p)} />
        ))}
      </View>
      {/* Tone filter */}
      <View className="mt-2 flex-row flex-wrap gap-2">
        {TONE_FILTERS.map((t) => (
          <Chip
            key={t.value}
            label={`${t.label} ${toneCount(t.value)}`}
            active={tone === t.value}
            onPress={() => setTone(t.value)}
          />
        ))}
      </View>

      <View className="mt-3">
        {filtered.length ? (
          filtered.map((c, i) => (
            <View key={c.id}>
              {i > 0 ? <Divider /> : null}
              <CommentRow comment={c} />
            </View>
          ))
        ) : (
          <Txt className="py-6 text-center text-[13px] text-ink-3">No comments match this filter.</Txt>
        )}
      </View>
    </View>
  );
}

// ── AI Assistant tab ──────────────────────────────────────────────────────────

function ChatTab({ story }: { story: IStoryDetail }) {
  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Txt weight="semibold" className="flex-1 text-[13px]" numberOfLines={1}>
          {story.title}
        </Txt>
        <Txt className="ml-3 text-[12px] text-ink-3">+ New chat</Txt>
        <Txt className="ml-3 text-[12px] text-ink-3">History</Txt>
      </View>
      <View className="mt-10 items-center px-6">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-surface3">
          <Txt weight="bold" className="text-[16px]">
            ✦
          </Txt>
        </View>
        <Txt weight="bold" className="mt-3 text-center text-[15px]">
          Ask Scoup about this story
        </Txt>
        <Txt className="mt-1.5 text-center text-[13px] text-ink-3">
          Chat about the coverage, the comments, and what to do next. Connecting the assistant is next.
        </Txt>
      </View>
      <View className="mt-8 flex-row items-center rounded-full border border-border bg-surface px-4 py-3 opacity-60">
        <Txt className="flex-1 text-[13px] text-ink-3">Message the assistant…</Txt>
        <Txt className="text-[15px] text-ink-3">→</Txt>
      </View>
    </View>
  );
}

// ── Panel shell ───────────────────────────────────────────────────────────────

export function StoryPanel({
  story,
  section,
  tab: controlledTab,
  onTabChange,
}: {
  story: IStoryDetail;
  section: StoryLens;
  tab?: PanelTab;
  onTabChange?: (t: PanelTab) => void;
}) {
  const [innerTab, setInnerTab] = useState<PanelTab>('charts');
  const tab = controlledTab ?? innerTab;
  const setTab = onTabChange ?? setInnerTab;
  const chartCount = section === 'coverage' ? 4 : 6;

  // Web parity: the Coverage lens has no comments tab (StoryChartsDrawer omits it for `mw`).
  const showComments = section !== 'coverage';
  const effectiveTab: PanelTab = tab === 'comments' && !showComments ? 'charts' : tab;

  return (
    <View className="gap-3 px-4 pb-12 pt-2">
      <SegmentedControl
        options={[
          { value: 'charts', label: 'Charts', count: chartCount },
          ...(showComments
            ? [{ value: 'comments' as const, label: 'Comments', count: story.social.comments.length }]
            : []),
          { value: 'chat', label: 'AI Assistant' },
        ]}
        value={effectiveTab}
        onChange={setTab}
      />
      {effectiveTab === 'charts' ? (
        <ChartsTab story={story} section={section} />
      ) : effectiveTab === 'comments' ? (
        <CommentsTab story={story} />
      ) : (
        <ChatTab story={story} />
      )}
    </View>
  );
}
