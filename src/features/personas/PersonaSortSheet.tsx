import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { renderBackdrop, sheetSurface, type SheetHandle } from '@/components/sheets/sheet';
import { Chip } from '@/components/ui/controls';
import { Label, Txt } from '@/components/ui/Txt';
import type { IPersonaSort } from '@/types';

// Three sort fields, each with its two directions, single-select across all six.
const GROUPS: { label: string; options: { value: IPersonaSort; label: string }[] }[] = [
  { label: 'Active', options: [{ value: 'active-newest', label: 'Newest' }, { value: 'active-oldest', label: 'Oldest' }] },
  { label: 'Name', options: [{ value: 'name-az', label: 'A–Z' }, { value: 'name-za', label: 'Z–A' }] },
  { label: 'Recently added', options: [{ value: 'recent-newest', label: 'Newest' }, { value: 'recent-oldest', label: 'Oldest' }] },
];

// Persona sort sheet — opened by the toolbar's filter icon. Tapping an option sets the sort
// and dismisses (single-select, like the Daily-feed Rank-by sheet).
export const PersonaSortSheet = forwardRef<
  SheetHandle,
  { sort: IPersonaSort; onChange: (sort: IPersonaSort) => void }
>(({ sort, onChange }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  useImperativeHandle(ref, () => ({ present: () => sheet.current?.present() }));
  const snapPoints = useMemo(() => ['52%'], []);

  const pick = (value: IPersonaSort) => {
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

PersonaSortSheet.displayName = 'PersonaSortSheet';
