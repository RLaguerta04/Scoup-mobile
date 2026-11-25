import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@/components/navIcons';
import { SegmentedControl } from '@/components/ui/controls';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import { CampaignBriefRead } from '@/features/campaigns/detail/CampaignBriefRead';
import { CampaignGoals } from '@/features/campaigns/detail/CampaignGoals';
import { CampaignHome } from '@/features/campaigns/detail/CampaignHome';
import { CampaignReport } from '@/features/campaigns/detail/CampaignReport';
import { useCampaignDetail } from '@/services/api/queries';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';

type Tab = 'home' | 'goals' | 'report';
const TABS = [
  { value: 'home' as const, label: 'Home' },
  { value: 'goals' as const, label: 'Goals' },
  { value: 'report' as const, label: 'Report' },
];

// The Evaluation detail — mirrors the web's phone layout: Home (weekly answer) / Goals /
// Report for live campaigns, or a Brief/Background read before launch.
export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: detail, isLoading } = useCampaignDetail(id);
  const [tab, setTab] = useState<Tab>('home');

  const openGoal = (goalId: string) =>
    router.push({ pathname: '/campaign-goal', params: { campaignId: id, goalId } });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center gap-1 px-2 py-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Txt variant="title" numberOfLines={1}>
            {detail?.name ?? 'Evaluation'}
          </Txt>
          {!!detail && (
            <Txt variant="caption" numberOfLines={1} className="text-ink-3">
              {detail.brand} · {detail.phase.big}
            </Txt>
          )}
        </View>
      </View>

      {/* Tabs (live campaigns only) */}
      {detail?.hasFigures && (
        <View className="px-4 pb-2 pt-1">
          <SegmentedControl options={TABS} value={tab} onChange={(v) => setTab(v as Tab)} />
        </View>
      )}

      {isLoading ? (
        <View className="gap-3 px-4 pt-2">
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </View>
      ) : !detail ? (
        <View className="flex-1 items-center justify-center">
          <EmptyState title="Evaluation not found" hint="This evaluation may have been deleted." />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}>
          {!detail.hasFigures && detail.brief ? (
            <CampaignBriefRead brief={detail.brief} />
          ) : tab === 'home' ? (
            <CampaignHome detail={detail} onOpenGoal={openGoal} />
          ) : tab === 'goals' ? (
            <CampaignGoals detail={detail} onOpenGoal={openGoal} />
          ) : detail.report ? (
            <CampaignReport report={detail.report} />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
