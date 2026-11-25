import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { colors } from '@/theme/tokens';

// "New Recipient Group" — the mobile equivalent of the web's RecipientGroupModal.
// Creates the shell (name + optional description); members are added afterward on the
// detail screen. Name is required.
export type RecipientGroupFormHandle = { present: () => void };

export const RecipientGroupFormSheet = forwardRef<
  RecipientGroupFormHandle,
  { onSubmit: (values: { name: string; description: string }) => void }
>(({ onSubmit }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['62%'], []);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  useImperativeHandle(ref, () => ({
    present: () => {
      setName('');
      setDescription('');
      setTouched(false);
      sheet.current?.present();
    },
  }));

  const canSubmit = name.trim().length > 0;
  const error = touched && !canSubmit ? 'Group name is required' : null;

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), description: description.trim() });
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
          <Txt weight="bold" className="text-[18px]">
            New recipient group
          </Txt>
          <Txt className="mt-1 text-[12px] text-ink-3">
            Create a reusable email list you can drop into any sendout.
          </Txt>

          <View className="mt-5">
            <Label>
              Group name <Txt className="text-[11px] text-[#e34948]">*</Txt>
            </Label>
            <BottomSheetTextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. PLDT Core Team"
              placeholderTextColor={colors.ink3}
              className="mt-1.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink"
              style={{ fontFamily: 'Archivo_400Regular' }}
            />
          </View>

          <View className="mt-4">
            <Label>
              Description <Txt className="text-[11px] text-ink-3">(optional)</Txt>
            </Label>
            <BottomSheetTextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Primary distribution list for PLDT daily briefs"
              placeholderTextColor={colors.ink3}
              multiline
              className="mt-1.5 h-20 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink"
              style={{ fontFamily: 'Archivo_400Regular', textAlignVertical: 'top' }}
            />
          </View>

          {error && <Txt className="mt-2 text-[12px] text-[#e34948]">{error}</Txt>}

          <Pressable
            onPress={submit}
            disabled={touched && !canSubmit}
            className={`mt-6 items-center rounded-full py-3.5 ${touched && !canSubmit ? 'bg-ink/40' : 'bg-ink'}`}>
            <Txt weight="semibold" className="text-[14px] text-white">
              Create group
            </Txt>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

RecipientGroupFormSheet.displayName = 'RecipientGroupFormSheet';
