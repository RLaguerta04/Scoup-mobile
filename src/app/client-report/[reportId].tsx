import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@/components/navIcons';
import { UnderlineTabs } from '@/components/ui/controls';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import { Edcom2Tabs } from '@/features/reports/client/Edcom2Tabs';
import { AutoTabs } from '@/features/reports/client/AutoTabs';
import { GlanceBody } from '@/features/reports/client/GlanceBody';
import { ReportSectionView } from '@/features/reports/client/ReportSectionView';
import {
  ClientReportDrillSheet,
  type ClientReportDrillHandle,
} from '@/features/reports/client/ClientReportDrillSheet';
import { useClientReportDetail } from '@/services/api/queries';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';
import type { ClientReportId, IReportFigure, IReportPill, ReportMeasure, ReportPillTone } from '@/types';

const EDCOM2_DEEP_TABS = new Set(['yoy', 'issues', 'stories', 'stage', 'credit', 'voices', 'channels', 'tone']);
const AUTO_DEEP_TABS = new Set(['brands', 'nameplates', 'stories', 'h2h']);

const ORIGIN_LABEL: Record<string, string> = { mm: 'Media Meter', dash: 'Dashboard', decision: 'Decision report' };
const CHANGE_COLOR = { up: '#159d72', down: '#e34948', flat: colors.ink3 } as const;
const PILL_COLOR: Record<ReportPillTone, { bg: string; fg: string }> = {
  up: { bg: '#e9f7f0', fg: '#0f7a52' },
  down: { bg: '#fdeceb', fg: '#c0392b' },
  plain: { bg: colors.surface3, fg: colors.ink2 },
  line: { bg: 'transparent', fg: colors.ink3 },
};

function FigureTile({ figure }: { figure: IReportFigure }) {
  return (
    <View className="mb-2.5 w-[48%] rounded-xl border border-border bg-surface p-3">
      <View className="flex-row items-center" style={{ gap: 4 }}>
        <View className="size-1.5 rounded-full" style={{ backgroundColor: colors.link }} />
        <Txt mono weight="medium" className="text-[8.5px] uppercase tracking-wide text-ink-3">
          {ORIGIN_LABEL[figure.origin] ?? 'Media Meter'}
        </Txt>
      </View>
      <Txt className="mt-1 text-[12px] text-ink-3">{figure.label}</Txt>
      <Txt weight="bold" numberOfLines={2} className={figure.isVerdict ? 'mt-0.5 text-[15px] leading-[19px]' : 'mt-0.5 text-[20px]'}>
        {figure.value}
      </Txt>
      {figure.change ? (
        <Txt weight="semibold" className="mt-0.5 text-[12px]" style={{ color: CHANGE_COLOR[figure.changeTone ?? 'flat'] }}>
          {figure.change}
        </Txt>
      ) : null}
      {figure.sub ? <Txt className="mt-0.5 text-[11px] leading-[15px] text-ink-3">{figure.sub}</Txt> : null}
    </View>
  );
}

function PillRow({ pills }: { pills: IReportPill[] }) {
  if (pills.length === 0) return null;
  return (
    <View className="mt-2.5 flex-row flex-wrap" style={{ gap: 6 }}>
      {pills.map((p) => {
        const c = PILL_COLOR[p.tone];
        return (
          <View
            key={p.label}
            className="rounded-full px-2.5 py-1"
            style={{ backgroundColor: c.bg, borderWidth: p.tone === 'line' ? 1 : 0, borderColor: colors.border }}>
            <Txt weight="medium" className="text-[11px]" style={{ color: c.fg }}>{p.label}</Txt>
          </View>
        );
      })}
    </View>
  );
}

// Pushed client-report detail (web: ClientReportPage). Phase 1 = the shell: masthead + month
// selector (EDCOM 2) + tab bar + "At a glance" figures. The deep per-tab charts/drills land next.
export default function ClientReportScreen() {
  const { reportId, m, s } = useLocalSearchParams<{ reportId: ClientReportId; m?: string; s?: string }>();
  // The month is chosen on the previous "pick a month" screen and arrives as `?m` (back to change it).
  const month = m ?? null;
  const [tab, setTab] = useState<string>(s ?? 'glance');
  const [measure, setMeasure] = useState<ReportMeasure>('n');
  const drillRef = useRef<ClientReportDrillHandle>(null);

  const { data, isLoading } = useClientReportDetail(reportId, month);

  const tabOptions = useMemo(() => (data?.tabs ?? []).map((t) => ({ value: t.key, label: t.label })), [data]);
  const firstTabKey = data?.tabs[0]?.key ?? 'glance';
  const activeTab = data?.tabs.some((t) => t.key === tab) ? tab : firstTabKey;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center gap-1 px-2 py-2">
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Txt variant="caption" numberOfLines={1} className="text-ink-3">
            {data?.kicker ?? 'Report'}
          </Txt>
          <Txt variant="title" numberOfLines={1}>{data?.title ?? ' '}</Txt>
        </View>
      </View>

      {isLoading || !data ? (
        <View className="gap-3 px-4 pt-2">
          <Skeleton className="h-16 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </View>
      ) : (
        <View className="flex-1">
          {/* Tab bar — directly below the heading, fixed above the scrolling content */}
          <View className="border-b border-border">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              <UnderlineTabs options={tabOptions} value={activeTab} onChange={setTab} />
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Masthead — the Key figures + pills + sub-line; persists across tabs, below the fixed tab bar. */}
            <View className="px-4 pb-3 pt-3">
              <Txt variant="caption" className="text-ink-3">{data.sub}</Txt>
              <PillRow pills={data.pills} />
              <View className="mt-3 flex-row flex-wrap justify-between">
                {data.figures.map((f) => (
                  <FigureTile key={f.label} figure={f} />
                ))}
              </View>
            </View>

            {/* Tab content */}
            <View className="px-4 pb-2 pt-1">
              {activeTab === firstTabKey ? (
                data.glance ? (
                  <GlanceBody glance={data.glance} />
                ) : (
                  <Txt className="text-[13px] leading-[19px] text-ink-3">
                    The month at a glance is in the figures above. Use the tabs for the full breakdown.
                  </Txt>
                )
              ) : data.id === 'edcom2' && data.edcom2Tabs && EDCOM2_DEEP_TABS.has(activeTab) ? (
                <Edcom2Tabs data={data.edcom2Tabs} tab={activeTab} onDrill={(p) => drillRef.current?.present(p)} />
              ) : data.id === 'ph-auto' && data.autoTabs && AUTO_DEEP_TABS.has(activeTab) ? (
                <AutoTabs data={data.autoTabs} tab={activeTab} onDrill={(p) => drillRef.current?.present(p)} />
              ) : data.sections?.[activeTab] ? (
                <ReportSectionView
                  section={data.sections[activeTab]}
                  measure={measure}
                  onMeasureChange={setMeasure}
                  stories={data.edcom2Tabs?.stories ?? data.autoTabs?.stories ?? []}
                  onDrill={(p) => drillRef.current?.present(p)}
                />
              ) : (
                <View className="mt-10">
                  <EmptyState
                    title={`${data.tabs.find((t) => t.key === activeTab)?.label ?? 'This section'} — coming next`}
                    hint="This tab's charts and drill-downs are being ported. The figures and stories behind them land in the next update."
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      <ClientReportDrillSheet ref={drillRef} />
    </SafeAreaView>
  );
}
