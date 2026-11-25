import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Chip } from '@/components/ui/controls';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface, type SheetHandle } from '@/components/sheets/sheet';
import { PUBLISHER_STATUSES, STATUS_LABEL, type PublisherStatus } from '@/features/publishers/status';
import type { ChannelPlatform, IChannelSort } from '@/types';
import { CHANNEL_PLATFORMS, PLATFORM } from './platform';

// Combined Platform + Status + Sort filters (the collapsed "Filters" button opens this).
const SORTS: { value: Exclude<IChannelSort, null>; label: string }[] = [
  { value: 'followers_desc', label: 'Most followers' },
  { value: 'followers_asc', label: 'Fewest followers' },
];

export const ChannelFiltersSheet = forwardRef<
  SheetHandle,
  {
    platforms: ChannelPlatform[];
    statuses: PublisherStatus[];
    sort: IChannelSort;
    onApply: (platforms: ChannelPlatform[], statuses: PublisherStatus[], sort: IChannelSort) => void;
  }
>(({ platforms, statuses, sort, onApply }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['70%'], []);
  const [draftPlatforms, setDraftPlatforms] = useState<ChannelPlatform[]>(platforms);
  const [draftStatuses, setDraftStatuses] = useState<PublisherStatus[]>(statuses);
  const [draftSort, setDraftSort] = useState<IChannelSort>(sort);

  useImperativeHandle(ref, () => ({
    present: () => {
      setDraftPlatforms(platforms);
      setDraftStatuses(statuses);
      setDraftSort(sort);
      sheet.current?.present();
    },
  }));

  const togglePlatform = (p: ChannelPlatform) =>
    setDraftPlatforms((d) => (d.includes(p) ? d.filter((x) => x !== p) : [...d, p]));
  const toggleStatus = (s: PublisherStatus) =>
    setDraftStatuses((d) => (d.includes(s) ? d.filter((x) => x !== s) : [...d, s]));
  const pickSort = (v: Exclude<IChannelSort, null>) =>
    setDraftSort((cur) => (cur === v ? null : v));
  const reset = () => {
    setDraftPlatforms([]);
    setDraftStatuses([]);
    setDraftSort(null);
  };
  const apply = () => {
    onApply(draftPlatforms, draftStatuses, draftSort);
    sheet.current?.dismiss();
  };
  const count = draftPlatforms.length + draftStatuses.length + (draftSort ? 1 : 0);

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 }}>
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
          <Label>Platform</Label>
          <View className="mt-2.5 flex-row flex-wrap gap-2">
            {CHANNEL_PLATFORMS.map((p) => (
              <Chip key={p} label={PLATFORM[p].label} active={draftPlatforms.includes(p)} onPress={() => togglePlatform(p)} />
            ))}
          </View>
        </View>

        <View className="mt-5">
          <Label>Status</Label>
          <View className="mt-2.5 flex-row flex-wrap gap-2">
            {PUBLISHER_STATUSES.map((s) => (
              <Chip key={s} label={STATUS_LABEL[s]} active={draftStatuses.includes(s)} onPress={() => toggleStatus(s)} />
            ))}
          </View>
        </View>

        <View className="mt-5">
          <Label>Sort by followers</Label>
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
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

ChannelFiltersSheet.displayName = 'ChannelFiltersSheet';
