import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { IconChevronLeft, IconExternalLink, IconX } from '@/components/navIcons';
import { Divider } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { colors, sentiment } from '@/theme/tokens';
import type { IReportStory } from '@/types';

const TONE = { pos: sentiment.positive, neu: colors.ink3, neg: sentiment.negative };
const TONE_LABEL = { pos: 'Positive', neu: 'Neutral', neg: 'Negative' };
const fmtPhp = (n: number) => `PHP ${(n / 1e6).toFixed(1)}M`;

export type DrillPayload = { title: string; sub?: string; stories: IReportStory[]; focusId?: string };
export type ClientReportDrillHandle = { present: (p: DrillPayload) => void };

// A drill sheet for the client report — the list of articles behind a figure/issue, and one
// article's detail (web: the EvidenceNodes pane). List ↔ detail, Back returns to the list.
export const ClientReportDrillSheet = forwardRef<ClientReportDrillHandle>((_props, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const [payload, setPayload] = useState<DrillPayload | null>(null);
  const [focus, setFocus] = useState<IReportStory | null>(null);

  useImperativeHandle(ref, () => ({
    present: (p) => {
      setPayload(p);
      setFocus(p.focusId ? (p.stories.find((s) => s.id === p.focusId) ?? null) : null);
      sheet.current?.present();
    },
  }));

  const stories = payload?.stories ?? [];

  return (
    <BottomSheetModal
      ref={sheet}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      {...sheetSurface}>
      <View style={{ flex: 1 }} className="px-4">
        {/* Header */}
        <View className="flex-row items-start justify-between py-1" style={{ gap: 8 }}>
          <View className="min-w-0 flex-1 flex-row items-center" style={{ gap: 6 }}>
            {focus && (
              <Pressable onPress={() => setFocus(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to list">
                <IconChevronLeft size={20} color={colors.ink} />
              </Pressable>
            )}
            <View className="min-w-0 flex-1">
              <Label>{focus ? 'Article' : 'Behind this figure'}</Label>
              <Txt variant="title" numberOfLines={1} className="mt-0.5">
                {focus ? focus.outlet : (payload?.title ?? '')}
              </Txt>
            </View>
          </View>
          <Pressable onPress={() => sheet.current?.dismiss()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close"
            className="h-8 w-8 items-center justify-center rounded-full active:bg-surface2">
            <IconX size={18} color={colors.ink3} />
          </Pressable>
        </View>

        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {focus ? (
            // ── Article detail ──
            <View className="pt-1">
              <Txt weight="bold" className="text-[16px] leading-[22px]">{focus.title}</Txt>
              <View className="mt-2 flex-row items-center flex-wrap" style={{ gap: 8 }}>
                <Txt variant="caption" className="text-ink-3">{focus.outlet} · {focus.date}</Txt>
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${TONE[focus.tone]}1f` }}>
                  <Txt weight="semibold" className="text-[10px]" style={{ color: TONE[focus.tone] }}>{TONE_LABEL[focus.tone]}</Txt>
                </View>
                <Txt mono weight="medium" className="text-[11px] text-ink-2">{fmtPhp(focus.ave)} AVE</Txt>
              </View>
              <Divider className="mt-3" />
              <Txt className="mt-3 text-[14px] leading-[21px] text-ink-2">{focus.snippet}</Txt>
              <View className="mt-4 flex-row items-center rounded-xl border border-border bg-surface2 px-3 py-2.5" style={{ gap: 8 }}>
                <IconExternalLink size={15} color={colors.ink3} />
                <Txt className="flex-1 text-[12px] text-ink-3">Opens the source article in Media Meter.</Txt>
              </View>
            </View>
          ) : (
            // ── Article list ──
            <View className="pt-1">
              {payload?.sub ? <Txt variant="caption" className="mb-2 text-ink-3">{payload.sub}</Txt> : null}
              {stories.map((s, i) => (
                <Pressable key={s.id} onPress={() => setFocus(s)} accessibilityRole="button" className="active:bg-surface2">
                  {i > 0 && <Divider />}
                  <View className="flex-row items-start py-3" style={{ gap: 10 }}>
                    <View className="min-w-0 flex-1">
                      <Txt weight="semibold" numberOfLines={2} className="text-[13px] leading-[18px]">{s.title}</Txt>
                      <Txt variant="caption" className="mt-0.5 text-ink-3">{s.outlet} · {s.date}</Txt>
                    </View>
                    <View className="items-end">
                      <Txt mono weight="bold" className="text-[12px] text-ink">{fmtPhp(s.ave)}</Txt>
                      <Txt weight="semibold" className="mt-0.5 text-[10px]" style={{ color: TONE[s.tone] }}>{TONE_LABEL[s.tone]}</Txt>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
});

ClientReportDrillSheet.displayName = 'ClientReportDrillSheet';
