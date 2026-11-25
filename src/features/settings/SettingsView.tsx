import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  IconArrowsSort,
  IconInfoCircle,
  IconPencil,
  IconPlus,
  IconSearch,
  IconX,
} from '@/components/navIcons';
import { SegmentedControl } from '@/components/ui/controls';
import { Skeleton } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/components/sheets/ConfirmSheet';
import type { SheetHandle } from '@/components/sheets/sheet';
import { useSelectionStore } from '@/stores/selectionStore';
import {
  useCreateBucket,
  useDeleteBucket,
  useDeleteBucketGroup,
  useDuplicateBucket,
  useNewsletterSettings,
  useRenameBucket,
  useRenameNewsletter,
  useSaveBucketGroup,
  useSetSourceIntake,
} from '@/services/api/queries';
import { colors } from '@/theme/tokens';
import type { IBucketSettings } from '@/types';
import { BucketSettingsCard } from './BucketSettingsCard';
import { BucketSortSheet, BUCKET_SORT_LABEL, type BucketSort } from './BucketSortSheet';
import { GroupedBucketCard } from './GroupedBucketCard';
import { GroupFormSheet, type GroupFormHandle } from './GroupFormSheet';
import { NameFormSheet, type NameFormHandle } from './NameFormSheet';
import { SourceIntakeSheet, type SourceIntakeHandle } from './SourceIntakeSheet';
import { EmailConfigView } from './email/EmailConfigView';

type Tab = 'buckets' | 'email';

const TAB_OPTIONS = [
  { value: 'buckets' as const, label: 'Buckets' },
  { value: 'email' as const, label: 'Email' },
];

// The Newsletters → Settings sub-view: the BUCKETS tab (newsletter name, a
// search/sort/add toolbar, bucket groups, a topics-page tab preview, and the per-bucket
// cards with their CRUD). EMAIL is a placeholder. Mirrors the web newsletter-edit page.
export function SettingsView() {
  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const { data, isLoading } = useNewsletterSettings(newsletterId);

  const renameNl = useRenameNewsletter();
  const createBucket = useCreateBucket();
  const renameBucket = useRenameBucket();
  const deleteBucket = useDeleteBucket();
  const duplicateBucket = useDuplicateBucket();
  const saveGroup = useSaveBucketGroup();
  const deleteGroup = useDeleteBucketGroup();
  const setSourceIntake = useSetSourceIntake();

  const [tab, setTab] = useState<Tab>('buckets');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<BucketSort>('newest');

  const nameFormRef = useRef<NameFormHandle>(null);
  const groupFormRef = useRef<GroupFormHandle>(null);
  const sourceRef = useRef<SourceIntakeHandle>(null);
  const confirmRef = useRef<ConfirmSheetHandle>(null);
  const sortRef = useRef<SheetHandle>(null);

  const buckets = useMemo(() => data?.buckets ?? [], [data]);
  const groups = useMemo(() => data?.groups ?? [], [data]);
  const bucketOptions = useMemo(() => buckets.map((b) => ({ id: b.id, name: b.name })), [buckets]);

  const shown = useMemo(() => {
    const q = search.toLowerCase().trim();
    const arr = q ? buckets.filter((b) => b.name.toLowerCase().includes(q)) : [...buckets];
    if (sort === 'oldest') arr.reverse();
    else if (sort === 'az') arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'za') arr.sort((a, b) => b.name.localeCompare(a.name));
    return arr;
  }, [buckets, search, sort]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const openRenameNewsletter = () =>
    nameFormRef.current?.present({
      title: 'Rename newsletter',
      label: 'Newsletter name',
      placeholder: 'Newsletter name',
      initialName: data?.newsletterName,
      submitLabel: 'Save',
      onSubmit: ({ name }) => renameNl.mutate({ newsletterId, name }),
    });

  const openAddBucket = () =>
    nameFormRef.current?.present({
      title: 'New bucket',
      label: 'Bucket name',
      placeholder: 'e.g. Products',
      showDescription: true,
      submitLabel: 'Create bucket',
      onSubmit: ({ name, description }) =>
        createBucket.mutate({ newsletterId, name, description: description || undefined }),
    });

  const openRenameBucket = (bucket: IBucketSettings) =>
    nameFormRef.current?.present({
      title: 'Rename bucket',
      label: 'Bucket name',
      initialName: bucket.name,
      submitLabel: 'Save',
      onSubmit: ({ name }) => renameBucket.mutate({ newsletterId, bucketId: bucket.id, name }),
    });

  const confirmDeleteBucket = (bucket: IBucketSettings) =>
    confirmRef.current?.present({
      title: `Delete “${bucket.name}”?`,
      message: 'This removes the bucket and its keyword groups from this newsletter.',
      confirmLabel: 'Delete bucket',
      onConfirm: () => deleteBucket.mutate({ newsletterId, bucketId: bucket.id }),
    });

  const openManageSources = (bucket: IBucketSettings) =>
    sourceRef.current?.present({
      bucketId: bucket.id,
      bucketName: bucket.name,
      restrict: bucket.sourceRestrict,
      sourceIds: bucket.sourceIds,
    });

  const openNewGroup = () =>
    groupFormRef.current?.present({ buckets: bucketOptions });

  const openEditGroup = (groupId: string) => {
    const existing = groups.find((g) => g.id === groupId);
    if (existing) groupFormRef.current?.present({ buckets: bucketOptions, existing });
  };

  const confirmDeleteGroup = (groupId: string, groupName: string) =>
    confirmRef.current?.present({
      title: `Delete “${groupName}”?`,
      message: 'The buckets stay; only this comparison group is removed.',
      confirmLabel: 'Delete group',
      onConfirm: () => deleteGroup.mutate({ newsletterId, groupId }),
    });

  const openBucket = (bucket: IBucketSettings) =>
    router.push({ pathname: '/newsletter-bucket/[bucketId]', params: { bucketId: String(bucket.id) } });

  // ─── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 gap-3 px-4 pt-4">
        <Skeleton className="h-10 rounded-full" />
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={(v) => setTab(v as Tab)} />

        {tab === 'email' ? (
          <EmailConfigView />
        ) : (
          <>
            {/* Newsletter name */}
            <View className="mt-5 flex-row items-center" style={{ gap: 8 }}>
              <View className="flex-1">
                <Label>Newsletter</Label>
                <Txt variant="title" numberOfLines={1} className="mt-0.5">
                  {data?.newsletterName ?? ''}
                </Txt>
              </View>
              <Pressable
                onPress={openRenameNewsletter}
                hitSlop={6}
                className="h-9 w-9 items-center justify-center rounded-full border border-border bg-surface active:bg-surface2">
                <IconPencil size={16} color={colors.ink3} />
              </Pressable>
            </View>

            {/* Toolbar */}
            <View className="mt-4 flex-row items-center" style={{ gap: 8 }}>
              <View className="flex-1 flex-row items-center rounded-full border border-border bg-surface px-3 py-2">
                <IconSearch size={16} color={colors.ink3} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search buckets…"
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
              <Pressable
                onPress={() => sortRef.current?.present()}
                className="flex-row items-center rounded-full border border-border bg-surface px-3 py-2 active:opacity-80"
                style={{ gap: 6 }}>
                <IconArrowsSort size={14} color={colors.ink3} />
                <Txt weight="medium" className="text-[12px] text-ink-2">{BUCKET_SORT_LABEL[sort]}</Txt>
              </Pressable>
            </View>

            <Pressable
              onPress={openAddBucket}
              className="mt-2.5 flex-row items-center justify-center rounded-full bg-ink py-2.5 active:opacity-90"
              style={{ gap: 6 }}>
              <IconPlus size={16} color="#ffffff" />
              <Txt weight="semibold" className="text-[13px] text-white">Add bucket</Txt>
            </Pressable>

            {/* Bucket groups */}
            {groups.length > 0 && (
              <View className="mt-7">
                <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                  <Label>Bucket groups</Label>
                  <Pressable
                    onPress={openNewGroup}
                    hitSlop={6}
                    className="flex-row items-center rounded-full border border-border bg-surface px-2.5 py-1 active:bg-surface2"
                    style={{ gap: 4 }}>
                    <IconPlus size={13} color={colors.ink3} />
                    <Txt weight="medium" className="text-[11px] text-ink-2">New group</Txt>
                  </Pressable>
                </View>
                <Txt className="mb-2.5 mt-1 text-[12px] text-ink-3">
                  Each group gets its own Landscape page comparing its buckets.
                </Txt>
                {groups.map((g) => (
                  <GroupedBucketCard
                    key={g.id}
                    group={g}
                    onEdit={() => openEditGroup(g.id)}
                    onDelete={() => confirmDeleteGroup(g.id, g.name)}
                  />
                ))}
              </View>
            )}

            {/* Topics page tabs preview */}
            {buckets.length > 0 && (
              <View className="mt-7">
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Label>Topics page tabs</Label>
                  <IconInfoCircle size={14} color={colors.ink3} />
                </View>
                <Txt className="mt-1 text-[12px] text-ink-3">
                  How your buckets appear as tabs on the newsletter’s Topics page.
                </Txt>
                <View className="mt-2.5 flex-row flex-wrap" style={{ gap: 6 }}>
                  {buckets.map((b, i) => (
                    <View
                      key={b.id}
                      className={`rounded-full px-3 py-1.5 ${i === 0 ? 'bg-ink' : 'border border-border bg-surface'}`}>
                      <Txt weight="medium" className={`text-[12px] ${i === 0 ? 'text-white' : 'text-ink-2'}`} numberOfLines={1}>
                        {b.name}
                      </Txt>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Bucket cards */}
            <View className="mt-7">
              <Label>{buckets.length} {buckets.length === 1 ? 'bucket' : 'buckets'}</Label>
              <View className="mt-2.5">
                {shown.length === 0 ? (
                  <Txt className="py-6 text-center text-[13px] text-ink-3">
                    {search ? `No buckets match “${search}”.` : 'No buckets yet — add one to start tracking.'}
                  </Txt>
                ) : (
                  shown.map((b) => (
                    <BucketSettingsCard
                      key={b.id}
                      bucket={b}
                      onOpen={() => openBucket(b)}
                      onManageSources={() => openManageSources(b)}
                      onEdit={() => openRenameBucket(b)}
                      onDuplicate={() => duplicateBucket.mutate({ newsletterId, bucketId: b.id })}
                      onDelete={() => confirmDeleteBucket(b)}
                    />
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <BucketSortSheet ref={sortRef} sort={sort} onChange={setSort} />
      <NameFormSheet ref={nameFormRef} />
      <GroupFormSheet
        ref={groupFormRef}
        onSubmit={({ id, name, bucketIds }) => saveGroup.mutate({ newsletterId, id, name, bucketIds })}
      />
      <SourceIntakeSheet
        ref={sourceRef}
        onSave={(bucketId, restrict, sourceIds) =>
          setSourceIntake.mutate({ newsletterId, bucketId, restrict, sourceIds })
        }
      />
      <ConfirmSheet ref={confirmRef} />
    </View>
  );
}
