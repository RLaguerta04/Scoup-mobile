import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { IconPencil, IconTrash } from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { colors } from '@/theme/tokens';
import type { IChannel } from '@/types';

// The per-row overflow (⋯) menu — the web's TableActions dropdown. Edit / Delete.
export type ChannelActionsHandle = { present: (channel: IChannel) => void };

export const ChannelActionsSheet = forwardRef<
  ChannelActionsHandle,
  { onEdit: (c: IChannel) => void; onDelete: (c: IChannel) => void }
>(({ onEdit, onDelete }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['30%'], []);
  const [channel, setChannel] = useState<IChannel | null>(null);

  useImperativeHandle(ref, () => ({
    present: (c) => {
      setChannel(c);
      sheet.current?.present();
    },
  }));

  const run = (fn: (c: IChannel) => void) => () => {
    const c = channel;
    sheet.current?.dismiss();
    if (c) fn(c);
  };

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetView>
        <View className="px-4 pb-10 pt-1">
          <Txt weight="semibold" numberOfLines={1} className="text-[15px]">
            {channel?.handle ?? 'Channel'}
          </Txt>

          <View className="mt-4 gap-1.5">
            <Pressable
              onPress={run(onEdit)}
              className="flex-row items-center rounded-xl bg-surface2 px-3 py-3.5">
              <IconPencil size={19} color={colors.ink2} />
              <Txt weight="medium" className="ml-3 text-[14px]">
                Edit channel
              </Txt>
            </Pressable>
            <Pressable
              onPress={run(onDelete)}
              className="flex-row items-center rounded-xl bg-surface2 px-3 py-3.5">
              <IconTrash size={19} color="#e34948" />
              <Txt weight="medium" className="ml-3 text-[14px]" style={{ color: '#e34948' }}>
                Delete channel
              </Txt>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

ChannelActionsSheet.displayName = 'ChannelActionsSheet';
