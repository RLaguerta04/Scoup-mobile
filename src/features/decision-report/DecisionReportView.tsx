import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SegmentedControl } from '@/components/ui/controls';
import { Skeleton } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { useDecisionEdition } from '@/services/api/queries';
import { useSelectionStore } from '@/stores/selectionStore';
import { AlertsView } from './AlertsView';
import { BriefChainBar, type ReportMode } from './BriefChainBar';
import { BriefCountsStrip } from './BriefCountsStrip';
import { CrisesOpenPanel } from './CrisesOpenPanel';
import { DecisionStoryCard } from './DecisionStoryCard';
import { GoodNewsList } from './GoodNewsList';
import { VerdictTally } from './VerdictTally';
import { periodWord } from './verdict';
import type { ReportCadence, ReportVerdict } from '@/types';

// Daily / Weekly / Monthly cadence (web: ReportCadenceControl). The content-section tabs
// (How people felt / Across all stories / …) live on the story canvas, not here.
const CADENCES: { value: ReportCadence; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function BriefSkeleton() {
  return (
    <View className="gap-3 px-4 pt-3">
      <Skeleton className="h-8 w-44 rounded-full" />
      <Skeleton className="h-6 w-56 rounded-md" />
      <Skeleton className="h-16 rounded-card" />
      <Skeleton className="h-10 w-48 rounded-full" />
      <Skeleton className="h-24 rounded-card" />
      <Skeleton className="h-24 rounded-card" />
    </View>
  );
}

export function DecisionReportView() {
  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const [cadence, setCadence] = useState<ReportCadence>('weekly');
  const { data: edition, isLoading } = useDecisionEdition(newsletterId, cadence);

  const [mode, setMode] = useState<ReportMode>('brief');
  const [verdict, setVerdict] = useState<ReportVerdict | null>(null);

  const shown = useMemo(() => {
    if (!edition) return [];
    return verdict ? edition.stories.filter((s) => s.verdict === verdict) : edition.stories;
  }, [edition, verdict]);

  if (isLoading || !edition) {
    return (
      <View className="flex-1">
        <BriefSkeleton />
      </View>
    );
  }

  const toggleVerdict = (v: ReportVerdict) => setVerdict((cur) => (cur === v ? null : v));

  return (
    <View className="flex-1">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        {/* Mode row (brief ↔ alerts) + cadence switch */}
        <BriefChainBar edition={edition} mode={mode} onModeChange={setMode} />
        <View className="mt-3">
          <SegmentedControl options={CADENCES} value={cadence} onChange={setCadence} />
        </View>

        {/* Eyebrow + date + meta */}
        <Label className="mt-4">
          {edition.newsletterName} · {periodWord(cadence)} decision brief
        </Label>
        <Txt variant="title" className="mt-1">
          {edition.date}
        </Txt>
        <Txt variant="caption" className="mt-1 text-ink-3">
          {edition.periodLabel} · {edition.writtenAt} · {edition.persona}
        </Txt>

        {/* Counts strip */}
        <View className="mt-4">
          <BriefCountsStrip counts={edition.counts} />
        </View>

        {mode === 'alerts' ? (
          /* Alerts (hour-by-hour) mode */
          <View className="mt-5">
            <AlertsView
              alerts={edition.alerts}
              summary={edition.alertsSummary}
              trackers={edition.trackers}
            />
          </View>
        ) : (
          <>
            {/* Verdict tally */}
            <View className="mt-4">
              <VerdictTally counts={edition.verdictCounts} active={verdict} onToggle={toggleVerdict} />
            </View>

            {/* Crises open — the open crisis trackers, worst first (web: ReportCrisisCard) */}
            {edition.trackers.length > 0 && (
              <View className="mt-4">
                <CrisesOpenPanel trackers={edition.trackers} />
              </View>
            )}

            {/* Decide this week — the ranked list. The edition-wide sections (How people felt /
                Across all stories / Good news / The rest of the week) live on the story canvas's
                tabs, like the web's center column. */}
            <View className="mt-5">
              <View className="flex-row items-end justify-between">
                <Txt variant="section">Decide {periodWord(cadence)}</Txt>
                <Txt mono className="text-[10px] uppercase tracking-wider text-ink-3">
                  ranked by priority
                </Txt>
              </View>
              {verdict && (
                <Txt className="mt-1 text-[12px] text-ink-3">
                  Showing {shown.length} {verdict.toUpperCase()} — tap the tally again to clear.
                </Txt>
              )}
              <View className="mt-3">
                {shown.map((s, i) => (
                  <DecisionStoryCard key={s.id} story={s} isLast={i === shown.length - 1} />
                ))}
              </View>
              <GoodNewsList stories={edition.stories} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
