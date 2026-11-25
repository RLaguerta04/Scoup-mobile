import { useState, type ComponentType } from 'react';
import { Pressable, View } from 'react-native';
import {
  IconBrandFacebookFilled,
  IconBrandInstagramFilled,
  IconBrandReddit,
  IconBrandXFilled,
  IconBrandYoutubeFilled,
} from '@tabler/icons-react-native';
import { AlignmentQuadrant } from '@/components/charts/AlignmentQuadrant';
import { BarList } from '@/components/charts/BarList';
import { ToneBar } from '@/components/charts/ToneBar';
import { Divider } from '@/components/ui/Card';
import { Pill } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { CitedText, renderCited } from '@/features/story/CitedText';
import { compact } from '@/lib/format';
import { colors, emotionColor, sentiment } from '@/theme/tokens';
import type {
  IArticleItem,
  ICoverageAuthor,
  ICoverageClip,
  IKeyVoice,
  INarrativeSupport,
  IOutletCount,
  IPeriodTone,
  IPostItem,
  IStoryComment,
  IStoryDetail,
  IStoryFootnote,
} from '@/types';

// ─── Shared pieces ────────────────────────────────────────────────────────────

// Flat section: a bold title-case heading (the top of the hierarchy), the content,
// and a bottom hairline separator between sections.
function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <View className="border-b border-border" style={{ paddingVertical: 18 }}>
      <Txt weight="bold" className="text-[16px] leading-tight">
        {title}
      </Txt>
      <View style={{ marginTop: 10 }}>{children}</View>
      {note ? <Txt className="mt-3 text-[11px] text-ink-3">{note}</Txt> : null}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <Txt className="text-[14px] leading-relaxed text-ink-2">{children}</Txt>;
}

// Bold sub-heading inside a section (the web's <Heading>).
function Heading({ children }: { children: React.ReactNode }) {
  return <Txt weight="bold" className="mt-3 text-[13px]">{children}</Txt>;
}

function FieldBlock({ label, text }: { label: string; text: string }) {
  return (
    <View className="mt-3">
      <Txt mono weight="medium" className="text-[11px] uppercase tracking-wider text-ink-3">
        {label}
      </Txt>
      <Txt className="mt-1 text-[14px] leading-relaxed text-ink-2">{text}</Txt>
    </View>
  );
}

// A bordered callout with an inline bold title (Relevance / Engagement mix). When `footnotes`
// is passed, `[^n]` markers in the text become tappable citation chips.
function Callout({
  title,
  text,
  footnotes,
  className,
}: {
  title: string;
  text: string;
  footnotes?: IStoryFootnote[];
  className?: string;
}) {
  return (
    <View className={`mt-3 rounded-xl border border-border bg-surface p-3 ${className ?? ''}`}>
      <Txt className="text-[12.5px] leading-snug text-ink-2">
        <Txt weight="bold" className="text-[12.5px] text-ink">
          {title}{' '}
        </Txt>
        {footnotes ? renderCited(text, footnotes) : text}
      </Txt>
    </View>
  );
}

function MoreLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} className="mt-1.5 self-start">
      <Txt weight="medium" className="text-[13px]" style={{ color: colors.link }}>
        {label}
      </Txt>
    </Pressable>
  );
}

function WatchList({ items }: { items: string[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, 1);
  return (
    <View className="mt-1">
      {shown.map((it, i) => (
        <View key={i} className="flex-row">
          <Txt className="mr-1.5 text-[14px] text-ink-3">•</Txt>
          <Txt className="flex-1 text-[14px] leading-relaxed text-ink-2">{it}</Txt>
        </View>
      ))}
      {items.length > 1 && (
        <MoreLink
          label={all ? 'Show fewer' : `+ ${items.length - 1} more to watch`}
          onPress={() => setAll((v) => !v)}
        />
      )}
    </View>
  );
}

function ClippingChips({ items, missing = 0 }: { items: string[]; missing?: number }) {
  return (
    <View className="mt-3">
      <Txt mono className="text-[10px] uppercase tracking-wider text-ink-3">
        Cited clippings · {items.length}
      </Txt>
      <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
        {items.map((c) => (
          <View key={c} className="rounded-full bg-surface3 px-2.5 py-1">
            <Txt className="text-[11px] text-ink-2">{c}</Txt>
          </View>
        ))}
        {missing > 0 ? (
          <Txt className="text-[11px] text-ink-3">{missing} not in this capture</Txt>
        ) : null}
      </View>
    </View>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Txt mono className="text-[10px] uppercase tracking-wider text-ink-3">
        {label}
      </Txt>
      <Txt weight="bold" className="mt-0.5 text-[16px]">
        {value}
      </Txt>
    </View>
  );
}

const TONE: Record<string, 'positive' | 'neutral' | 'negative'> = {
  positive: 'positive',
  neutral: 'neutral',
  negative: 'negative',
};

function CommentRow({ comment }: { comment: IStoryComment }) {
  return (
    <View className="py-2.5">
      <View className="flex-row items-center">
        <Pill label={comment.sentiment} tone={TONE[comment.sentiment]} />
        <Txt className="ml-2 text-[11px] text-ink-3">{comment.emotion}</Txt>
        <Txt mono className="ml-auto text-[11px] text-ink-3">
          ♥ {compact(comment.likes)}
        </Txt>
      </View>
      <Txt className="mt-1.5 text-[14px] leading-snug text-ink">{comment.text}</Txt>
      <Txt className="mt-1 text-[11px] text-ink-3">
        {comment.author} · {comment.platform}
      </Txt>
    </View>
  );
}

function PostRow({ post }: { post: IPostItem }) {
  return (
    <View className="py-2.5">
      <View className="flex-row items-center justify-between">
        <Txt weight="semibold" className="text-[13px]">
          {post.author}
        </Txt>
        <Txt mono className="text-[11px] text-ink-3">
          {post.date}
        </Txt>
      </View>
      <Txt className="mt-1.5 text-[14px] leading-snug text-ink-2">{post.text}</Txt>
      <View className="mt-2 flex-row gap-5">
        <Metric label="likes" value={compact(post.likes)} />
        <Metric label="comments" value={compact(post.comments)} />
        <Metric label="shares" value={compact(post.shares)} />
      </View>
    </View>
  );
}

function ArticleRow({ article }: { article: IArticleItem }) {
  return (
    <View className="py-2.5">
      <Txt weight="semibold" className="text-[14px] leading-snug">
        {article.title}
      </Txt>
      <View className="mt-1 flex-row items-center">
        <Txt className="flex-1 text-[12px] text-ink-3" numberOfLines={1}>
          {article.publication}
        </Txt>
        <Txt mono className="ml-2 text-[11px] text-ink-3">
          {article.date}
        </Txt>
      </View>
      <View className="mt-1.5 flex-row items-center gap-2">
        <Pill label={article.sentiment} tone={TONE[article.sentiment]} />
        {article.searchVisits != null ? (
          <Txt mono className="text-[11px] text-ink-3">
            {compact(article.searchVisits)} est. visits
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Txt weight="semibold" className="text-[13px]">
        {value}
      </Txt>
      <Txt className="text-[10px] text-ink-3">{label}</Txt>
    </View>
  );
}

function Rows({ children }: { children: React.ReactNode[] }) {
  return (
    <View>
      {children.map((row, i) => (
        <View key={i}>
          {i > 0 ? <Divider /> : null}
          {row}
        </View>
      ))}
    </View>
  );
}

// ─── Narrative tab ────────────────────────────────────────────────────────────

// Footer under a narrative section: leading emotion, comment tone, and top accounts.
function SupportRow({ support }: { support: INarrativeSupport }) {
  return (
    <View className="mt-3 flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
      <View className="flex-row items-center">
        <View
          className="mr-1.5 h-2 w-2 rounded-full"
          style={{ backgroundColor: emotionColor[support.emotion] ?? colors.ink3 }}
        />
        <Txt className="text-[11px] text-ink-3">
          {support.emotion} leads · {support.emotionPct}%
        </Txt>
      </View>
      <Pill label={`${support.tone} ${support.tonePct}%`} tone={TONE[support.tone]} />
      <Txt className="flex-1 text-[11px] text-ink-3" numberOfLines={1}>
        Top: {support.topAccounts.join(', ')}
      </Txt>
    </View>
  );
}

function ExecTile({ label, text }: { label: string; text: string }) {
  return (
    <View className="rounded-xl border border-border bg-surface p-3">
      <Txt mono weight="medium" className="text-[10px] uppercase tracking-wider text-ink-3">
        {label}
      </Txt>
      <Txt className="mt-1 text-[13px] leading-snug text-ink-2">{text}</Txt>
    </View>
  );
}

// First paragraph shown; the rest sit behind "Read the rest" (the web's HalfText).
// Prose runs through CitedText so `[^n]` markers render as tappable citation chips.
function HalfText({ paras, footnotes }: { paras: string[]; footnotes: IStoryFootnote[] }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="gap-2">
      {(open ? paras : paras.slice(0, 1)).map((p, i) => (
        <CitedText key={i} text={p} footnotes={footnotes} />
      ))}
      {paras.length > 1 ? (
        <MoreLink label={open ? 'Show less' : '+ Read the rest'} onPress={() => setOpen((v) => !v)} />
      ) : null}
    </View>
  );
}

// The web's yellow "Suggested action" strip.
function SuggestedAction({ type, text }: { type: string; text: string }) {
  return (
    <View className="mt-3 rounded-md px-3 py-2.5" style={{ backgroundColor: '#fdf3d4' }}>
      <Txt mono weight="semibold" className="text-[10px] uppercase tracking-wide" style={{ color: '#9a6413' }}>
        Suggested action · {type}
      </Txt>
      <Txt className="mt-1 text-[13px] leading-snug text-ink-2">{text}</Txt>
    </View>
  );
}

function Expandable({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="mt-1">
      <MoreLink label={open ? 'Show less' : `+ ${label}`} onPress={() => setOpen((v) => !v)} />
      {open ? <View className="mt-2">{children}</View> : null}
    </View>
  );
}

function EngagedPost({ post }: { post: IPostItem }) {
  return (
    <View className="mt-2 rounded-xl border border-border bg-surface p-3">
      <Txt weight="semibold" className="text-[13.5px] leading-snug">
        {post.text}
      </Txt>
      <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <Txt className="text-[11px] text-ink-3">
          {post.author} · {post.date}
        </Txt>
        <Txt className="text-[11px] text-ink-3">👍 {compact(post.likes)}</Txt>
        <Txt className="text-[11px] text-ink-3">💬 {compact(post.comments)}</Txt>
        <Txt className="text-[11px] text-ink-3">↗ {compact(post.shares)}</Txt>
        <Txt className="text-[11px] text-ink-3">👁 {compact(post.views)}</Txt>
      </View>
    </View>
  );
}

function OpenTabButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mt-3 self-start rounded-full border border-border bg-surface px-3.5 py-2">
      <Txt mono weight="medium" className="text-[10px] uppercase tracking-wide text-ink-2">
        {label}
      </Txt>
    </Pressable>
  );
}

function AcrossBoth({
  story,
  onOpenTab,
}: {
  story: IStoryDetail;
  onOpenTab?: (s: 'coverage' | 'social') => void;
}) {
  return (
    <Section title="Across both platforms">
      <View className="gap-3">
        <View className="rounded-xl border border-border bg-surface p-3">
          <View className="flex-row flex-wrap items-baseline gap-x-2">
            <Txt weight="bold" className="text-[13px]">
              MediaWatch
            </Txt>
            <Txt className="text-[11px] text-ink-3">press, broadcast and online</Txt>
          </View>
          <View className="mt-2.5 flex-row justify-between">
            <Figure label="Articles" value={String(story.articles)} />
            <Figure
              label="Average Story Value, out of 10"
              value={story.storyValue > 0 ? story.storyValue.toFixed(1) : '—'}
            />
            <Figure label="Outlets" value={String(story.outlets)} />
          </View>
          {story.topOutlets.length > 0 ? (
            <Txt className="mt-2.5 text-[12px] text-ink-3">
              Most coverage: {story.topOutlets.map((o) => `${o.name} ${o.count}`).join(' · ')}.
            </Txt>
          ) : null}
          <OpenTabButton label="Open coverage" onPress={() => onOpenTab?.('coverage')} />
        </View>
        <View className="rounded-xl border border-border bg-surface p-3">
          <View className="flex-row flex-wrap items-baseline gap-x-2">
            <Txt weight="bold" className="text-[13px]">
              SharedView
            </Txt>
            <Txt className="text-[11px] text-ink-3">social</Txt>
          </View>
          <View className="mt-2.5 flex-row justify-between">
            <Figure label="Posts" value={compact(story.posts)} />
            <Figure label="Comments" value={compact(story.comments)} />
            <Figure label="Weighted engagement" value={compact(story.engScore)} />
          </View>
          <Txt className="mt-2.5 text-[12px] text-ink-3">
            Alignment: {story.alignment.withPct}% with the story.
          </Txt>
          <OpenTabButton label="Open social posts" onPress={() => onOpenTab?.('social')} />
        </View>
      </View>
    </Section>
  );
}

export function NarrativeTab({
  story,
  onOpenTab,
}: {
  story: IStoryDetail;
  onOpenTab?: (s: 'coverage' | 'social') => void;
}) {
  const { exec, narrative, sentiment: s, alignment, trust, trustSummary } = story;
  const topPosts = story.social.posts.slice(0, 3);
  return (
    <View>
      <Section title="Executive summary" note="Numbered markers open their sources.">
        <CitedText text={exec.summary} footnotes={story.footnotes} />
        <FieldBlock label="Why it matters to you" text={exec.whyItMatters} />
        <FieldBlock label="What's next" text={exec.whatsNext} />
        <View className="mt-3 gap-3">
          <ExecTile label="What happened" text={exec.whatHappened} />
          <ExecTile label="Impact" text={exec.impact} />
          <ExecTile label="Who" text={exec.who} />
        </View>
      </Section>

      {narrative.map((sec) => (
        <Section key={sec.key} title={sec.label}>
          <HalfText paras={sec.paras} footnotes={story.footnotes} />
          {sec.themes?.map((t) => (
            <View key={t.title} className="mt-3">
              <Heading>{t.title}</Heading>
              <CitedText
                text={t.text}
                footnotes={story.footnotes}
                className="mt-0.5 text-[14px] leading-relaxed text-ink-2"
              />
            </View>
          ))}
          {sec.recommendations?.length ? (
            <View className="mt-3">
              <Heading>Strategic Recommendations</Heading>
              {sec.recommendations.map((r, i) => (
                <View key={i} className="mt-2 flex-row">
                  <Txt weight="semibold" className="mr-2 text-[14px] text-ink-2">
                    {i + 1}.
                  </Txt>
                  <CitedText
                    text={r}
                    footnotes={story.footnotes}
                    className="flex-1 text-[14px] leading-relaxed text-ink-2"
                  />
                </View>
              ))}
            </View>
          ) : null}
          {sec.support ? <SupportRow support={sec.support} /> : null}
        </Section>
      ))}

      <Section title="Reactions and comments">
        <Para>{s.reactionsAnalysis}</Para>
        <Heading>Most-engaged posts</Heading>
        {topPosts.map((p) => (
          <EngagedPost key={p.id} post={p} />
        ))}
        <MoreLink
          label={`Read the ${story.social.comments.length} top comments  ›`}
          onPress={() => onOpenTab?.('social')}
        />
      </Section>

      <Section title="Audience alignment">
        <Para>{alignment.card}</Para>
        <SuggestedAction type={alignment.actionType} text={alignment.action} />
        <Expandable label="Where the positions sit">
          <AlignmentQuadrant alignment={alignment} />
          <Txt className="mt-3 text-[13px] leading-relaxed text-ink-2">{alignment.detail}</Txt>
        </Expandable>
      </Section>

      <Section title="Who commenters trust">
        <Para>{trustSummary.card}</Para>
        <SuggestedAction type={trustSummary.actionType} text={trustSummary.action} />
        <Expandable label="Quotes behind it">
          <Txt mono className="text-[10px] uppercase tracking-wider text-ink-3">
            Trusted
          </Txt>
          {trustSummary.trusted.map((q, i) => (
            <Txt key={i} className="mt-1 border-l-2 border-border pl-2.5 text-[13px] leading-snug text-ink-2">
              {q}
            </Txt>
          ))}
          <Txt mono className="mt-3 text-[10px] uppercase tracking-wider text-ink-3">
            Distrusted
          </Txt>
          {trustSummary.distrusted.map((q, i) => (
            <Txt key={i} className="mt-1 border-l-2 border-border pl-2.5 text-[13px] leading-snug text-ink-2">
              {q}
            </Txt>
          ))}
          <View className="mt-3">
            <BarList
              items={trust.map((t) => ({ label: t.role, value: t.trust }))}
              format={(v) => `${v}%`}
              colorFor={() => sentiment.positive}
              valueWidth="w-12"
            />
          </View>
        </Expandable>
      </Section>

      <AcrossBoth story={story} onOpenTab={onOpenTab} />
    </View>
  );
}

// ─── Coverage tab ─────────────────────────────────────────────────────────────

function OutletRow({ outlet }: { outlet: IOutletCount }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Txt className="flex-1 text-[14px] text-ink" numberOfLines={1}>
        {outlet.name}
      </Txt>
      <Txt mono weight="semibold" className="ml-2 text-[13px] text-ink">
        {outlet.count}
      </Txt>
    </View>
  );
}

function AuthorRow({ author }: { author: ICoverageAuthor }) {
  return (
    <View className="flex-row items-center py-2.5">
      <View className="flex-1">
        <Txt weight="semibold" className="text-[14px]">
          {author.name}
        </Txt>
        <Txt className="mt-0.5 text-[12px] text-ink-3" numberOfLines={1}>
          {author.outlet} · {author.program}
        </Txt>
      </View>
      <Txt mono weight="semibold" className="ml-2 text-[13px]">
        {author.articles}
      </Txt>
    </View>
  );
}

function ClipRow({ clip }: { clip: ICoverageClip }) {
  return (
    <View className="py-2.5">
      <View className="flex-row items-center justify-between">
        <Txt weight="semibold" className="flex-1 text-[14px]" numberOfLines={1}>
          {clip.outlet}
        </Txt>
        <Txt mono className="ml-2 text-[11px] text-ink-3">
          {clip.date}
        </Txt>
      </View>
      <Txt className="mt-0.5 text-[12px] text-ink-3">
        {clip.medium} · {clip.program}
      </Txt>
    </View>
  );
}

export function CoverageTab({ story }: { story: IStoryDetail }) {
  const { coverage } = story;
  const hasCoverage = coverage.writeups.length > 0 || coverage.articles.length > 0;

  if (!hasCoverage) {
    return (
      <Section title="Coverage">
        <Txt className="text-[14px] leading-relaxed text-ink-3">
          No press, broadcast or online coverage for this story yet.
        </Txt>
      </Section>
    );
  }

  return (
    <View>
      {coverage.writeups.map((w) => (
        <Section key={w.label} title={w.label}>
          <Para>{w.summary}</Para>
          {w.relevance ? (
            <Callout title="Relevance to your priorities" text={w.relevance} footnotes={story.footnotes} />
          ) : null}
          {w.watch.length > 0 ? (
            <>
              <Txt mono weight="medium" className="mt-3 text-[11px] uppercase tracking-wider text-ink-3">
                Things to watch
              </Txt>
              <WatchList items={w.watch} />
            </>
          ) : null}
          {w.analysis ? (
            <>
              <Heading>Analysis</Heading>
              <CitedText
                text={w.analysis}
                footnotes={story.footnotes}
                className="mt-0.5 text-[14px] leading-relaxed text-ink-2"
              />
            </>
          ) : null}
          {w.clippings.length > 0 ? (
            <ClippingChips items={w.clippings} missing={w.clippingsMissing} />
          ) : null}
        </Section>
      ))}

      {coverage.outlets.length ? (
        <Section title="Where it ran">
          <Rows>{coverage.outlets.map((o) => <OutletRow key={o.name} outlet={o} />)}</Rows>
        </Section>
      ) : null}

      {coverage.articles.length ? (
        <Section title="Online news">
          <Rows>{coverage.articles.map((a) => <ArticleRow key={a.id} article={a} />)}</Rows>
        </Section>
      ) : null}

      {coverage.authors.length ? (
        <Section title="Voices in the press">
          <Rows>{coverage.authors.map((a) => <AuthorRow key={a.name} author={a} />)}</Rows>
        </Section>
      ) : null}

      {coverage.keywords.length ? (
        <Section title="Keyword hits">
          <BarList
            items={coverage.keywords.map((k) => ({ label: k.keyword, value: k.count }))}
            format={(v) => String(v)}
            colorFor={() => colors.ink3}
            valueWidth="w-10"
          />
        </Section>
      ) : null}

      {coverage.clippings.length ? (
        <Section title="Clippings" note="Broadcast and print mentions in the capture.">
          <Rows>{coverage.clippings.map((c) => <ClipRow key={c.id} clip={c} />)}</Rows>
        </Section>
      ) : null}
    </View>
  );
}

// ─── Social tab ───────────────────────────────────────────────────────────────

const PLATFORM_CODE: Record<string, string> = {
  Facebook: 'FACEBOOK',
  X: 'TWITTER',
  YouTube: 'YOUTUBE',
  Reddit: 'REDDIT',
};
type BrandIcon = ComponentType<{ size?: number; color?: string }>;
// Brand-colored badge + white glyph (Tabler has no filled Reddit, so it stays outline).
const BRAND: Record<string, { Icon: BrandIcon; color: string }> = {
  Facebook: { Icon: IconBrandFacebookFilled, color: '#1877F2' },
  X: { Icon: IconBrandXFilled, color: '#000000' },
  YouTube: { Icon: IconBrandYoutubeFilled, color: '#FF0000' },
  Reddit: { Icon: IconBrandReddit, color: '#FF4500' },
  Instagram: { Icon: IconBrandInstagramFilled, color: '#E4405F' },
};

function VoiceBar({ neg, pos }: { neg: number; pos: number }) {
  const neu = Math.max(0, 100 - neg - pos);
  return (
    <View className="mt-1.5 w-full max-w-[200px]">
      <View className="h-1.5 flex-row overflow-hidden rounded-full">
        <View style={{ flex: Math.max(neg, 0.01), backgroundColor: sentiment.negative }} />
        <View style={{ flex: Math.max(neu, 0.01), backgroundColor: sentiment.neutral }} />
        <View style={{ flex: Math.max(pos, 0.01), backgroundColor: sentiment.positive }} />
      </View>
      <Txt className="mt-1 text-[11px] text-ink-3">
        {neg}% neg · {pos}% pos
      </Txt>
    </View>
  );
}

function KeyVoiceRow({ voice }: { voice: IKeyVoice }) {
  return (
    <View className="py-2.5">
      <Txt>
        <Txt weight="semibold" className="text-[13px]">
          {voice.handle}
        </Txt>
        <Txt className="text-[11px] text-ink-3">
          {' '}
          {voice.platform} · {compact(voice.comments)} comments · {compact(voice.interactions)} interactions
        </Txt>
      </Txt>
      <Txt className="mt-0.5 text-[11px] text-ink-3">
        {voice.leadEmotion} leads at {voice.leadPct}%
      </Txt>
      <VoiceBar neg={voice.neg} pos={voice.pos} />
    </View>
  );
}

export function SocialTab({ story }: { story: IStoryDetail }) {
  const { social } = story;
  const firstAvailable = social.platforms.find((p) => p.available)?.name ?? 'Facebook';
  const [platform, setPlatform] = useState(firstAvailable);
  const writeup = social.writeups[platform];
  const tone: IPeriodTone | undefined = social.sentimentByPlatform[platform];
  const alignmentNote = social.alignmentByPlatform[platform];
  const posts = social.posts.filter((p) => p.platform === PLATFORM_CODE[platform]);
  const platformTab = social.platforms.find((p) => p.name === platform);
  const engagements = posts.reduce((sum, p) => sum + p.likes + p.comments + p.shares, 0);
  const reactions = posts.reduce((sum, p) => sum + p.likes, 0);
  const comments = social.comments.filter((c) => c.platform === platform);
  const shownComments = (comments.length ? comments : social.comments).slice(0, 6);

  return (
    <View>
      <View className="mt-4 flex-row flex-wrap gap-2.5">
        {social.platforms.map((p) => {
          const active = p.name === platform;
          const brand = BRAND[p.name];
          const BrandGlyph = brand?.Icon;
          return (
            <Pressable
              key={p.name}
              disabled={!p.available}
              onPress={() => p.available && setPlatform(p.name)}
              accessibilityLabel={p.available ? `${p.name}, ${p.postCount} posts` : p.name}
              className={`flex-row items-center rounded-full border ${active ? 'border-ink bg-surface2' : 'border-border bg-surface'}`}
              style={[
                { paddingVertical: 6, paddingLeft: 10, paddingRight: 18 },
                !p.available ? { opacity: 0.4 } : null,
              ]}>
              {BrandGlyph ? (
                <View
                  className="h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: brand.color }}>
                  <BrandGlyph size={13} color="#ffffff" />
                </View>
              ) : null}
              {p.available ? (
                <Txt mono weight={active ? 'bold' : 'medium'} className="ml-2 text-[12px] text-ink">
                  {p.postCount}
                </Txt>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {writeup ? (
        <Section title={`${platform} write-up`}>
          <Para>{writeup.summary}</Para>
          <FieldBlock label="Why it matters" text={writeup.why} />
          <FieldBlock label="What's next" text={writeup.next} />
          <FieldBlock label={`The story on ${platform}`} text={writeup.story} />
        </Section>
      ) : null}

      {platformTab?.available ? (
        <Section title={`${platform} snapshot`}>
          <View className="flex-row justify-between">
            <Figure label="Posts" value={compact(platformTab.postCount)} />
            <Figure label="Engagements" value={compact(engagements)} />
            <Figure label="Reactions" value={compact(reactions)} />
          </View>
        </Section>
      ) : null}

      {writeup ? (
        <Section title="Reaction and comment analysis">
          <Para>{writeup.analysis}</Para>
          <Callout title="Engagement mix" text={writeup.engagementMix} />
          {tone ? (
            <View className="mt-3">
              <ToneBar positive={tone.positive} neutral={tone.neutral} negative={tone.negative} />
            </View>
          ) : null}
        </Section>
      ) : null}

      <Section title="Audience alignment">
        <Txt className="text-[14px] leading-relaxed text-ink-2">
          {alignmentNote ?? 'No alignment reading for this platform.'}
        </Txt>
      </Section>

      <Section title="Key voices">
        <Rows>{social.keyVoices.map((v) => <KeyVoiceRow key={`${v.handle}-${v.platform}`} voice={v} />)}</Rows>
      </Section>

      <Section title={`Posts on ${platform}`}>
        {posts.length ? (
          <Rows>{posts.map((p) => <PostRow key={p.id} post={p} />)}</Rows>
        ) : (
          <Txt className="text-[13px] text-ink-3">No posts captured on {platform}.</Txt>
        )}
      </Section>

      <Section title="Top comments">
        <Rows>{shownComments.map((c) => <CommentRow key={c.id} comment={c} />)}</Rows>
      </Section>
    </View>
  );
}
