import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { colors } from '@/theme/tokens';
import type { IChannel } from '@/types';

// Add / Edit form — the mobile equivalent of the web's InfluencerModal. The profile URL is
// required (platform is auto-detected from it); the source name is optional. Opened
// imperatively with an optional channel to edit.
export type ChannelFormHandle = { present: (channel?: IChannel) => void };

type FormValues = { id?: string; profile_url: string; name: string };

const normalize = (raw: string): string => {
  const t = raw.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

const looksLikeUrl = (raw: string): boolean => {
  const url = normalize(raw);
  return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url);
};

export const ChannelFormSheet = forwardRef<
  ChannelFormHandle,
  { onSubmit: (values: FormValues) => void }
>(({ onSubmit }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['58%'], []);

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  useImperativeHandle(ref, () => ({
    present: (channel) => {
      setEditingId(channel?.id);
      setUrl(channel?.profile_url ?? '');
      setName(channel?.name ?? '');
      setTouched(false);
      sheet.current?.present();
    },
  }));

  const isEdit = editingId != null;
  const error =
    touched && url.trim().length === 0
      ? 'Profile URL is required'
      : touched && !looksLikeUrl(url)
        ? 'Please enter a valid profile URL'
        : null;
  const canSubmit = url.trim().length > 0 && looksLikeUrl(url);

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({ id: editingId, profile_url: normalize(url), name: name.trim() });
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
            {isEdit ? 'Edit channel' : 'Add channel'}
          </Txt>
          <Txt className="mt-1 text-[12px] text-ink-3">
            {isEdit
              ? 'Update the account’s profile URL or name.'
              : 'Paste a Facebook, X, YouTube or Reddit profile URL — the platform is detected automatically.'}
          </Txt>

          <View className="mt-5">
            <Label>
              Profile URL <Txt className="text-[11px] text-[#e34948]">*</Txt>
            </Label>
            <BottomSheetTextInput
              value={url}
              onChangeText={setUrl}
              onBlur={() => setTouched(true)}
              placeholder="https://www.facebook.com/abscbnNEWS"
              placeholderTextColor={colors.ink3}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="mt-1.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink"
              style={{ fontFamily: 'Archivo_400Regular' }}
            />
          </View>

          <View className="mt-4">
            <Label>Source name</Label>
            <BottomSheetTextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter source name"
              placeholderTextColor={colors.ink3}
              className="mt-1.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink"
              style={{ fontFamily: 'Archivo_400Regular' }}
            />
          </View>

          {error && <Txt className="mt-2 text-[12px] text-[#e34948]">{error}</Txt>}

          <Pressable
            onPress={submit}
            disabled={touched && !canSubmit}
            className={`mt-6 items-center rounded-full py-3.5 ${touched && !canSubmit ? 'bg-ink/40' : 'bg-ink'}`}>
            <Txt weight="semibold" className="text-[14px] text-white">
              {isEdit ? 'Save changes' : 'Add channel'}
            </Txt>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

ChannelFormSheet.displayName = 'ChannelFormSheet';
