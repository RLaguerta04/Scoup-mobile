import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { renderBackdrop, sheetSurface, type SheetHandle } from '@/components/sheets/sheet';
import { Chip } from '@/components/ui/controls';
import { Label, Txt } from '@/components/ui/Txt';

export type BucketSort = 'newest' | 'oldest' | 'az' | 'za';

// Compact label for the toolbar button (shows the current sort, like the web's dropdown).
export const BUCKET_SORT_LABEL: Record<BucketSort, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  az: 'Name A–Z',
  za: 'Name Z–A',
};

const GROUPS: { label: string; options: { value: BucketSort; label: string }[] }[] = [
  { label: 'Date added', options: [{ value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }] },
  { label: 'Name', options: [{ value: 'az', label: 'A–Z' }, { value: 'za', label: 'Z–A' }] },
];

// Bucket sort sheet — the web's "Sort by" dropdown as a bottom sheet. Single-select; tapping
// an option sets the sort and dismisses.
export const BucketSortSheet = forwardRef<
  SheetHandle,
  { sort: BucketSort; onChange: (sort: BucketSort) => void }
>(({ sort, onChange }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  useImperativeHandle(ref, () => ({ present: () => sheet.current?.present() }));
  const snapPoints = useMemo(() => ['42%'], []);

  const pick = (value: BucketSort) => {
    onChange(value);
    sheet.current?.dismiss();
  };

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetView>
        <View className="px-4 pb-10">
          <Txt weight="bold" className="text-[18px]">
            Sort by
          </Txt>
          {GROUPS.map((g) => (
            <View key={g.label} className="mt-4">
              <Label>{g.label}</Label>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {g.options.map((o) => (
                  <Chip key={o.value} label={o.label} active={sort === o.value} onPress={() => pick(o.value)} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

BucketSortSheet.displayName = 'BucketSortSheet';
