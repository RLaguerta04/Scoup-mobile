import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft, IconChevronRight } from '@/components/navIcons';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import { useClientReportCards, useClientReportMonths } from '@/services/api/queries';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';
import type { ClientReportId } from '@/types';

const CHANGE_COLOR = { up: '#159d72', down: '#e34948', flat: colors.ink3 } as const;

// "Pick a month" screen for a multi-month report (EDCOM 2) — the mobile take on the desktop
// sidebar's month list. Tapping a month opens that month's report. One step before the content,
// so the reader chooses the month first (not a cramped horizontal strip on top of the content).
export default function ReportMonthsScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: ClientReportId }>();
  const { data: cards } = useClientReportCards();
  const { data: months, isLoading } = useClientReportMonths(reportId);
  const card = cards?.find((c) => c.id === reportId);

  const openMonth = (key: string) =>
    router.push({ pathname: '/client-report/[reportId]', params: { reportId, m: key } });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center gap-1 px-2 py-2">
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Txt variant="caption" numberOfLines={1} className="text-ink-3">
            {card?.railLabel ?? 'Report'}
          </Txt>
          <Txt variant="title" numberOfLines={1}>
            {card?.title ?? 'Year-on-year review'}
          </Txt>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}>
        <Txt className="mb-3 text-[13px] leading-[19px] text-ink-3">
          Pick a month to open its report — {months?.length ?? ''} reported months, newest first.
        </Txt>

        {isLoading || !months ? (
          <View className="gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[72px] rounded-card" />
            ))}
          </View>
        ) : months.length === 0 ? (
          <EmptyState title="No months" hint="This report isn't segmented by month." />
        ) : (
          months.map((mo) => (
            <Pressable
              key={mo.key}
              onPress={() => openMonth(mo.key)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${mo.label}`}
              className="mb-2.5 flex-row items-center rounded-xl border border-border bg-surface px-4 py-3.5 active:opacity-80">
              <View className="min-w-0 flex-1">
                <Txt weight="bold" className="text-[16px] leading-[21px]">
                  {mo.label}
                </Txt>
                <View className="mt-1 flex-row flex-wrap items-center" style={{ gap: 6 }}>
                  <Txt className="text-[13px] text-ink-2">{mo.articles} articles</Txt>
                  {mo.change !== '—' ? (
                    <Txt weight="semibold" className="text-[13px]" style={{ color: CHANGE_COLOR[mo.changeTone] }}>
                      {mo.change} vs 2025
                    </Txt>
                  ) : null}
                  <Txt className="text-[13px] text-ink-3">· {mo.ave} AVE</Txt>
                </View>
              </View>
              <IconChevronRight size={20} color={colors.ink3} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
