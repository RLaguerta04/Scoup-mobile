import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { IconCheck } from '@/components/navIcons';
import { Label, Txt } from '@/components/ui/Txt';
import { useMentionsFilterStore } from '@/stores/mentionsFilterStore';
import { colors } from '@/theme/tokens';
import type { RankBy } from '@/types';
import { renderBackdrop, sheetSurface, type SheetHandle } from './sheet';

// Labels mirror the web's Rank-by dropdown (each says the order, most first).
const OPTIONS: { value: RankBy; label: string; hint: string }[] = [
  { value: 'articles', label: 'Most articles first', hint: 'Most press pickup' },
  { value: 'engagement', label: 'Highest score first', hint: 'Highest SharedView engagement' },
  { value: 'posts', label: 'Most posts first', hint: 'Most social posts' },
  { value: 'comments', label: 'Most comments first', hint: 'Most discussion' },
];

export const SortSheet = forwardRef<SheetHandle>((_, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  useImperativeHandle(ref, () => ({ present: () => sheet.current?.present() }));
  const snapPoints = useMemo(() => ['42%'], []);

  const rankBy = useMentionsFilterStore((s) => s.rankBy);
  const setRankBy = useMentionsFilterStore((s) => s.setRankBy);

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetView>
        <View className="px-4 pb-10">
          <Label>Rank by</Label>
          <View className="mt-3 gap-1.5">
            {OPTIONS.map((o) => {
              const active = o.value === rankBy;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    setRankBy(o.value);
                    sheet.current?.dismiss();
                  }}
                  className="flex-row items-center justify-between rounded-xl bg-surface2 px-3 py-3">
                  <View className="flex-1">
                    <Txt weight="semibold" className="text-[15px]">
                      {o.label}
                    </Txt>
                    <Txt className="mt-0.5 text-[12px] text-ink-3">{o.hint}</Txt>
                  </View>
                  {active && <IconCheck size={18} color={colors.ink} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

SortSheet.displayName = 'SortSheet';
