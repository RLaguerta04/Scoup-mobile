import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Pill } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { colors, sentiment } from '@/theme/tokens';
import { TRACKER_VERDICT, TREND_GLYPH, VERDICT } from './verdict';
import type { ReportTrend, ReportVerdict, TrackerVerdict } from '@/types';

// ACT / WATCH / SKIP chip (web: VerdictBadge).
export function VerdictBadge({ verdict }: { verdict: ReportVerdict }) {
  return <Pill label={VERDICT[verdict].label} tone={VERDICT[verdict].tone} />;
}

// ESCALATING / STABLE / CONTAINING chip for a crisis tracker (web: TrackerBadge).
export function TrackerBadge({ verdict }: { verdict: TrackerVerdict }) {
  return <Pill label={TRACKER_VERDICT[verdict].label.toUpperCase()} tone={TRACKER_VERDICT[verdict].tone} />;
}

// "Tracker · Day N ›" outlined chip on a crisis story row / canvas (web: TrackerTag).
// Opens the crisis tracker detail.
export function TrackerTag({ storyId, day, long = false }: { storyId: string; day: number; long?: boolean }) {
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/report-tracker/[trackerId]', params: { trackerId: storyId } })
      }
      hitSlop={6}
      className="self-start rounded-[5px] border px-1.5 py-0.5"
      style={{ borderColor: '#9a6413' }}>
      <Txt mono weight="medium" className="text-[10.5px] uppercase tracking-wide" style={{ color: '#9a6413' }}>
        {long ? 'Crisis tracker · ' : 'Tracker · '}Day {day} ›
      </Txt>
    </Pressable>
  );
}

// Rising / Steady / Fading with its arrow and (optionally) the momentum value
// (web: TrendBadge). Rising reads green, Fading red, Steady muted.
export function TrendBadge({ trend, momentum }: { trend: ReportTrend; momentum?: number }) {
  const color =
    trend === 'Rising' ? sentiment.positive : trend === 'Fading' ? sentiment.negative : colors.ink3;
  return (
    <View className="flex-row items-center" style={{ gap: 4 }}>
      <Txt weight="semibold" className="text-[12px]" style={{ color }}>
        {TREND_GLYPH[trend]} {trend}
      </Txt>
      {momentum != null && (
        <Txt mono className="text-[11px] text-ink-3">
          · momentum {momentum}
        </Txt>
      )}
    </View>
  );
}

// Priority 0–100 bar, house style (cf. charts/BarList). The one ACT story reads red to
// flag that it needs a response; everything else reads ink.
export function ScoreBar({ value, verdict }: { value: number; verdict: ReportVerdict }) {
  const fill = verdict === 'act' ? sentiment.negative : colors.ink;
  return (
    <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface3">
      <View
        className="h-full rounded-full"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: fill }}
      />
    </View>
  );
}
