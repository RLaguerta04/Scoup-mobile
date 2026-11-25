import { View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { MapCanvas } from '@/features/map/MapCanvas';
import { choroplethRamp } from '@/theme/tokens';
import type { DashboardMapProps } from './dashboardMap.types';

// Native Dashboard map (iOS/Android via react-native-maps): NCR cities as sized, colour-ramped
// markers from the story→place counts. Tapping a marker scopes the list + charts (DashboardView).
const storyColor = (n: number): string =>
  n >= 4 ? choroplethRamp[3] : n >= 2 ? choroplethRamp[2] : n >= 1 ? choroplethRamp[1] : choroplethRamp[0];
const storySize = (n: number): number => (n >= 8 ? 40 : n >= 4 ? 34 : 28);

export function DashboardMap({ areas, total, unplaced, onSelectPlace }: DashboardMapProps) {
  // Only NCR places have a CITY_COORDS key the native map can plot.
  const ncr = areas.filter((a) => a.short);
  const onSelect = (short: string) => {
    const area = ncr.find((a) => a.short === short);
    if (area) onSelectPlace(area.code, area.name);
  };

  return (
    <View style={{ flex: 1 }}>
      <MapCanvas
        areas={ncr.map((a) => ({ name: a.short, posts: a.stories }))}
        onSelect={onSelect}
        colorFor={storyColor}
        sizeFor={storySize}
      />
      {/* Caption chip (top-left, clear of the drawer). */}
      <View className="absolute left-2.5 top-2.5 self-start rounded-full border border-border bg-surface/90 px-2.5 py-1">
        <Txt className="text-[11px] text-ink-2">
          {total} stories · {unplaced} not placed
        </Txt>
      </View>
    </View>
  );
}
