import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { IconCheck, IconChevronDown } from '@/components/navIcons';
import { Label, Txt } from '@/components/ui/Txt';
import { useNewsletterTree } from '@/services/api/queries';
import { useSelectionStore } from '@/stores/selectionStore';
import { colors } from '@/theme/tokens';
import { renderBackdrop, sheetSurface, type SheetHandle } from './sheet';

// Up-to-two-letter badge from a bucket name (mirrors the web tree's row icon).
const initials = (name: string): string => {
  const words = name.split(/\s+/).filter((w) => /^[a-z0-9]/i.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? name).slice(0, 2).toUpperCase();
};

/**
 * The mobile newsletter switcher — the equivalent of the web's NewsletterTree.
 * Each newsletter expands to its buckets; tapping a newsletter scopes to the whole
 * thing, tapping a bucket narrows to that keyword group. Both show story counts.
 */
export const NewsletterSheet = forwardRef<SheetHandle>((_, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['70%'], []);

  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const bucketId = useSelectionStore((s) => s.bucketId);
  const selectNewsletter = useSelectionStore((s) => s.selectNewsletter);
  const selectBucket = useSelectionStore((s) => s.selectBucket);
  const { data: tree = [] } = useNewsletterTree();

  // Only rows the viewer toggled; the current newsletter starts open.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useImperativeHandle(ref, () => ({
    present: () => {
      setOpen((o) => ({ ...o, [newsletterId]: true }));
      sheet.current?.present();
    },
  }));

  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !(o[id] ?? id === newsletterId) }));
  const pickNewsletter = (id: string) => {
    selectNewsletter(id);
    sheet.current?.dismiss();
  };
  const pickBucket = (nlId: string, bId: number) => {
    selectBucket(nlId, bId);
    sheet.current?.dismiss();
  };

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetScrollView>
        <View className="px-4 pb-12 pt-1">
          <View className="flex-row items-center justify-between px-1 pb-1.5">
            <Label>Newsletters</Label>
            <Txt mono weight="medium" className="text-[11px] text-ink-3">
              {tree.length}
            </Txt>
          </View>

          {tree.map((n) => {
            const isOpen = open[n.id] ?? n.id === newsletterId;
            const nlOn = n.id === newsletterId && bucketId == null;
            return (
              <View key={n.id}>
                <View className={`flex-row items-center rounded-xl pl-0.5 ${nlOn ? 'bg-surface2' : ''}`}>
                  <Pressable
                    onPress={() => toggle(n.id)}
                    hitSlop={8}
                    accessibilityLabel={`${isOpen ? 'Collapse' : 'Expand'} ${n.name}`}
                    className="h-9 w-9 items-center justify-center rounded-lg">
                    <IconChevronDown
                      size={16}
                      color={colors.ink3}
                      style={{ transform: [{ rotate: isOpen ? '0deg' : '-90deg' }] }}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => pickNewsletter(n.id)}
                    className="flex-1 flex-row items-center py-2.5 pr-2"
                    style={n.storyCount === 0 ? { opacity: 0.55 } : undefined}>
                    <Txt weight="semibold" numberOfLines={1} className="flex-1 text-[15px]">
                      {n.name}
                    </Txt>
                    {nlOn && <IconCheck size={16} color={colors.ink} style={{ marginRight: 8 }} />}
                    <Txt mono className="text-[12px] text-ink-3">
                      {n.storyCount}
                    </Txt>
                  </Pressable>
                </View>

                {isOpen && (
                  <View className="mb-1">
                    {n.buckets.map((b) => {
                      const bOn = n.id === newsletterId && bucketId === b.id;
                      return (
                        <Pressable
                          key={b.id}
                          onPress={() => pickBucket(n.id, b.id)}
                          className={`ml-9 flex-row items-center rounded-xl px-2 py-2 ${bOn ? 'bg-surface2' : ''}`}
                          style={b.storyCount === 0 ? { opacity: 0.55 } : undefined}>
                          <View className="h-6 w-6 items-center justify-center rounded-md bg-surface3">
                            <Txt mono weight="bold" className="text-[9px] text-ink-3">
                              {initials(b.name)}
                            </Txt>
                          </View>
                          <Txt numberOfLines={1} className="ml-2.5 flex-1 text-[13px] text-ink-2">
                            {b.name}
                          </Txt>
                          {bOn && <IconCheck size={15} color={colors.ink} style={{ marginRight: 8 }} />}
                          <Txt mono className="text-[12px] text-ink-3">
                            {b.storyCount}
                          </Txt>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

NewsletterSheet.displayName = 'NewsletterSheet';
