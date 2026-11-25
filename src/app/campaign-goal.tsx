import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@/components/navIcons';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import {
  EvidenceSheet,
  type EvidenceSheetHandle,
} from '@/features/campaigns/detail/EvidenceSheet';
import { GoalDetailView } from '@/features/campaigns/detail/GoalDetailView';
import { useCampaignDetail } from '@/services/api/queries';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';

// One goal's detail, pushed from Home or the Goals list. The headline number opens the
// evidence sheet ("every number opens its evidence").
export default function CampaignGoalScreen() {
  const { campaignId, goalId } = useLocalSearchParams<{ campaignId: string; goalId: string }>();
  const { data: detail, isLoading } = useCampaignDetail(campaignId);
  const goal = detail?.goals?.find((g) => g.id === goalId) ?? null;
  const evidenceRef = useRef<EvidenceSheetHandle>(null);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="flex-row items-center gap-1 px-2 py-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <View className="min-w-0 flex-1">
          {!!detail && (
            <Txt variant="caption" numberOfLines={1} className="text-ink-3">
              {detail.name}
            </Txt>
          )}
          <Txt variant="title" numberOfLines={1}>
            {goal?.short ?? 'Goal'}
          </Txt>
        </View>
      </View>

      {isLoading ? (
        <View className="gap-3 px-4 pt-2">
          <Skeleton className="h-48 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </View>
      ) : !goal ? (
        <View className="flex-1 items-center justify-center">
          <EmptyState title="Goal not found" hint="This goal isn’t part of the evaluation." />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}>
          <GoalDetailView goal={goal} onOpenEvidence={() => evidenceRef.current?.present(goal.evidence)} />
        </ScrollView>
      )}

      <EvidenceSheet ref={evidenceRef} />
    </SafeAreaView>
  );
}
