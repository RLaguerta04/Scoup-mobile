import { Pressable, View } from 'react-native';
import { Label, Txt } from '@/components/ui/Txt';
import { colors, sentiment } from '@/theme/tokens';
import { useDrill } from '../drill/DrillContext';
import type { ICanvasMetric } from '@/types';

// Place a 0..1 position inside the track, inset from the ends so the dots never clip.
const L = (d: number) => 4 + Math.min(Math.max(d, 0), 1) * 92;

// A "What is it to you" metric tile: big value + "#n of 6" + a dot-strip placing every
// story's value (this one highlighted) (web: Metric + MetricStrip). Drillable → the
// 6-story ranking for this metric.
export function MetricStrip({ metric }: { metric: ICanvasMetric }) {
  const drill = useDrill();
  const selfColor = metric.tone === 'negative' ? sentiment.negative : colors.ink;
  return (
    <Pressable {...drill(`metric:${metric.key}`)} className="rounded-card border border-border bg-surface p-3 active:bg-surface2">
      <Label>{metric.label}</Label>
      <Txt variant="metric" className="mt-1" style={{ color: selfColor }}>
        {metric.value}
      </Txt>
      {/* Reserve a fixed 2 lines so every card is the same height and the dot-strips align
          (caption line-height is 16 → 32px). */}
      <Txt variant="caption" numberOfLines={2} className="mt-0.5 text-ink-3" style={{ height: 32 }}>
        {metric.sub} · #{metric.rank} of {metric.total}
      </Txt>
      <View className="mt-3 h-4 justify-center">
        <View className="h-px bg-border" />
        {metric.signed && (
          <View className="absolute h-4 w-px" style={{ left: '50%', backgroundColor: colors.border }} />
        )}
        {metric.dots.map((d, i) => (
          <View
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${L(d)}%`,
              top: '50%',
              width: 6,
              height: 6,
              marginLeft: -3,
              marginTop: -3,
              backgroundColor: sentiment.neutral,
            }}
          />
        ))}
        <View
          className="absolute rounded-full"
          style={{
            left: `${L(metric.self)}%`,
            top: '50%',
            width: 9,
            height: 9,
            marginLeft: -4.5,
            marginTop: -4.5,
            backgroundColor: selfColor,
          }}
        />
      </View>
    </Pressable>
  );
}
