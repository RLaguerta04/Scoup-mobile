import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { colors } from '@/theme/tokens';
import type { IPersona } from '@/types';

// Add / Edit a persona. The web builds personas through an AI chat; on mobile this is a
// lean form that captures the same fields the dossiers are built from (name, role, org,
// coverage focus, monitoring prompt). Opened imperatively with an optional persona to edit.
export type PersonaFormValues = {
  id?: string;
  name: string;
  role: string;
  org: string;
  focus: string;
  prompt: string;
};
export type PersonaFormHandle = { present: (persona?: IPersona) => void };

const inputClass = 'mt-1.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink';
const multilineClass = `${inputClass} h-24`;

export const PersonaFormSheet = forwardRef<
  PersonaFormHandle,
  { onSubmit: (values: PersonaFormValues) => void }
>(({ onSubmit }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['88%'], []);

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [org, setOrg] = useState('');
  const [focus, setFocus] = useState('');
  const [prompt, setPrompt] = useState('');
  const [touched, setTouched] = useState(false);

  useImperativeHandle(ref, () => ({
    present: (persona) => {
      setEditingId(persona?.id);
      setName(persona?.name ?? '');
      setRole(persona?.role ?? '');
      setOrg(persona?.org ?? '');
      setFocus(persona?.coverageFocus ?? '');
      setPrompt(persona?.prompt ?? '');
      setTouched(false);
      sheet.current?.present();
    },
  }));

  const isEdit = editingId != null;
  const canSubmit = name.trim().length > 0;

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      id: editingId,
      name: name.trim(),
      role: role.trim(),
      org: org.trim(),
      focus: focus.trim(),
      prompt: prompt.trim(),
    });
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
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 }}>
        <Txt weight="bold" className="text-[18px]">{isEdit ? 'Edit persona' : 'New persona'}</Txt>
        <Txt className="mt-1 text-[12px] text-ink-3">
          The audience this analysis is written for — their role and priorities shape every brief.
        </Txt>

        <View className="mt-5">
          <Label>
            Name <Txt className="text-[11px] text-[#e34948]">*</Txt>
          </Label>
          <BottomSheetTextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Carmela Reyes"
            placeholderTextColor={colors.ink3}
            className={inputClass}
            style={{ fontFamily: 'Archivo_400Regular' }}
          />
        </View>

        <View className="mt-4">
          <Label>Role</Label>
          <BottomSheetTextInput
            value={role}
            onChangeText={setRole}
            placeholder="e.g. Head of Corporate Communications"
            placeholderTextColor={colors.ink3}
            className={inputClass}
            style={{ fontFamily: 'Archivo_400Regular' }}
          />
        </View>

        <View className="mt-4">
          <Label>Organisation</Label>
          <BottomSheetTextInput
            value={org}
            onChangeText={setOrg}
            placeholder="e.g. Globe Telecom"
            placeholderTextColor={colors.ink3}
            className={inputClass}
            style={{ fontFamily: 'Archivo_400Regular' }}
          />
        </View>

        <View className="mt-4">
          <Label>Coverage focus</Label>
          <BottomSheetTextInput
            value={focus}
            onChangeText={setFocus}
            placeholder="What this persona watches — topics, competitors, risks."
            placeholderTextColor={colors.ink3}
            multiline
            className={multilineClass}
            style={{ fontFamily: 'Archivo_400Regular', textAlignVertical: 'top' }}
          />
        </View>

        <View className="mt-4">
          <Label>Monitoring prompt</Label>
          <BottomSheetTextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="How Scoup should brief this persona each day."
            placeholderTextColor={colors.ink3}
            multiline
            className={multilineClass}
            style={{ fontFamily: 'Archivo_400Regular', textAlignVertical: 'top' }}
          />
        </View>

        {touched && !canSubmit && (
          <Txt className="mt-2 text-[12px] text-[#e34948]">A name is required.</Txt>
        )}

        <Pressable
          onPress={submit}
          disabled={touched && !canSubmit}
          className={`mt-6 items-center rounded-full py-3.5 ${touched && !canSubmit ? 'bg-ink/40' : 'bg-ink'}`}>
          <Txt weight="semibold" className="text-[14px] text-white">
            {isEdit ? 'Save changes' : 'Create persona'}
          </Txt>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

PersonaFormSheet.displayName = 'PersonaFormSheet';
