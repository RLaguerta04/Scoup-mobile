import { View } from 'react-native';
import { EmotionRadar } from '@/components/charts/EmotionRadar';
import { Divider } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { colors, emotionColor, sentiment } from '@/theme/tokens';
import { VerdictBadge } from '../badges';
import type { IDecisionComment, IDecisionStory, IEmotionShare } from '@/types';

// A compact 3-segment stance bar (negative / neutral / positive), same idiom as ToneBar.
function StanceBar({ neg, neu, pos }: { neg: number; neu: number; pos: number }) {
  return (
    <View className="h-2 flex-row overflow-hidden rounded-full bg-surface3">
      {neg > 0 && <View style={{ flex: neg, backgroundColor: sentiment.negative }} />}
      {neu > 0 && <View style={{ flex: neu, backgroundColor: sentiment.neutral }} />}
      {pos > 0 && <View style={{ flex: pos, backgroundColor: sentiment.positive }} />}
    </View>
  );
}

// A per-story 8-emotion stacked bar, each segment the emotion's colour.
function EmotionBar({ emotions }: { emotions: IEmotionShare[] }) {
  return (
    <View className="h-2 flex-row overflow-hidden rounded-full bg-surface3">
      {emotions.map((e) =>
        e.pct > 0 ? (
          <View key={e.label} style={{ flex: e.pct, backgroundColor: emotionColor[e.label] ?? colors.ink3 }} />
        ) : null,
      )}
    </View>
  );
}

const dominant = (emotions: IEmotionShare[]): IEmotionShare =>
  emotions.reduce((best, e) => (e.pct > best.pct ? e : best), emotions[0]);

function StanceKey({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <View className="flex-row items-center" style={{ gap: 4 }}>
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Txt className="text-[11px] text-ink-3">{label}</Txt>
      <Txt mono weight="semibold" className="text-[11px] text-ink">{pct}%</Txt>
    </View>
  );
}

const SENT_STYLE: Record<IDecisionComment['sentiment'], { bg: string; fg: string }> = {
  positive: { bg: '#e4f0ea', fg: '#0a7a52' },
  neutral: { bg: colors.surface3, fg: colors.ink3 },
  negative: { bg: '#fbe6dc', fg: '#b24a14' },
};
function SentChip({ value }: { value: IDecisionComment['sentiment'] }) {
  const st = SENT_STYLE[value];
  return (
    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: st.bg }}>
      <Txt weight="semibold" className="text-[11px]" style={{ color: st.fg }}>
        {value[0].toUpperCase() + value.slice(1)}
      </Txt>
    </View>
  );
}

// "How people felt" — the emotion/comment counts, the stance table, and the most-liked
// comments (web: ReportComments).
export function FeltTab({
  stories,
  mostLiked,
}: {
  stories: IDecisionStory[];
  mostLiked: IDecisionComment[];
}) {
  // Aggregate the eight emotions across every story (averaged by index — same label order).
  const labels = stories[0]?.emotions.map((e) => e.label) ?? [];
  const aggregate: IEmotionShare[] = labels.map((label, idx) => ({
    label,
    pct: Math.round(
      stories.reduce((sum, s) => sum + (s.emotions[idx]?.pct ?? 0), 0) / Math.max(1, stories.length),
    ),
  }));

  return (
    <View>
      <Txt variant="body" className="text-ink-3">
        The emotion and stance in the comments, story by story.
      </Txt>

      {/* Emotion in the comments — an aggregate radar + the per-story breakdown */}
      <View className="mt-5">
        <Label>Emotion in the comments</Label>
        <Txt variant="caption" className="mt-0.5 text-ink-3">
          the eight tracked emotions, across every story’s top comments
        </Txt>
        <View className="mt-2 rounded-card border border-border bg-surface p-3">
          <EmotionRadar items={aggregate} />
        </View>
        <View className="mt-3 rounded-card border border-border bg-surface px-4">
          {stories.map((s, i) => {
            const dom = dominant(s.emotions);
            return (
              <View key={s.id}>
                <View className="py-3">
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <VerdictBadge verdict={s.verdict} />
                    <Txt weight="semibold" numberOfLines={1} className="flex-1 text-[13px]">{s.title}</Txt>
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: emotionColor[dom.label] ?? colors.ink3 }} />
                      <Txt weight="semibold" className="text-[12px]">{dom.label}</Txt>
                      <Txt mono className="text-[11px] text-ink-3">{dom.pct}%</Txt>
                    </View>
                  </View>
                  <View className="mt-2">
                    <EmotionBar emotions={s.emotions} />
                  </View>
                </View>
                {i < stories.length - 1 && <Divider />}
              </View>
            );
          })}
        </View>
      </View>

      {/* Stance in the comments — per-story negative/neutral/positive + net */}
      <View className="mt-6">
        <Label>Stance in the comments</Label>
        <Txt variant="caption" className="mt-0.5 text-ink-3">objective view · negative / neutral / positive · net</Txt>
        <View className="mt-3 rounded-card border border-border bg-surface px-4">
          {stories.map((s, i) => (
            <View key={s.id}>
              <View className="py-3">
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <VerdictBadge verdict={s.verdict} />
                  <Txt weight="semibold" numberOfLines={1} className="flex-1 text-[13px]">{s.title}</Txt>
                  <Txt
                    mono
                    weight="bold"
                    className="text-[12px]"
                    style={{ color: s.net < 0 ? sentiment.negative : s.net > 0 ? sentiment.positive : colors.ink3 }}>
                    {s.net > 0 ? '+' : ''}{s.net}
                  </Txt>
                </View>
                <View className="mt-2">
                  <StanceBar neg={s.stance.neg} neu={s.stance.neu} pos={s.stance.pos} />
                </View>
                <View className="mt-1.5 flex-row flex-wrap" style={{ gap: 12 }}>
                  {s.stance.neg > 0 && <StanceKey color={sentiment.negative} label="Negative" pct={s.stance.neg} />}
                  {s.stance.neu > 0 && <StanceKey color={sentiment.neutral} label="Neutral" pct={s.stance.neu} />}
                  {s.stance.pos > 0 && <StanceKey color={sentiment.positive} label="Positive" pct={s.stance.pos} />}
                </View>
              </View>
              {i < stories.length - 1 && <Divider />}
            </View>
          ))}
        </View>
        <Txt variant="caption" className="mt-2 text-ink-3">
          Net is positive minus negative, as a share of the story’s comments.
        </Txt>
      </View>

      {/* Most liked comments across these stories */}
      <View className="mt-6">
        <Label>Most liked comments</Label>
        <Txt variant="caption" className="mt-0.5 text-ink-3">across these stories</Txt>
        <View className="mt-2">
          {mostLiked.map((c, i) => (
            <View key={c.id}>
              <View className="py-3">
                <Txt variant="body" className="text-ink">{c.text}</Txt>
                <View className="mt-1.5 flex-row items-center" style={{ gap: 8 }}>
                  <SentChip value={c.sentiment} />
                  <Txt className="text-[12px] text-ink-3">{c.emotion}</Txt>
                  <Txt mono className="text-[11px] text-ink-3">♥ {c.likes}</Txt>
                </View>
                <Txt variant="caption" className="mt-1 text-ink-3" numberOfLines={1}>On · {c.storyTitle}</Txt>
              </View>
              {i < mostLiked.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
