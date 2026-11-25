import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { colors } from '@/theme/tokens';
import type { IBucketGroupSummary } from '@/types';

// New / edit a multi-bucket "Bucket group": a name + a checkbox list picking ≥2 member
// buckets (web: GroupBucketsModal). Opened imperatively with the bucket options.
export type GroupFormConfig = {
  buckets: { id: number; name: string }[];
  existing?: IBucketGroupSummary;
};
export type GroupFormHandle = { present: (config: GroupFormConfig) => void };

export const GroupFormSheet = forwardRef<
  GroupFormHandle,
  { onSubmit: (values: { id?: string; name: string; bucketIds: number[] }) => void }
>(({ onSubmit }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['72%'], []);
  const [buckets, setBuckets] = useState<{ id: number; name: string }[]>([]);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [touched, setTouched] = useState(false);

  useImperativeHandle(ref, () => ({
    present: (c) => {
      setBuckets(c.buckets);
      setEditId(c.existing?.id);
      setName(c.existing?.name ?? '');
      setSelected(new Set(c.existing?.bucketIds ?? []));
      setTouched(false);
      sheet.current?.present();
    },
  }));

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const canSubmit = name.trim().length > 0 && selected.size >= 2;
  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({ id: editId, name: name.trim(), bucketIds: [...selected] });
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
        <Txt weight="bold" className="text-[18px]">{editId ? 'Edit group' : 'New group'}</Txt>
        <Txt className="mt-1 text-[12px] text-ink-3">
          Each group gets its own Landscape page, comparing its buckets with each other.
        </Txt>

        <View className="mt-5">
          <Label>
            Group name <Txt className="text-[11px] text-[#e34948]">*</Txt>
          </Label>
          <BottomSheetTextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Competitor Benchmark"
            placeholderTextColor={colors.ink3}
            className="mt-1.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] text-ink"
            style={{ fontFamily: 'Archivo_400Regular' }}
          />
        </View>

        <View className="mt-5">
          <Label>Buckets to compare (pick at least 2)</Label>
          <View className="mt-2 rounded-card border border-border bg-surface">
            {buckets.map((b, i) => (
              <Pressable
                key={b.id}
                onPress={() => toggle(b.id)}
                className={`flex-row items-center px-3.5 py-3 active:bg-surface2 ${i < buckets.length - 1 ? 'border-b border-border' : ''}`}
                style={{ gap: 10 }}>
                <Checkbox checked={selected.has(b.id)} onPress={() => toggle(b.id)} />
                <Txt weight="medium" numberOfLines={1} className="flex-1 text-[14px]">{b.name}</Txt>
              </Pressable>
            ))}
          </View>
        </View>

        {touched && !canSubmit && (
          <Txt className="mt-2 text-[12px] text-[#e34948]">Give the group a name and pick at least 2 buckets.</Txt>
        )}

        <Pressable
          onPress={submit}
          disabled={touched && !canSubmit}
          className={`mt-6 items-center rounded-full py-3.5 ${touched && !canSubmit ? 'bg-ink/40' : 'bg-ink'}`}>
          <Txt weight="semibold" className="text-[14px] text-white">{editId ? 'Save group' : 'Create group'}</Txt>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

GroupFormSheet.displayName = 'GroupFormSheet';
