import { View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { compactNum } from '../verdict';

// Weighted engagement + velocity (web: ScoupPills — acceleration/momentum-label pills are
// gated off when momentum is flat, as here).
function Pill({ label, value }: { label: string; value: string }) {
  return (
    <View
      className="flex-row items-center rounded-full border border-border bg-surface px-3 py-1.5"
      style={{ gap: 6 }}>
      <Txt mono className="text-[10px] uppercase tracking-wider text-ink-3">{label}</Txt>
      <Txt mono weight="bold" className="text-[12px] text-ink">{value}</Txt>
    </View>
  );
}

export function ScoupPills({
  weightedEngagement,
  velocity,
}: {
  weightedEngagement: number;
  velocity: number;
}) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      <Pill label="Weighted engagement" value={compactNum(weightedEngagement)} />
      <Pill label="Velocity" value={`${velocity.toFixed(1)}/h`} />
    </View>
  );
}
