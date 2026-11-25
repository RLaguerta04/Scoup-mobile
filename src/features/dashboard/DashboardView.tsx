import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChartBar, IconFilter } from '@/components/navIcons';
import { FilterSheet } from '@/components/sheets/FilterSheet';
import type { SheetHandle } from '@/components/sheets/sheet';
import { SegmentedControl } from '@/components/ui/controls';
import { Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import { floatingTabBarClearance } from '@/components/FloatingTabBar';
import { DashboardCharts } from '@/features/dashboard/DashboardChartStack';
import { DashboardChartPickerSheet } from '@/features/dashboard/DashboardChartPickerSheet';
import { DashboardDrillContext } from '@/features/dashboard/drill/DrillContext';
import {
  DashboardDrillSheet,
  type DashboardDrillHandle,
} from '@/features/dashboard/drill/DashboardDrillSheet';
import { useDashboardCharts } from '@/services/api/queries';
import { shownChartIds, useDashboardLayoutStore } from '@/stores/dashboardLayoutStore';
import { countActiveFilters, useMentionsFilterStore } from '@/stores/mentionsFilterStore';
import { usePeriodStore } from '@/stores/periodStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { colors } from '@/theme/tokens';
import type { Lens } from '@/types';

// The Dashboard sub-view — the web's Dashboard tab with the map section removed. The period's
// analytics as a scroll of chart cards, all visible by default (no reveal tap). Lens + filter
// sit on top, mirroring the web's DashboardHeader (its title and chart-picker dropped: the
// sub-nav already names the tab, and the mobile set is the full fixed stack).

const LENS_OPTS: { value: Lens; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mw', label: 'MediaWatch' },
  { value: 'sv', label: 'SharedView' },
];

function ChartCardSkeleton() {
  return (
    <View className="mx-4 mb-3 rounded-card border border-border bg-surface p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-48" />
      <Skeleton className="mt-4 h-32 w-full" />
    </View>
  );
}

export function DashboardView() {
  const insets = useSafeAreaInsets();
  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const [lens, setLens] = useState<Lens>('all');
  const filters = useMentionsFilterStore((s) => s.filters);
  const activeCount = countActiveFilters(filters);
  const from = usePeriodStore((s) => s.from);
  const to = usePeriodStore((s) => s.to);
  const range = useMemo(() => ({ from, to }), [from, to]);

  const filterRef = useRef<SheetHandle>(null);
  const pickerRef = useRef<SheetHandle>(null);
  const drillRef = useRef<DashboardDrillHandle>(null);
  const openDrill = useCallback((spec: string) => drillRef.current?.present(spec), []);

  const hidden = useDashboardLayoutStore((s) => s.hidden);
  const shown = useMemo(() => shownChartIds(hidden), [hidden]);

  const charts = useDashboardCharts(newsletterId, range);

  return (
    <DashboardDrillContext.Provider value={openDrill}>
      <View className="flex-1">
      {/* Lens tabs + filter — the web DashboardHeader, minus the title & chart picker. */}
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-3">
        <View className="flex-1">
          <SegmentedControl options={LENS_OPTS} value={lens} onChange={setLens} />
        </View>
        <Pressable
          onPress={() => filterRef.current?.present()}
          hitSlop={6}
          accessibilityLabel="Filters"
          className="flex-row items-center justify-center rounded-full border border-border bg-surface px-2.5 py-2">
          <IconFilter size={16} color={colors.ink} />
          {activeCount > 0 && (
            <View className="ml-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1">
              <Txt mono className="text-[10px] text-white">
                {activeCount}
              </Txt>
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={() => pickerRef.current?.present()}
          hitSlop={6}
          accessibilityLabel="Choose charts"
          className="flex-row items-center justify-center rounded-full border border-border bg-surface px-2.5 py-2">
          <IconChartBar size={16} color={colors.ink} />
          <View className="ml-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1">
            <Txt mono className="text-[10px] text-white">
              {shown.length}
            </Txt>
          </View>
        </Pressable>
      </View>

      {/* All charts, visible by default — a plain scroll, no map, no reveal. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: floatingTabBarClearance(insets.bottom) + 24 }}
        showsVerticalScrollIndicator={false}>
        {!charts.data ? (
          <View className="pt-1">
            {[0, 1, 2].map((i) => (
              <ChartCardSkeleton key={i} />
            ))}
          </View>
        ) : shown.length === 0 ? (
          <View className="items-center px-8 pt-24">
            <IconChartBar size={28} color={colors.ink3} />
            <Txt weight="semibold" className="mt-3 text-[15px]">
              No charts shown
            </Txt>
            <Txt className="mt-1 text-center text-[13px] text-ink-3">
              Choose which charts to display on the dashboard.
            </Txt>
            <Pressable
              onPress={() => pickerRef.current?.present()}
              className="mt-4 rounded-full bg-ink px-4 py-2.5">
              <Txt weight="semibold" className="text-[13px] text-white">
                Choose charts
              </Txt>
            </Pressable>
          </View>
        ) : (
          <DashboardCharts data={charts.data} shown={shown} />
        )}
      </ScrollView>

        <FilterSheet ref={filterRef} />
        <DashboardChartPickerSheet ref={pickerRef} />
        <DashboardDrillSheet ref={drillRef} newsletterId={newsletterId} range={range} />
      </View>
    </DashboardDrillContext.Provider>
  );
}
