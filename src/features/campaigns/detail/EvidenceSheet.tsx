import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SegmentedControl } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import type { ICampaignEvidence } from '@/types';

export type EvidenceSheetHandle = { present: (evidence: ICampaignEvidence) => void };

type Tab = 'story' | 'items';

// The evidence sheet behind a number — Story (why the number reads this way) + Items (the
// coded stories behind it). The web's CampaignSheet, as a mobile bottom sheet.
export const EvidenceSheet = forwardRef<EvidenceSheetHandle>((_, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['70%'], []);
  const [evidence, setEvidence] = useState<ICampaignEvidence | null>(null);
  const [tab, setTab] = useState<Tab>('story');

  useImperativeHandle(ref, () => ({
    present: (ev) => {
      setEvidence(ev);
      setTab('story');
      sheet.current?.present();
    },
  }));

  return (
    <BottomSheetModal
      ref={sheet}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      {...sheetSurface}>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <Txt weight="bold" className="pt-1 text-[18px]">
          {evidence?.title ?? 'Evidence'}
        </Txt>

        <View className="mt-3">
          <SegmentedControl
            options={[
              { value: 'story', label: 'Story' },
              { value: 'items', label: `Items`, count: evidence?.items.length },
            ]}
            value={tab}
            onChange={(v) => setTab(v as Tab)}
          />
        </View>

        {tab === 'story' ? (
          <View className="mt-4 gap-3">
            {(evidence?.story ?? []).map((p, i) => (
              <Txt key={i} className="text-[14px] leading-[21px] text-ink">
                {p}
              </Txt>
            ))}
          </View>
        ) : (
          <View className="mt-4 gap-2.5">
            {(evidence?.items ?? []).length === 0 ? (
              <Txt className="text-[13px] text-ink-3">No coded items behind this number yet.</Txt>
            ) : (
              evidence?.items.map((it, i) => (
                <View key={i} className="rounded-xl border border-border bg-surface p-3">
                  <Txt weight="semibold" className="text-[14px] leading-[19px]">
                    {it.headline}
                  </Txt>
                  <View className="mt-1 flex-row items-center gap-2">
                    <Txt className="text-[12px] text-ink-3">{it.outlet}</Txt>
                    {it.tone && (
                      <>
                        <Txt className="text-[12px] text-ink-3">·</Txt>
                        <Txt weight="medium" className="text-[12px] text-ink-2">
                          {it.tone}
                        </Txt>
                      </>
                    )}
                  </View>
                  {it.summary && (
                    <Txt className="mt-1 text-[12px] leading-[17px] text-ink-2">{it.summary}</Txt>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

EvidenceSheet.displayName = 'EvidenceSheet';
