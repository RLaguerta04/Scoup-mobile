import { ScrollView, View } from 'react-native';
import { StatTile } from '@/components/ui/StatTile';
import { sentiment } from '@/theme/tokens';
import type { IDecisionCount } from '@/types';

// The six KPI counts as a horizontally-scrollable StatTile strip (web: the brief bar's
// right-hand cues row). Over-threshold values read red.
export function BriefCountsStrip({ counts }: { counts: IDecisionCount[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 16, gap: 22 }}>
      {counts.map((c) => (
        <View key={c.key} style={{ minWidth: 92 }}>
          <StatTile
            label={c.label}
            value={c.value}
            sub={c.sub}
            subColor={c.alert ? sentiment.negative : undefined}
          />
        </View>
      ))}
    </ScrollView>
  );
}
