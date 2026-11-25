import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Checkbox } from '@/components/ui/Checkbox';
import { Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface, type SheetHandle } from '@/components/sheets/sheet';
import { DASH_CHART_IDS, DASH_CHART_META } from '@/features/dashboard/DashboardChartStack';
import { useDashboardLayoutStore } from '@/stores/dashboardLayoutStore';

// The mobile "Choose the charts" picker — a chart icon in the header opens this; ticking a row
// shows/hides that card on the Dashboard (reorder intentionally omitted). Mirrors the web's
// ChartPickerModal, trimmed to show/hide for a phone.
export const DashboardChartPickerSheet = forwardRef<SheetHandle>((_, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['72%'], []);
  useImperativeHandle(ref, () => ({ present: () => sheet.current?.present() }));

  const hidden = useDashboardLayoutStore((s) => s.hidden);
  const toggle = useDashboardLayoutStore((s) => s.toggle);
  const showAll = useDashboardLayoutStore((s) => s.showAll);
  const hideAll = useDashboardLayoutStore((s) => s.hideAll);
  const reset = useDashboardLayoutStore((s) => s.reset);

  const shownCount = DASH_CHART_IDS.filter((id) => !hidden[id]).length;

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <View className="px-4 pb-2 pt-1">
        <Txt weight="bold" className="text-[18px]">
          Choose charts
        </Txt>
        <Txt mono className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-3">
          {shownCount} of {DASH_CHART_IDS.length} shown
        </Txt>
      </View>

      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        {DASH_CHART_META.map((c) => {
          const on = !hidden[c.id];
          return (
            <Pressable
              key={c.id}
              onPress={() => toggle(c.id)}
              className="flex-row items-center border-b border-border py-3.5">
              <Checkbox checked={on} />
              <View className="ml-3 flex-1">
                <Txt weight="semibold" className="text-[14px]">
                  {c.title}
                </Txt>
                <Txt numberOfLines={1} className="mt-0.5 text-[12px] text-ink-3">
                  {c.description}
                </Txt>
              </View>
            </Pressable>
          );
        })}
      </BottomSheetScrollView>

      {/* Footer actions */}
      <View className="flex-row items-center gap-2 px-4 pb-8 pt-3">
        <Pressable onPress={reset} className="rounded-full border border-border bg-surface px-3 py-2.5">
          <Txt weight="medium" className="text-[12px] text-ink-2">
            Reset
          </Txt>
        </Pressable>
        <Pressable onPress={showAll} className="rounded-full border border-border bg-surface px-3 py-2.5">
          <Txt weight="medium" className="text-[12px] text-ink-2">
            Show all
          </Txt>
        </Pressable>
        <Pressable onPress={hideAll} className="rounded-full border border-border bg-surface px-3 py-2.5">
          <Txt weight="medium" className="text-[12px] text-ink-2">
            Hide all
          </Txt>
        </Pressable>
        <View className="flex-1" />
        <Pressable onPress={() => sheet.current?.dismiss()} className="rounded-full bg-ink px-5 py-2.5">
          <Txt weight="semibold" className="text-[13px] text-white">
            Done
          </Txt>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
});

DashboardChartPickerSheet.displayName = 'DashboardChartPickerSheet';
