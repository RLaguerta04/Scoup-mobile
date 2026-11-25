import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  IconArrowsSort,
  IconChevronLeft,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@/components/navIcons';
import { Checkbox } from '@/components/ui/Checkbox';
import { SegmentedControl } from '@/components/ui/controls';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/components/sheets/ConfirmSheet';
import type { SheetHandle } from '@/components/sheets/sheet';
import { NameFormSheet, type NameFormHandle } from '@/features/settings/NameFormSheet';
import { KeywordGroupCard } from '@/features/settings/KeywordGroupCard';
import { BucketSortSheet, BUCKET_SORT_LABEL, type BucketSort } from '@/features/settings/BucketSortSheet';
import { EmailConfigView } from '@/features/settings/email/EmailConfigView';
import { useSelectionStore } from '@/stores/selectionStore';
import {
  useDeleteBucket,
  useDeleteKeywordGroup,
  useDuplicateKeywordGroup,
  useNewsletterSettings,
  useRenameBucket,
} from '@/services/api/queries';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';
import type { IKeywordGroupSummary } from '@/types';

type Tab = 'keywords' | 'email';
const TAB_OPTIONS = [
  { value: 'keywords' as const, label: 'Keywords' },
  { value: 'email' as const, label: 'Email' },
];

// Pushed bucket detail (web: the drilled-in bucket on NewsLetterEditPage). Keywords | Email
// tabs: Keywords = this bucket's keyword-group management (search / sort / select / add +
// per-card edit/duplicate/delete → pushed editor); Email = the newsletter email config.
// Source intake is NOT here — it's the MANAGE action on the bucket card in Settings (web parity).
export default function NewsletterBucketScreen() {
  const { bucketId: bucketIdParam } = useLocalSearchParams<{ bucketId: string }>();
  const bucketId = Number(bucketIdParam);
  const newsletterId = useSelectionStore((s) => s.newsletterId);

  const { data, isLoading } = useNewsletterSettings(newsletterId);
  const renameBucket = useRenameBucket();
  const deleteBucket = useDeleteBucket();
  const duplicateGroup = useDuplicateKeywordGroup();
  const deleteGroup = useDeleteKeywordGroup();

  const nameFormRef = useRef<NameFormHandle>(null);
  const confirmRef = useRef<ConfirmSheetHandle>(null);
  const sortRef = useRef<SheetHandle>(null);

  const [tab, setTab] = useState<Tab>('keywords');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<BucketSort>('newest');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const bucket = useMemo(() => data?.buckets.find((b) => b.id === bucketId), [data, bucketId]);
  const groups = useMemo(() => bucket?.keywordGroups ?? [], [bucket]);

  const shown = useMemo(() => {
    const q = search.toLowerCase().trim();
    const arr = q
      ? groups.filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.mainKeywords.join(' ').toLowerCase().includes(q) ||
            g.additionalKeywords.join(' ').toLowerCase().includes(q) ||
            g.excludedKeywords.join(' ').toLowerCase().includes(q),
        )
      : [...groups];
    if (sort === 'oldest') arr.reverse();
    else if (sort === 'az') arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'za') arr.sort((a, b) => b.name.localeCompare(a.name));
    return arr;
  }, [groups, search, sort]);

  const allSelected = shown.length > 0 && shown.every((g) => selected.has(g.id));

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const openRename = () =>
    bucket &&
    nameFormRef.current?.present({
      title: 'Rename bucket',
      label: 'Bucket name',
      initialName: bucket.name,
      submitLabel: 'Save',
      onSubmit: ({ name }) => renameBucket.mutate({ newsletterId, bucketId, name }),
    });

  const confirmDeleteBucket = () =>
    bucket &&
    confirmRef.current?.present({
      title: `Delete “${bucket.name}”?`,
      message: 'This removes the bucket and its keyword groups from this newsletter.',
      confirmLabel: 'Delete bucket',
      onConfirm: () => deleteBucket.mutate({ newsletterId, bucketId }, { onSuccess: goBack }),
    });

  const openEditor = (g: IKeywordGroupSummary) =>
    router.push({ pathname: '/newsletter-keyword-group/[groupId]', params: { groupId: g.id, bucketId: String(bucketId) } });

  const openCreate = () =>
    router.push({ pathname: '/newsletter-keyword-group/[groupId]', params: { groupId: 'new', bucketId: String(bucketId) } });

  const confirmDeleteGroup = (g: IKeywordGroupSummary) =>
    confirmRef.current?.present({
      title: `Delete “${g.name}”?`,
      message: 'This removes the keyword group from this bucket.',
      confirmLabel: 'Delete group',
      onConfirm: () => deleteGroup.mutate({ newsletterId, bucketId, groupId: g.id }),
    });

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(shown.map((g) => g.id)));

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const bulkDelete = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    confirmRef.current?.present({
      title: `Delete ${ids.length} keyword ${ids.length === 1 ? 'group' : 'groups'}?`,
      message: 'This removes the selected keyword groups from this bucket.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        ids.forEach((id) => deleteGroup.mutate({ newsletterId, bucketId, groupId: id }));
        exitSelect();
      },
    });
  };

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
          {!!data?.newsletterName && (
            <Txt variant="caption" numberOfLines={1} className="text-ink-3">
              ✉ {data.newsletterName}
            </Txt>
          )}
          <Txt variant="title" numberOfLines={1}>
            {bucket?.name ?? 'Bucket'}
          </Txt>
        </View>
        {bucket && (
          <View className="flex-row" style={{ gap: 2 }}>
            <Pressable
              onPress={openRename}
              accessibilityRole="button"
              accessibilityLabel="Rename bucket"
              hitSlop={6}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
              <IconPencil size={17} color={colors.ink3} />
            </Pressable>
            <Pressable
              onPress={confirmDeleteBucket}
              accessibilityRole="button"
              accessibilityLabel="Delete bucket"
              hitSlop={6}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
              <IconTrash size={17} color="#c0492f" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View className="px-4 pb-1">
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={(v) => setTab(v as Tab)} />
      </View>

      {isLoading ? (
        <View className="gap-3 px-4 pt-3">
          <Skeleton className="h-10 rounded-full" />
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </View>
      ) : !bucket ? (
        <EmptyState title="Bucket not found" hint="It may have been deleted. Go back to Settings." />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {tab === 'email' ? (
            <EmailConfigView />
          ) : (
            <View>
              <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                <Label>
                  {groups.length} keyword {groups.length === 1 ? 'group' : 'groups'}
                </Label>
                {groups.length > 0 && (
                  <Pressable onPress={selectMode ? exitSelect : () => setSelectMode(true)} hitSlop={6} accessibilityRole="button">
                    <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-2">
                      {selectMode ? 'Cancel' : 'Select'}
                    </Txt>
                  </Pressable>
                )}
              </View>

              {/* Toolbar */}
              {selectMode ? (
                <View className="mt-3 flex-row items-center justify-between" style={{ gap: 8 }}>
                  <Pressable onPress={toggleSelectAll} hitSlop={6} accessibilityRole="button" className="flex-row items-center" style={{ gap: 8 }}>
                    <Checkbox checked={allSelected} />
                    <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-2">
                      {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                    </Txt>
                  </Pressable>
                  <Pressable
                    onPress={bulkDelete}
                    disabled={selected.size === 0}
                    accessibilityRole="button"
                    accessibilityLabel="Delete selected"
                    style={{ opacity: selected.size === 0 ? 0.4 : 1 }}
                    className="flex-row items-center rounded-full bg-[#fbeae7] px-3 py-1.5 active:opacity-80">
                    <IconTrash size={14} color="#c0492f" />
                    <Txt weight="semibold" className="ml-1.5 text-[12px]" style={{ color: '#c0492f' }}>
                      Delete{selected.size > 0 ? ` (${selected.size})` : ''}
                    </Txt>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View className="mt-3 flex-row items-center" style={{ gap: 8 }}>
                    <View className="flex-1 flex-row items-center rounded-full border border-border bg-surface px-3 py-2">
                      <IconSearch size={16} color={colors.ink3} />
                      <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search keyword groups…"
                        placeholderTextColor={colors.ink3}
                        autoCapitalize="none"
                        autoCorrect={false}
                        className="ml-2 flex-1 text-[14px] text-ink"
                        style={{ fontFamily: 'Archivo_400Regular', padding: 0 }}
                      />
                      {search.length > 0 && (
                        <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
                          <IconX size={15} color={colors.ink3} />
                        </Pressable>
                      )}
                    </View>
                    <Pressable
                      onPress={() => sortRef.current?.present()}
                      accessibilityRole="button"
                      accessibilityLabel="Sort keyword groups"
                      className="flex-row items-center rounded-full border border-border bg-surface px-3 py-2 active:opacity-80"
                      style={{ gap: 6 }}>
                      <IconArrowsSort size={14} color={colors.ink3} />
                      <Txt weight="medium" className="text-[12px] text-ink-2">{BUCKET_SORT_LABEL[sort]}</Txt>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={openCreate}
                    accessibilityRole="button"
                    accessibilityLabel="Add keyword group"
                    className="mt-2.5 flex-row items-center justify-center rounded-full bg-ink py-2.5 active:opacity-90"
                    style={{ gap: 6 }}>
                    <IconPlus size={16} color="#ffffff" />
                    <Txt weight="semibold" className="text-[13px] text-white">Add keyword group</Txt>
                  </Pressable>
                </>
              )}

              {/* Cards */}
              <View className="mt-3.5">
                {shown.length === 0 ? (
                  <View className="items-center rounded-card border border-dashed border-border py-8">
                    <Txt className="text-[13px] text-ink-3">
                      {search ? `No keyword groups match “${search}”.` : 'No keyword groups yet — add one to start tracking.'}
                    </Txt>
                  </View>
                ) : (
                  shown.map((g) => (
                    <KeywordGroupCard
                      key={g.id}
                      group={g}
                      selectMode={selectMode}
                      selected={selected.has(g.id)}
                      onToggleSelect={() => toggleSelect(g.id)}
                      onOpen={() => openEditor(g)}
                      onEdit={() => openEditor(g)}
                      onDuplicate={() => duplicateGroup.mutate({ newsletterId, bucketId, groupId: g.id })}
                      onDelete={() => confirmDeleteGroup(g)}
                    />
                  ))
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <NameFormSheet ref={nameFormRef} />
      <BucketSortSheet ref={sortRef} sort={sort} onChange={setSort} />
      <ConfirmSheet ref={confirmRef} />
    </SafeAreaView>
  );
}
