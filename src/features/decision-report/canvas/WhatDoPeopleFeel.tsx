import { useState } from 'react';
import { View } from 'react-native';
import { ToneBar } from '@/components/charts/ToneBar';
import { SegmentedControl } from '@/components/ui/controls';
import { Label, Txt } from '@/components/ui/Txt';
import { sentiment } from '@/theme/tokens';
import { CanvasSection } from './section';
import type { IEmotionShare, IPeriodTone } from '@/types';

type FeelView = 'persona' | 'objective';
type SampleComment = { text: string; sentiment: 'positive' | 'neutral' | 'negative' };

const QUOTE_COLOR: Record<SampleComment['sentiment'], string> = {
  positive: sentiment.positive,
  neutral: sentiment.neutral,
  negative: sentiment.negative,
};

function EmotionChip({ label, pct }: { label: string; pct: number }) {
  return (
    <View className="flex-row items-center rounded-full bg-surface3 px-2.5 py-1" style={{ gap: 5 }}>
      <Txt className="text-[12px] text-ink-2">{label}</Txt>
      <Txt mono weight="semibold" className="text-[11px] text-ink">{pct}%</Txt>
    </View>
  );
}

// A representative comment, shown as a blockquote with a sentiment-coloured left rule.
function Quote({ comment }: { comment: SampleComment }) {
  return (
    <View className="flex-row" style={{ gap: 10 }}>
      <View style={{ width: 3, borderRadius: 2, backgroundColor: QUOTE_COLOR[comment.sentiment] }} />
      <Txt variant="body" className="flex-1 text-ink-2">
        “{comment.text}”
      </Txt>
    </View>
  );
}

// "WHAT DO PEOPLE FEEL" — analysis + tone bar + emotions + trust + concentration, with the
// Persona/Objective reading toggle (web: SayingSection + CommentAnalysis + CommentTrust).
export function WhatDoPeopleFeel({
  note,
  analysis,
  tone,
  personaTone,
  emotions,
  trustText,
  concentrationText,
  concentrationDetail,
  sampleComments,
}: {
  note: string;
  analysis: string;
  tone: IPeriodTone;
  personaTone: IPeriodTone;
  emotions: IEmotionShare[];
  trustText: string;
  concentrationText: string;
  concentrationDetail: string;
  sampleComments: SampleComment[];
}) {
  const [view, setView] = useState<FeelView>('objective');
  const t = view === 'objective' ? tone : personaTone;
  return (
    <CanvasSection kicker="What do people feel">
      <Txt variant="caption" className="text-ink-3">{note}</Txt>
      <View className="mt-2" style={{ maxWidth: 240 }}>
        <SegmentedControl
          options={[
            { value: 'persona', label: 'Persona' },
            { value: 'objective', label: 'Objective' },
          ]}
          value={view}
          onChange={setView}
        />
      </View>
      <Txt variant="section" className="mt-3">{analysis}</Txt>
      <View className="mt-3">
        <ToneBar positive={t.positive} neutral={t.neutral} negative={t.negative} />
      </View>

      {sampleComments.length > 0 && (
        <View className="mt-4">
          <Label>What they’re saying</Label>
          <View className="mt-2" style={{ gap: 10 }}>
            {sampleComments.map((c, i) => (
              <Quote key={i} comment={c} />
            ))}
          </View>
        </View>
      )}
      <View className="mt-4">
        <Label>Emotions</Label>
        <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
          {emotions.map((e) => (
            <EmotionChip key={e.label} label={e.label} pct={e.pct} />
          ))}
        </View>
      </View>
      <View className="mt-4 flex-row" style={{ gap: 16 }}>
        <View className="flex-1">
          <Label>Who commenters trust</Label>
          <Txt variant="body" className="mt-1 text-ink-3">{trustText}</Txt>
        </View>
        <View className="flex-1">
          <Label>Where it concentrates</Label>
          <Txt weight="bold" className="mt-1 text-[15px]">{concentrationText}</Txt>
          <Txt variant="caption" className="mt-0.5 text-ink-3">{concentrationDetail}</Txt>
        </View>
      </View>
    </CanvasSection>
  );
}
