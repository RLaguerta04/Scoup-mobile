import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { colors } from '@/theme/tokens';
import type { IPublisher } from '@/types';

// Add / Edit form — the mobile equivalent of the web's PublisherModal. Website URL is
// required and gets an https:// prefix if missing; name is optional (the backend can
// infer it). Opened imperatively with an optional publisher to edit.
export type PublisherFormHandle = { present: (publisher?: IPublisher) => void };

type FormValues = { id?: string; website_url: string; publisher_name: string };

const normalize = (raw: string): string => {
  const t = raw.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

const looksLikeUrl = (raw: string): boolean => {
  const url = normalize(raw);
  // host must have a dot and no spaces — matches the web's isValidUrl intent.
  return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url);
};

export const PublisherFormSheet = forwardRef<
  PublisherFormHandle,
  { onSubmit: (values: FormValues) => void }
>(({ onSubmit }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['58%'], []);

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  useImperativeHandle(ref, () => ({
    present: (publisher) => {
      setEditingId(publisher?.id);
      setUrl(publisher?.website_url ?? '');
      setName(publisher?.publisher_name ?? '');
      setTouched(false);
      sheet.current?.present();
    },
  }));

  const isEdit = editingId != null;
  const error =
    touched && url.trim().length === 0
      ? 'Website URL is required'
      : touched && !looksLikeUrl(url)
        ? 'Please enter a valid website URL'
        : null;
  const canSubmit = url.trim().length > 0 && looksLikeUrl(url);

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({ id: editingId, website_url: normalize(url), publisher_name: name.trim() });
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
            {isEdit ? 'Edit publisher' : 'Add publisher'}
          </Txt>
          <Txt className="mt-1 text-[12px] text-ink-3">
            {isEdit
              ? 'Update the outlet’s details.'
              : 'Add an outlet to supplement the publishers Scoup already tracks for you.'}
          </Txt>

          <View className="mt-5">
            <Label>
              Website URL <Txt className="text-[11px] text-[#e34948]">*</Txt>
            </Label>
            <BottomSheetTextInput
              value={url}
              onChangeText={setUrl}
              onBlur={() => setTouched(true)}
              placeholder="https://example.com"
              placeholderTextColor={colors.ink3}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="mt-1.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink"
              style={{ fontFamily: 'Archivo_400Regular' }}
            />
          </View>

          <View className="mt-4">
            <Label>Publisher name</Label>
            <BottomSheetTextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter publisher name"
              placeholderTextColor={colors.ink3}
              className="mt-1.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink"
              style={{ fontFamily: 'Archivo_400Regular' }}
            />
          </View>

          {error && (
            <Txt className="mt-2 text-[12px] text-[#e34948]">{error}</Txt>
          )}

          <Pressable
            onPress={submit}
            disabled={touched && !canSubmit}
            className={`mt-6 items-center rounded-full py-3.5 ${touched && !canSubmit ? 'bg-ink/40' : 'bg-ink'}`}>
            <Txt weight="semibold" className="text-[14px] text-white">
              {isEdit ? 'Save changes' : 'Add publisher'}
            </Txt>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

PublisherFormSheet.displayName = 'PublisherFormSheet';
