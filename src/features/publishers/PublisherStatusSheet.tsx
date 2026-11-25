import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Chip } from '@/components/ui/controls';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { PUBLISHER_STATUSES, STATUS_LABEL, type PublisherStatus } from './status';

// Multi-select status filter — the mobile form of the web's StatusBadge column filter.
// Draft is held locally and only committed on Apply (matches FilterSheet).
export type StatusSheetHandle = { present: () => void };

export const PublisherStatusSheet = forwardRef<
  StatusSheetHandle,
  { value: PublisherStatus[]; onApply: (next: PublisherStatus[]) => void }
>(({ value, onApply }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['44%'], []);
  const [draft, setDraft] = useState<PublisherStatus[]>(value);

  useImperativeHandle(ref, () => ({
    present: () => {
      setDraft(value);
      sheet.current?.present();
    },
  }));

  const toggle = (s: PublisherStatus) =>
    setDraft((d) => (d.includes(s) ? d.filter((x) => x !== s) : [...d, s]));

  const apply = () => {
    onApply(draft);
    sheet.current?.dismiss();
  };

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetView>
        <View className="px-4 pb-10 pt-1">
          <View className="flex-row items-center justify-between py-1">
            <Txt weight="bold" className="text-[18px]">
              Filter by status
            </Txt>
            <Pressable onPress={() => setDraft([])} hitSlop={8}>
              <Txt weight="medium" className="text-[13px] text-ink-3">
                Reset
              </Txt>
            </Pressable>
          </View>

          <View className="mt-4">
            <Label>Status</Label>
            <View className="mt-2.5 flex-row flex-wrap gap-2">
              {PUBLISHER_STATUSES.map((s) => (
                <Chip
                  key={s}
                  label={STATUS_LABEL[s]}
                  active={draft.includes(s)}
                  onPress={() => toggle(s)}
                />
              ))}
            </View>
          </View>

          <Pressable onPress={apply} className="mt-6 items-center rounded-full bg-ink py-3.5">
            <Txt weight="semibold" className="text-[14px] text-white">
              {draft.length > 0 ? `Apply · ${draft.length}` : 'Apply'}
            </Txt>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

PublisherStatusSheet.displayName = 'PublisherStatusSheet';
