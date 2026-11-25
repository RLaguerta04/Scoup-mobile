import { View } from 'react-native';
import { Txt } from '../ui/Txt';
import { sentiment } from '@/theme/tokens';
import type { IToneShare } from '@/types';

function Legend({ color, label, share }: { color: string; label: string; share: IToneShare }) {
  return (
    <View className="flex-row items-center">
      <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Txt className="text-[12px] text-ink-2">{label} </Txt>
      <Txt weight="semibold" className="text-[12px] text-ink">{share.pct}%</Txt>
      <Txt className="text-[12px] text-ink-3"> ({share.count})</Txt>
    </View>
  );
}

export function ToneBar({
  positive,
  neutral,
  negative,
}: {
  positive: IToneShare;
  neutral: IToneShare;
  negative: IToneShare;
}) {
  return (
    <View>
      <View className="h-2 flex-row overflow-hidden rounded-full">
        <View style={{ flex: Math.max(negative.pct, 0.01), backgroundColor: sentiment.negative }} />
        <View style={{ flex: Math.max(neutral.pct, 0.01), backgroundColor: sentiment.neutral }} />
        <View style={{ flex: Math.max(positive.pct, 0.01), backgroundColor: sentiment.positive }} />
      </View>
      <View className="mt-2.5 flex-row flex-wrap gap-x-4 gap-y-1">
        <Legend color={sentiment.negative} label="Negative" share={negative} />
        <Legend color={sentiment.neutral} label="Neutral" share={neutral} />
        <Legend color={sentiment.positive} label="Positive" share={positive} />
      </View>
    </View>
  );
}
