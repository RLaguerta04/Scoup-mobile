import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { IconChevronLeft, IconChevronRight, IconX } from '@/components/navIcons';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { Divider } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { colors, sentiment } from '@/theme/tokens';
import { DrillCtx } from './DrillContext';
import { resolveDrill, type DrillData } from './resolveDrill';
import type { IDecisionEdition, IDecisionStory, IDecisionStoryDetail, IDrillNode, IDrillRecord } from '@/types';

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function RecordRow({ r, onPress }: { r: IDrillRecord; onPress?: () => void }) {
  const toneColor =
    r.tone === 'negative' ? sentiment.negative : r.tone === 'positive' ? sentiment.positive : colors.ink3;
  return (
    <Pressable onPress={onPress} disabled={!onPress} className={onPress ? 'active:bg-surface2' : ''}>
      <View className="flex-row items-start py-3" style={{ gap: 10 }}>
        <View className="flex-1">
          <Txt weight="semibold" numberOfLines={2} className="text-[13px] leading-[18px]">{r.title}</Txt>
          <Txt variant="caption" className="mt-0.5 text-ink-3">{r.meta}</Txt>
        </View>
        {(r.value || r.tone) && (
          <View className="items-end">
            {r.value ? <Txt mono weight="bold" className="text-[12px] text-ink">{r.value}</Txt> : null}
            {r.tone ? (
              <Txt weight="semibold" className="mt-0.5 text-[10px]" style={{ color: toneColor }}>{cap(r.tone)}</Txt>
            ) : null}
          </View>
        )}
        {onPress ? <IconChevronRight size={16} color={colors.ink3} style={{ marginTop: 2 }} /> : null}
      </View>
    </Pressable>
  );
}

// The provider wraps the drillable content, supplies the drill handler, and renders the one
// node sheet with its breadcrumb chain. openDrill(spec) resolves the spec and pushes a node;
// clicking an already-open spec trims the chain back to it (web: the "same spec trims back").
export function DrillProvider({
  edition,
  story,
  detail,
  onOpenStory,
  children,
}: {
  edition: IDecisionEdition;
  story: IDecisionStory;
  detail?: IDecisionStoryDetail;
  onOpenStory: (storyId: string) => void;
  children: ReactNode;
}) {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['60%', '92%'], []);
  const [chain, setChain] = useState<IDrillNode[]>([]);
  const [glanceOpen, setGlanceOpen] = useState(false);

  // Resolve against the latest loaded data (ref avoids a stale closure in the memoized
  // openDrill). Updated in an effect — never during render.
  const dataRef = useRef<DrillData>({ edition, story, detail });
  useEffect(() => {
    dataRef.current = { edition, story, detail };
  }, [edition, story, detail]);

  const openDrill = useCallback((spec: string) => {
    const resolved = resolveDrill(spec, dataRef.current);
    if (!resolved) return;
    setGlanceOpen(false);
    setChain((prev) => {
      const at = prev.findIndex((n) => n.spec === spec);
      return at >= 0 ? prev.slice(0, at + 1) : [...prev, resolved];
    });
    sheet.current?.present();
  }, []);

  const close = () => sheet.current?.dismiss();
  const back = () => setChain((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const goTo = (i: number) => setChain((prev) => prev.slice(0, i + 1));
  const jumpStory = (id: string) => {
    sheet.current?.dismiss();
    onOpenStory(id);
  };

  const node = chain[chain.length - 1];

  return (
    <DrillCtx.Provider value={openDrill}>
      {children}
      <BottomSheetModal
        ref={sheet}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={() => setChain([])}
        {...sheetSurface}>
        {node ? (
          <>
            {/* breadcrumb chain */}
            {chain.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingHorizontal: 16, alignItems: 'center' }}>
                {chain.map((n, i) => (
                  <View key={`${n.spec}-${i}`} className="flex-row items-center" style={{ gap: 6 }}>
                    {i > 0 && <Txt className="text-[11px] text-ink-3">›</Txt>}
                    <Pressable onPress={() => goTo(i)} hitSlop={4}>
                      <Txt
                        numberOfLines={1}
                        weight={i === chain.length - 1 ? 'semibold' : 'regular'}
                        className={`text-[11px] ${i === chain.length - 1 ? 'text-ink' : 'text-ink-3'}`}
                        style={{ maxWidth: 120 }}>
                        {n.title}
                      </Txt>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* header */}
            <View className="flex-row items-start px-4 pb-2 pt-1" style={{ gap: 8 }}>
              {chain.length > 1 && (
                <Pressable onPress={back} hitSlop={8} className="mt-0.5">
                  <IconChevronLeft size={20} color={colors.ink} />
                </Pressable>
              )}
              <View className="min-w-0 flex-1">
                <Txt weight="extrabold" numberOfLines={2} className="text-[17px] leading-[21px]">{node.title}</Txt>
                {node.count != null && (
                  <Txt variant="caption" className="mt-0.5 text-ink-3">
                    {node.count.toLocaleString()} {node.unit}
                    {node.count === 1 ? '' : 's'}
                  </Txt>
                )}
              </View>
              <Pressable onPress={close} hitSlop={8} className="mt-0.5">
                <IconX size={20} color={colors.ink3} />
              </Pressable>
            </View>
            <Divider className="mx-4" />

            <BottomSheetScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {node.reading && (
                <View className="rounded-card border border-border bg-surface2 p-3.5">
                  <Label>Scoup’s reading</Label>
                  <Txt variant="body" className="mt-1.5 text-ink-2">{node.reading}</Txt>
                  {node.readingSource && (
                    <Txt variant="caption" className="mt-1.5 text-ink-3">{node.readingSource}</Txt>
                  )}
                </View>
              )}

              {node.glance.length > 0 && (
                <View className="mt-4">
                  <Pressable onPress={() => setGlanceOpen((o) => !o)} className="flex-row items-center" style={{ gap: 6 }}>
                    <Txt mono className="text-[10px] text-ink-3">{glanceOpen ? '▾' : '▸'}</Txt>
                    <Label>At a glance</Label>
                  </Pressable>
                  {glanceOpen && (
                    <View className="mt-2" style={{ gap: 6 }}>
                      {node.glance.map((g) => (
                        <View key={g.label} className="flex-row items-center justify-between">
                          <Txt variant="caption" className="text-ink-3">{g.label}</Txt>
                          <Txt mono weight="semibold" className="text-[12px] text-ink">{g.value}</Txt>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {node.records.length > 0 ? (
                <View className="mt-4">
                  {node.records.map((r, i) => (
                    <View key={r.id}>
                      <RecordRow
                        r={r}
                        onPress={
                          r.storyId
                            ? () => jumpStory(r.storyId!)
                            : r.spec
                              ? () => openDrill(r.spec!)
                              : undefined
                        }
                      />
                      {i < node.records.length - 1 && <Divider />}
                    </View>
                  ))}
                </View>
              ) : node.empty && node.chips.length === 0 ? (
                <Txt variant="body" className="mt-4 text-ink-3">{node.empty}</Txt>
              ) : null}

              {node.chips.length > 0 && (
                <View className="mt-5">
                  <Label>Open the next node</Label>
                  <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
                    {node.chips.map((c) => (
                      <Pressable
                        key={c.spec}
                        onPress={() => openDrill(c.spec)}
                        className="flex-row items-center rounded-full border border-border bg-surface px-3 py-1.5 active:bg-surface2"
                        style={{ gap: 6 }}>
                        <Txt weight="medium" className="text-[12px] text-ink-2">{c.label}</Txt>
                        {c.count != null && (
                          <Txt mono weight="bold" className="text-[11px] text-ink-3">{c.count}</Txt>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <Txt variant="caption" className="mt-6 text-ink-3">
                Tap a record or chip to open the next node.
              </Txt>
            </BottomSheetScrollView>
          </>
        ) : null}
      </BottomSheetModal>
    </DrillCtx.Provider>
  );
}
