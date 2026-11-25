import { useRef } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { SectionHeader } from '@/components/SectionHeader';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/components/sheets/ConfirmSheet';
import { Screen } from '@/components/ui/Card';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import { IconPlus } from '@/components/navIcons';
import { CampaignCard } from '@/features/campaigns/CampaignCard';
import { useCampaigns, useCreateCampaign, useDeleteCampaign } from '@/services/api/queries';
import { colors } from '@/theme/tokens';
import type { ICampaignSummary } from '@/types';

// Mirrors the web's Campaigns top-nav section (page heading "Evaluations"). Not
// newsletter-scoped. Each card evaluates a campaign against its brief, week by week.
const INTRO =
  'Each evaluation starts with a brief: what you are launching, six goals and their ' +
  'targets, locked on the client’s say-so before launch. From launch day the app answers ' +
  'three questions each week: are we on track, what changed since Monday, what to do now. ' +
  'Every number opens its evidence.';

function SkeletonList() {
  return (
    <View style={{ gap: 14 }}>
      <Skeleton className="h-36 rounded-card" />
      <Skeleton className="h-36 rounded-card" />
      <Skeleton className="h-36 rounded-card" />
    </View>
  );
}

export default function CampaignsScreen() {
  const { data, isLoading } = useCampaigns();
  const campaigns = data ?? [];
  const deleteMut = useDeleteCampaign();
  const createMut = useCreateCampaign();
  const confirmRef = useRef<ConfirmSheetHandle>(null);

  // "+ New evaluation" — create a blank draft, then open its brief builder (web parity).
  const handleNew = () =>
    createMut.mutate(undefined, {
      onSuccess: ({ id }) => router.push({ pathname: '/campaign-brief', params: { id } }),
    });

  const handleDelete = (c: ICampaignSummary) =>
    confirmRef.current?.present({
      title: `Delete “${c.name}”?`,
      message: 'This removes the evaluation and its brief. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => deleteMut.mutate(c.id),
    });

  return (
    <Screen>
      <SectionHeader
        title="Evaluations"
        action={
          <Pressable
            onPress={handleNew}
            hitSlop={6}
            accessibilityLabel="New evaluation"
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.ink }}>
            <IconPlus size={18} color="#ffffff" />
          </Pressable>
        }
      />
      <FlatList
        style={{ flex: 1 }}
        data={isLoading ? [] : campaigns}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <CampaignCard campaign={item} onDelete={() => handleDelete(item)} />
        )}
        ListHeaderComponent={
          <View className="pb-3.5 pt-1">
            <Txt className="text-[13px] leading-[19px] text-ink-3">{INTRO}</Txt>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <SkeletonList />
          ) : (
            <EmptyState
              title="Nothing on the meter yet"
              hint="Your evaluations will show up here."
            />
          )
        }
        ItemSeparatorComponent={() => <View className="h-3.5" />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      />
      <ConfirmSheet ref={confirmRef} />
    </Screen>
  );
}
