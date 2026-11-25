import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SectionHeader } from '@/components/SectionHeader';
import { Screen } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import { ClientReportCard } from '@/features/reports/client/ClientReportCard';
import { useClientReportCards } from '@/services/api/queries';
import { colors } from '@/theme/tokens';
import type { IClientReportCard } from '@/types';

// Global Reports section — the web's Media Meter → Reports: monthly client reports built on the
// same figures as the Dashboard and the Decision report. Each card opens a deep, tabbed report.
const INTRO =
  'Monthly client reports built on the same figures as the Dashboard and the Decision report. ' +
  'Each figure is labelled with where it comes from, and opens the stories and items behind it.';

export default function ReportsScreen() {
  const { data, isLoading } = useClientReportCards();
  const cards = data ?? [];

  const open = (reportId: string, extra?: Record<string, string>) =>
    router.push({ pathname: '/client-report/[reportId]', params: { reportId, ...(extra ?? {}) } });

  // Multi-month reports (EDCOM 2) go to the month picker first; single reports (PH auto) open directly.
  const openCard = (c: IClientReportCard) =>
    c.months.length > 0
      ? router.push({ pathname: '/report-months/[reportId]', params: { reportId: c.id } })
      : open(c.id);

  return (
    <Screen>
      <SectionHeader title="Reports" />
      {isLoading ? (
        <View className="gap-3 px-4 pt-2">
          <Skeleton className="h-[150px] rounded-card" />
          <Skeleton className="h-[150px] rounded-card" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}>
          <Txt className="mb-4 text-[13px] leading-[19px] text-ink-3">{INTRO}</Txt>
          {cards.map((c, i) => (
            <View key={c.id}>
              {(i === 0 || cards[i - 1].group !== c.group) && (
                <Txt mono weight="semibold" className="mb-2 mt-1 text-[11px] uppercase tracking-wide text-ink-3">
                  {c.group}
                </Txt>
              )}
              <ClientReportCard card={c} onOpen={() => openCard(c)} />
            </View>
          ))}
          <Pressable
            onPress={() => open('edcom2', { s: 'read' })}
            accessibilityRole="button"
            className="mt-2 self-start active:opacity-70">
            <Txt className="text-[13px]" style={{ color: colors.link }}>
              How these reports use Scoup metrics
            </Txt>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}
