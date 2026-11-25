import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Chip } from '@/components/ui/controls';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface, type SheetHandle } from '@/components/sheets/sheet';
import type { IPublisherSort } from '@/types';
import { PUBLISHER_STATUSES, STATUS_LABEL, type PublisherStatus } from './status';

// Combined Status + Sort filters (the collapsed "Filters" button opens this). Draft is held
// locally and committed on Apply.
const SORTS: { value: Exclude<IPublisherSort, null>; label: string }[] = [
  { value: 'name_asc', label: 'A–Z' },
  { value: 'name_desc', label: 'Z–A' },
];

export const PublisherFiltersSheet = forwardRef<
  SheetHandle,
  {
    statuses: PublisherStatus[];
    sort: IPublisherSort;
    onApply: (statuses: PublisherStatus[], sort: IPublisherSort) => void;
  }
>(({ statuses, sort, onApply }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['55%'], []);
  const [draftStatuses, setDraftStatuses] = useState<PublisherStatus[]>(statuses);
  const [draftSort, setDraftSort] = useState<IPublisherSort>(sort);

  useImperativeHandle(ref, () => ({
    present: () => {
      setDraftStatuses(statuses);
      setDraftSort(sort);
      sheet.current?.present();
    },
  }));

  const toggleStatus = (s: PublisherStatus) =>
    setDraftStatuses((d) => (d.includes(s) ? d.filter((x) => x !== s) : [...d, s]));
  const pickSort = (v: Exclude<IPublisherSort, null>) =>
    setDraftSort((cur) => (cur === v ? null : v));
  const reset = () => {
    setDraftStatuses([]);
    setDraftSort(null);
  };
  const apply = () => {
    onApply(draftStatuses, draftSort);
    sheet.current?.dismiss();
  };
  const count = draftStatuses.length + (draftSort ? 1 : 0);

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetView>
        <View className="px-4 pb-10 pt-1">
          <View className="flex-row items-center justify-between py-1">
            <Txt weight="bold" className="text-[18px]">
              Filters
            </Txt>
            <Pressable onPress={reset} hitSlop={8}>
              <Txt weight="medium" className="text-[13px] text-ink-3">
                Reset
              </Txt>
            </Pressable>
          </View>

          <View className="mt-4">
            <Label>Status</Label>
            <View className="mt-2.5 flex-row flex-wrap gap-2">
              {PUBLISHER_STATUSES.map((s) => (
                <Chip key={s} label={STATUS_LABEL[s]} active={draftStatuses.includes(s)} onPress={() => toggleStatus(s)} />
              ))}
            </View>
          </View>

          <View className="mt-5">
            <Label>Sort by name</Label>
            <View className="mt-2.5 flex-row flex-wrap gap-2">
              {SORTS.map((o) => (
                <Chip key={o.value} label={o.label} active={draftSort === o.value} onPress={() => pickSort(o.value)} />
              ))}
            </View>
          </View>

          <Pressable onPress={apply} className="mt-6 items-center rounded-full bg-ink py-3.5">
            <Txt weight="semibold" className="text-[14px] text-white">
              {count > 0 ? `Apply · ${count}` : 'Apply'}
            </Txt>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

PublisherFiltersSheet.displayName = 'PublisherFiltersSheet';
