import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { colors } from '@/theme/tokens';

// A generic name(+optional description) form sheet, opened imperatively with a per-use config.
// Used for Add bucket / Rename bucket / Rename newsletter.
export type NameFormConfig = {
  title: string;
  label?: string;
  placeholder?: string;
  initialName?: string;
  showDescription?: boolean;
  submitLabel?: string;
  onSubmit: (values: { name: string; description: string }) => void;
};
export type NameFormHandle = { present: (config: NameFormConfig) => void };

export const NameFormSheet = forwardRef<NameFormHandle>((_, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['55%'], []);
  const [config, setConfig] = useState<NameFormConfig | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  useImperativeHandle(ref, () => ({
    present: (c) => {
      setConfig(c);
      setName(c.initialName ?? '');
      setDescription('');
      setTouched(false);
      sheet.current?.present();
    },
  }));

  const canSubmit = name.trim().length > 0;
  const submit = () => {
    setTouched(true);
    if (!canSubmit || !config) return;
    config.onSubmit({ name: name.trim(), description: description.trim() });
    sheet.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={sheet}
      snapPoints={snapPoints}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      {...sheetSurface}>
      <BottomSheetView>
        <View className="px-4 pb-10 pt-1">
          <Txt weight="bold" className="text-[18px]">{config?.title ?? ''}</Txt>

          <View className="mt-5">
            <Label>
              {config?.label ?? 'Name'} <Txt className="text-[11px] text-[#e34948]">*</Txt>
            </Label>
            <BottomSheetTextInput
              value={name}
              onChangeText={setName}
              placeholder={config?.placeholder ?? 'Name'}
              placeholderTextColor={colors.ink3}
              className="mt-1.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink"
              style={{ fontFamily: 'Archivo_400Regular' }}
            />
          </View>

          {config?.showDescription && (
            <View className="mt-4">
              <Label>
                Description <Txt className="text-[11px] text-ink-3">(optional)</Txt>
              </Label>
              <BottomSheetTextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What this bucket tracks"
                placeholderTextColor={colors.ink3}
                multiline
                className="mt-1.5 h-20 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink"
                style={{ fontFamily: 'Archivo_400Regular', textAlignVertical: 'top' }}
              />
            </View>
          )}

          {touched && !canSubmit && (
            <Txt className="mt-2 text-[12px] text-[#e34948]">A name is required.</Txt>
          )}

          <Pressable
            onPress={submit}
            disabled={touched && !canSubmit}
            className={`mt-6 items-center rounded-full py-3.5 ${touched && !canSubmit ? 'bg-ink/40' : 'bg-ink'}`}>
            <Txt weight="semibold" className="text-[14px] text-white">{config?.submitLabel ?? 'Save'}</Txt>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

NameFormSheet.displayName = 'NameFormSheet';
