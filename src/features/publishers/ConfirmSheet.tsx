import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';

// Cross-platform confirm (the web uses a confirm dialog; RN's Alert.alert doesn't
// render on web, where we preview — so this is a small bottom sheet instead). Shared
// by single-row delete and bulk delete.
export type ConfirmConfig = {
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

export type ConfirmSheetHandle = { present: (config: ConfirmConfig) => void };

export const ConfirmSheet = forwardRef<ConfirmSheetHandle>((_, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['30%'], []);
  const [config, setConfig] = useState<ConfirmConfig | null>(null);

  useImperativeHandle(ref, () => ({
    present: (c) => {
      setConfig(c);
      sheet.current?.present();
    },
  }));

  const dismiss = () => sheet.current?.dismiss();
  const confirm = () => {
    config?.onConfirm();
    dismiss();
  };

  const destructive = config?.destructive ?? true;

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetView>
        <View className="px-4 pb-10 pt-1">
          <Txt weight="bold" className="text-[18px]">
            {config?.title ?? ''}
          </Txt>
          {config?.message && (
            <Txt className="mt-2 text-[13px] text-ink-3">{config.message}</Txt>
          )}

          <View className="mt-6 gap-2">
            <Pressable
              onPress={confirm}
              className={`items-center rounded-full py-3.5 ${destructive ? 'bg-[#e34948]' : 'bg-ink'}`}>
              <Txt weight="semibold" className="text-[14px] text-white">
                {config?.confirmLabel ?? 'Delete'}
              </Txt>
            </Pressable>
            <Pressable
              onPress={dismiss}
              className="items-center rounded-full border border-border py-3.5">
              <Txt weight="semibold" className="text-[14px] text-ink-2">
                Cancel
              </Txt>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

ConfirmSheet.displayName = 'ConfirmSheet';
