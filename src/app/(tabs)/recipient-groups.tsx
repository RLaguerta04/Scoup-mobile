import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SectionHeader } from '@/components/SectionHeader';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/components/sheets/ConfirmSheet';
import { Screen } from '@/components/ui/Card';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { IconPlus, IconSearch, IconX } from '@/components/navIcons';
import { RecipientGroupCard } from '@/features/recipients/RecipientGroupCard';
import { RecipientGroupFormSheet, type RecipientGroupFormHandle } from '@/features/recipients/RecipientGroupFormSheet';
import { SENDOUT_TYPE, SENDOUT_TYPE_ORDER } from '@/features/recipients/sendoutType';
import {
  useCreateRecipientGroup,
  useDeleteRecipientGroup,
  useRecipientGroups,
} from '@/services/api/queries';
import { colors } from '@/theme/tokens';
import type { IRecipientGroup } from '@/types';

// Global Recipient Groups section (mirrors the web's top-nav Recipient Groups page):
// reusable email lists, each with the sendouts it's wired into.
function Legend() {
  return (
    <View className="flex-row items-center justify-end" style={{ gap: 12 }}>
      <Label>Sendout type</Label>
      {SENDOUT_TYPE_ORDER.map((type) => {
        const s = SENDOUT_TYPE[type];
        return (
          <View key={type} className="flex-row items-center">
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.dot }} />
            <Txt mono weight="medium" className="ml-1.5 text-[10px] uppercase text-ink-3">
              {s.upper}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

function SkeletonList() {
  return (
    <View style={{ gap: 14 }}>
      <Skeleton className="h-44 rounded-card" />
      <Skeleton className="h-44 rounded-card" />
      <Skeleton className="h-36 rounded-card" />
    </View>
  );
}

export default function RecipientGroupsScreen() {
  const router = useRouter();
  const { data, isLoading } = useRecipientGroups();
  const groups = data ?? [];

  const [search, setSearch] = useState('');

  const createMut = useCreateRecipientGroup();
  const deleteMut = useDeleteRecipientGroup();

  const formRef = useRef<RecipientGroupFormHandle>(null);
  const confirmRef = useRef<ConfirmSheetHandle>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.members.some((m) => m.email.toLowerCase().includes(q)),
    );
  }, [groups, search]);

  const handleCreate = (values: { name: string; description: string }) =>
    createMut.mutate(values, {
      onSuccess: (group) =>
        router.push({ pathname: '/recipient-group/[id]', params: { id: group.id } }),
    });

  const confirmDelete = (g: IRecipientGroup) =>
    confirmRef.current?.present({
      title: `Delete "${g.name}"?`,
      message:
        g.used_in.length > 0
          ? `This cannot be undone and will remove it from ${g.used_in.length} active sendout${g.used_in.length === 1 ? '' : 's'}.`
          : 'This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => deleteMut.mutate(g.id),
    });

  return (
    <Screen>
      <SectionHeader
        title="Recipient Groups"
        action={
          <Pressable
            onPress={() => formRef.current?.present()}
            hitSlop={6}
            accessibilityLabel="New group"
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.ink }}>
            <IconPlus size={18} color="#ffffff" />
          </Pressable>
        }
      />
      <FlatList
        style={{ flex: 1 }}
        data={isLoading ? [] : visible}
        keyExtractor={(g) => g.id}
        renderItem={({ item }) => (
          <RecipientGroupCard group={item} onDelete={() => confirmDelete(item)} />
        )}
        ListHeaderComponent={
          <View className="pb-3 pt-1">
            {/* Search */}
            <View className="flex-row items-center rounded-full border border-border bg-surface px-3.5 py-2.5">
              <IconSearch size={16} color={colors.ink3} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search groups"
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

            {/* Sendout-type legend */}
            <View className="mt-3 flex-row items-center">
              <Legend />
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <SkeletonList />
          ) : search ? (
            <EmptyState
              title="No groups found"
              hint="Try a different search term or create a new group."
            />
          ) : (
            <EmptyState
              title="No recipient groups yet"
              hint="Create a reusable email list to drop into any sendout."
            />
          )
        }
        ItemSeparatorComponent={() => <View className="h-3.5" />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <RecipientGroupFormSheet ref={formRef} onSubmit={handleCreate} />
      <ConfirmSheet ref={confirmRef} />
    </Screen>
  );
}
