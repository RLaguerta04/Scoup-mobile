import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Chip } from '@/components/ui/controls';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import type { ChannelPlatform } from '@/types';
import { CHANNEL_PLATFORMS, PLATFORM } from './platform';

// Multi-select platform filter — the mobile form of the web's platform column filter.
// Draft is held locally and only committed on Apply (matches PublisherStatusSheet).
export type PlatformSheetHandle = { present: () => void };

export const ChannelPlatformSheet = forwardRef<
  PlatformSheetHandle,
  { value: ChannelPlatform[]; onApply: (next: ChannelPlatform[]) => void }
>(({ value, onApply }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['42%'], []);
  const [draft, setDraft] = useState<ChannelPlatform[]>(value);

  useImperativeHandle(ref, () => ({
    present: () => {
      setDraft(value);
      sheet.current?.present();
    },
  }));

  const toggle = (p: ChannelPlatform) =>
    setDraft((d) => (d.includes(p) ? d.filter((x) => x !== p) : [...d, p]));

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
              Filter by platform
            </Txt>
            <Pressable onPress={() => setDraft([])} hitSlop={8}>
              <Txt weight="medium" className="text-[13px] text-ink-3">
                Reset
              </Txt>
            </Pressable>
          </View>

          <View className="mt-4">
            <Label>Platform</Label>
            <View className="mt-2.5 flex-row flex-wrap gap-2">
              {CHANNEL_PLATFORMS.map((p) => (
                <Chip
                  key={p}
                  label={PLATFORM[p].label}
                  active={draft.includes(p)}
                  onPress={() => toggle(p)}
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

ChannelPlatformSheet.displayName = 'ChannelPlatformSheet';
