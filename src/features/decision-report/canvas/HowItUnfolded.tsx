import { View } from 'react-native';
import { HourByHour } from '@/components/charts/HourByHour';
import { Txt } from '@/components/ui/Txt';
import { BriefWindows } from './BriefWindows';
import { CanvasCard } from './section';
import type { IBriefWindow, IStoryHourlyDay, IStoryMomentMarker } from '@/types';

// "HOW DID IT UNFOLD" (web: UnfoldedSection + UnfoldedChart): the brief-window severity
// strip, the hour-by-hour chart (reused), the narrative, and the numbered moments.
export function HowItUnfolded({
  windows,
  hourly,
  note,
  narrative,
  moments,
}: {
  windows: IBriefWindow[];
  hourly: IStoryHourlyDay[];
  note: string;
  narrative: string;
  moments: IStoryMomentMarker[];
}) {
  const lastDay = hourly[hourly.length - 1]?.label ?? '';
  return (
    <CanvasCard className="gap-4">
      <Txt variant="caption" className="text-ink-3">{note}</Txt>
      <BriefWindows windows={windows} dayLabel={lastDay} />
      <HourByHour days={hourly} />
      <Txt variant="body" className="text-ink-2">{narrative}</Txt>
      <View style={{ gap: 8 }}>
        {moments.map((m) => (
          <View key={m.n} className="flex-row items-start" style={{ gap: 8 }}>
            <View className="h-5 w-5 items-center justify-center rounded-full bg-ink">
              <Txt mono weight="bold" className="text-[10px] text-white">{m.n}</Txt>
            </View>
            <Txt variant="body" className="flex-1 text-ink-2">
              <Txt variant="body" weight="semibold">{m.when}</Txt>
              {`  ·  ${m.kind}  ·  ${m.label}`}
            </Txt>
          </View>
        ))}
      </View>
    </CanvasCard>
  );
}
