import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { MonthCalendar } from '@/components/ui/MonthCalendar';
import { Label, Txt } from '@/components/ui/Txt';
import { usePeriodStore } from '@/stores/periodStore';
import { rangeLabel, TODAY } from '@/lib/dateRange';
import type { RangePreset } from '@/types';
import { renderBackdrop, sheetSurface, type SheetHandle } from './sheet';

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export const DatePickerSheet = forwardRef<SheetHandle>((_, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['80%'], []);

  const storeFrom = usePeriodStore((s) => s.from);
  const storeTo = usePeriodStore((s) => s.to);
  const activePreset = usePeriodStore((s) => s.preset);
  const setPreset = usePeriodStore((s) => s.setPreset);
  const setCustom = usePeriodStore((s) => s.setCustom);

  const [start, setStart] = useState<string | null>(storeFrom);
  const [end, setEnd] = useState<string | null>(storeTo);

  useImperativeHandle(
    ref,
    () => ({
      present: () => {
        setStart(storeFrom);
        setEnd(storeTo);
        sheet.current?.present();
      },
    }),
    [storeFrom, storeTo],
  );

  const close = () => sheet.current?.dismiss();

  const onPreset = (p: RangePreset) => {
    setPreset(p);
    close();
  };

  const onDayPress = (d: string) => {
    if (!start || (start && end)) {
      setStart(d);
      setEnd(null);
    } else if (d >= start) {
      setEnd(d);
    } else {
      setStart(d);
      setEnd(null);
    }
  };

  const apply = () => {
    if (!start) return;
    setCustom(start, end ?? start);
    close();
  };

  const customLabel = start ? rangeLabel({ from: start, to: end ?? start }) : '—';

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetView>
        <View className="px-4 pb-10">
          <Label>Reporting period</Label>
          <View className="mt-3 flex-row gap-2">
            {PRESETS.map((p) => {
              const active = activePreset === p.value;
              return (
                <Pressable
                  key={p.value}
                  onPress={() => onPreset(p.value)}
                  className={`rounded-full border px-3 py-2 ${active ? 'border-ink bg-ink' : 'border-border bg-surface'}`}>
                  <Txt weight="medium" className={`text-[12px] ${active ? 'text-white' : 'text-ink-2'}`}>
                    {p.label}
                  </Txt>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-4 rounded-2xl border border-border bg-surface p-2">
            <MonthCalendar start={start} end={end} onSelect={onDayPress} maxDate={TODAY} />
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <View>
              <Label>Custom</Label>
              <Txt mono weight="semibold" className="mt-0.5 text-[14px]">
                {customLabel}
              </Txt>
            </View>
            <Pressable onPress={apply} className="rounded-full bg-ink px-5 py-3">
              <Txt weight="semibold" className="text-[13px] text-white">
                Apply
              </Txt>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

DatePickerSheet.displayName = 'DatePickerSheet';
