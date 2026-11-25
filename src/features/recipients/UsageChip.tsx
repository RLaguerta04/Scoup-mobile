import { View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import type { IRecipientGroupUsage } from '@/types';
import { SENDOUT_TYPE } from './sendoutType';

// A "Used in" pill: a colored sendout-type dot + the newsletter name + the type
// label (the web's UsageChip). Used on both the list card and the detail screen.
export function UsageChip({ usage }: { usage: IRecipientGroupUsage }) {
  const s = SENDOUT_TYPE[usage.type];
  return (
    <View className="flex-row items-center rounded-full border border-border bg-surface2 px-2 py-1">
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.dot }} />
      <Txt className="ml-1.5 text-[11px] text-ink" numberOfLines={1}>
        {usage.newsletter_name}
      </Txt>
      <Txt mono weight="medium" className="ml-1.5 text-[10px] uppercase text-ink-3">
        {s.upper}
      </Txt>
    </View>
  );
}
