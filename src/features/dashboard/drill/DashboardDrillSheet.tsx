import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { IconSearch, IconX } from '@/components/navIcons';
import { Chip, SegmentedControl } from '@/components/ui/controls';
import { Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { useDashboardDrill } from '@/services/api/queries';
import type { DateRange } from '@/lib/dateRange';
import { colors, tone as toneColor } from '@/theme/tokens';
import type { IDashRecord } from '@/types';

export type DashboardDrillHandle = { present: (spec: string) => void };

type Tab = 'analysis' | 'records';

const TONE_DOT: Record<IDashRecord['tone'], string> = {
  positive: toneColor.positive,
  neutral: colors.ink3,
  negative: toneColor.negative,
};

function RecordRow({ r }: { r: IDashRecord }) {
  return (
    <View className="px-4 py-3">
      <Txt weight="semibold" numberOfLines={2} className="text-[14px] leading-[19px]">
        {r.title}
      </Txt>
      <View className="mt-1 flex-row items-center">
        <Txt numberOfLines={1} className="flex-1 text-[11.5px] text-ink-3">
          {r.outlet} · {r.medium} · {r.date} · {r.author}
        </Txt>
        <View className="ml-2 flex-row items-center">
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: TONE_DOT[r.tone] }} />
          <Txt mono className="ml-1 text-[9.5px] uppercase tracking-wide text-ink-3">
            {r.tone}
          </Txt>
        </View>
      </View>
    </View>
  );
}

export const DashboardDrillSheet = forwardRef<
  DashboardDrillHandle,
  { newsletterId: string; range: DateRange }
>(({ newsletterId, range }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['65%', '92%'], []);

  const [spec, setSpec] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('records');
  const [search, setSearch] = useState('');
  const [media, setMedia] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    present: (next) => {
      setSpec(next);
      setTab('records');
      setSearch('');
      setMedia(null);
      sheet.current?.present();
    },
  }));

  const { data: drill, isLoading } = useDashboardDrill(newsletterId, range, spec);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (drill?.records ?? []).filter((r) => {
      if (media && r.medium !== media) return false;
      if (q && !`${r.title} ${r.outlet} ${r.author}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [drill, search, media]);

  const header = (
    <View className="px-4 pb-2 pt-1">
      <Txt weight="bold" numberOfLines={2} className="text-[18px] leading-[22px]">
        {drill?.title ?? '…'}
      </Txt>
      <Txt mono className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-3">
        {drill ? `${drill.subtitle} · ${drill.count} ${drill.unit}${drill.count === 1 ? '' : 's'}` : ' '}
      </Txt>

      <View className="mt-3">
        <SegmentedControl
          options={[
            { value: 'analysis' as Tab, label: 'Analysis' },
            { value: 'records' as Tab, label: 'Records', count: drill?.count },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
    </View>
  );

  return (
    <BottomSheetModal
      ref={sheet}
      snapPoints={snapPoints}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      {...sheetSurface}>
      {header}

      {tab === 'analysis' ? (
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}>
          {isLoading || !drill ? (
            <View className="pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-5 h-4 w-full" />
            </View>
          ) : (
            <View className="pt-1">
              {drill.analysis.map((section, i) => (
                <View
                  key={i}
                  className="mb-3 rounded-card border border-border bg-surface px-4 py-3.5">
                  <Txt weight="bold" className="text-[15px] leading-[20px]">
                    {section.title}
                  </Txt>
                  {!!section.subtitle && (
                    <Txt className="mt-0.5 text-[12px] text-ink-3">{section.subtitle}</Txt>
                  )}
                  {!!section.blurb && (
                    <Txt weight="semibold" className="mt-2.5 text-[13.5px] leading-[20px] text-ink">
                      {section.blurb}
                    </Txt>
                  )}
                  {section.bullets && section.bullets.length > 0 && (
                    <View className="mt-2.5">
                      {section.bullets.map((b, j) => (
                        <View key={j} className="mb-1.5 flex-row">
                          <Txt className="mr-2 text-[13px] leading-[19px] text-ink-3">•</Txt>
                          <Txt className="flex-1 text-[13px] leading-[19px] text-ink-2">{b}</Txt>
                        </View>
                      ))}
                    </View>
                  )}
                  {section.paras.map((p, j) => (
                    <Txt key={j} className="mt-2.5 text-[13px] leading-[19px] text-ink-2">
                      {p}
                    </Txt>
                  ))}
                </View>
              ))}
              <Pressable
                onPress={() => setTab('records')}
                className="mt-1 self-start rounded-full border border-border bg-surface px-3.5 py-2">
                <Txt weight="medium" className="text-[12.5px] text-ink">
                  See the {drill.count} {drill.unit}
                  {drill.count === 1 ? '' : 's'} ›
                </Txt>
              </Pressable>
            </View>
          )}
        </BottomSheetScrollView>
      ) : (
        <>
          {/* Search + media filter */}
          <View className="px-4 pb-2">
            <View className="flex-row items-center rounded-full border border-border bg-surface px-3.5 py-2.5">
              <IconSearch size={16} color={colors.ink3} />
              <BottomSheetTextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search titles…"
                placeholderTextColor={colors.ink3}
                autoCapitalize="none"
                autoCorrect={false}
                className="ml-2 flex-1 text-[14px] text-ink"
                style={{ fontFamily: 'Archivo_400Regular', padding: 0 }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <IconX size={15} color={colors.ink3} />
                </Pressable>
              )}
            </View>

            {drill && drill.media.length > 1 && (
              <View className="mt-2 flex-row flex-wrap gap-2">
                <Chip label="All media" active={media === null} onPress={() => setMedia(null)} />
                {drill.media.map((m) => (
                  <Chip key={m} label={m} active={media === m} onPress={() => setMedia(m)} />
                ))}
              </View>
            )}
          </View>

          <BottomSheetFlatList
            data={isLoading ? [] : filtered}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => <RecordRow r={item} />}
            ItemSeparatorComponent={() => <View className="mx-4 h-px bg-border" />}
            ListEmptyComponent={
              isLoading ? (
                <View className="px-4 pt-2">
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} className="py-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="mt-2 h-3 w-1/2" />
                    </View>
                  ))}
                </View>
              ) : (
                <View className="px-4 py-10 items-center">
                  <Txt className="text-[13px] text-ink-3">No records match your search.</Txt>
                </View>
              )
            }
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </>
      )}
    </BottomSheetModal>
  );
});

DashboardDrillSheet.displayName = 'DashboardDrillSheet';
