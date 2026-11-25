import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { IconPencil, IconTrash } from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { colors } from '@/theme/tokens';
import type { IPublisher } from '@/types';

// The per-row overflow (⋯) menu — the web's TableActions dropdown. Edit / Delete.
export type ActionsSheetHandle = { present: (publisher: IPublisher) => void };

export const PublisherActionsSheet = forwardRef<
  ActionsSheetHandle,
  { onEdit: (p: IPublisher) => void; onDelete: (p: IPublisher) => void }
>(({ onEdit, onDelete }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['30%'], []);
  const [publisher, setPublisher] = useState<IPublisher | null>(null);

  useImperativeHandle(ref, () => ({
    present: (p) => {
      setPublisher(p);
      sheet.current?.present();
    },
  }));

  const run = (fn: (p: IPublisher) => void) => () => {
    const p = publisher;
    sheet.current?.dismiss();
    if (p) fn(p);
  };

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetView>
        <View className="px-4 pb-10 pt-1">
          <Txt weight="semibold" numberOfLines={1} className="text-[15px]">
            {publisher?.publisher_name ?? 'Publisher'}
          </Txt>

          <View className="mt-4 gap-1.5">
            <Pressable
              onPress={run(onEdit)}
              className="flex-row items-center rounded-xl bg-surface2 px-3 py-3.5">
              <IconPencil size={19} color={colors.ink2} />
              <Txt weight="medium" className="ml-3 text-[14px]">
                Edit publisher
              </Txt>
            </Pressable>
            <Pressable
              onPress={run(onDelete)}
              className="flex-row items-center rounded-xl bg-surface2 px-3 py-3.5">
              <IconTrash size={19} color="#e34948" />
              <Txt weight="medium" className="ml-3 text-[14px]" style={{ color: '#e34948' }}>
                Delete publisher
              </Txt>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

PublisherActionsSheet.displayName = 'PublisherActionsSheet';
