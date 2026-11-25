import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconFilter, IconPlus, IconSearch, IconX } from '@/components/navIcons';
import { ProfileAvatarButton } from '@/components/ProfileAvatarButton';
import { Chip } from '@/components/ui/controls';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import {
  useCreatePublisher,
  useDeletePublishers,
  useNewsletters,
  usePublisherBuckets,
  usePublishers,
  useUpdatePublisher,
} from '@/services/api/queries';
import { useTabBarStore } from '@/stores/tabBarStore';
import { colors } from '@/theme/tokens';
import type { IPublisher, IPublisherSort } from '@/types';
import { ConfirmSheet, type ConfirmSheetHandle } from './ConfirmSheet';
import { PublisherCard } from './PublisherCard';
import { PublisherFiltersSheet } from './PublisherFiltersSheet';
import { PublisherFormSheet, type PublisherFormHandle } from './PublisherFormSheet';
import { type PublisherStatus } from './status';
import type { SheetHandle } from '@/components/sheets/sheet';

function SkeletonCard() {
  return (
    <View className="mx-4 my-1 flex-row items-center rounded-card border border-border bg-surface p-3.5">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <View className="ml-3 flex-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-3 w-28" />
        <Skeleton className="mt-3 h-5 w-16 rounded-full" />
      </View>
    </View>
  );
}

export function PublishersListView() {
  const { data: publishers = [], isLoading } = usePublishers();
  const { data: newsletters = [] } = useNewsletters();

  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<PublisherStatus[]>([]);
  const [sort, setSort] = useState<IPublisherSort>(null);
  const [newsletterId, setNewsletterId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: bucketMap } = usePublisherBuckets(newsletterId);

  const createMut = useCreatePublisher();
  const updateMut = useUpdatePublisher();
  const deleteMut = useDeletePublishers();

  const formRef = useRef<PublisherFormHandle>(null);
  const filtersRef = useRef<SheetHandle>(null);
  const confirmRef = useRef<ConfirmSheetHandle>(null);
  const filterCount = statuses.length + (sort ? 1 : 0);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = publishers.filter((p) => {
      if (q && !p.publisher_name.toLowerCase().includes(q) && !p.website_url.toLowerCase().includes(q))
        return false;
      if (statuses.length > 0 && !statuses.includes(p.status as PublisherStatus)) return false;
      return true;
    });
    if (sort) {
      const dir = sort === 'name_desc' ? -1 : 1;
      rows = [...rows].sort((a, b) => a.publisher_name.localeCompare(b.publisher_name) * dir);
    }
    return rows;
  }, [publishers, search, statuses, sort]);

  const allSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Long-press a row to start selecting (and select it) — the native mobile gesture.
  const enterSelect = (id: string) => {
    setSelectMode(true);
    setSelected((prev) => new Set(prev).add(id));
  };

  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(visible.map((p) => p.id)));

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  // Hide the floating tab bar while selecting so the bottom Cancel/Delete bar is reachable;
  // always restore it on exit or if the screen unmounts mid-select.
  const setTabBarHidden = useTabBarStore((s) => s.setHidden);
  useEffect(() => {
    setTabBarHidden(selectMode);
    return () => setTabBarHidden(false);
  }, [selectMode, setTabBarHidden]);

  const submitForm = (values: { id?: string; website_url: string; publisher_name: string }) => {
    if (values.id)
      updateMut.mutate({ id: values.id, website_url: values.website_url, publisher_name: values.publisher_name });
    else createMut.mutate({ website_url: values.website_url, publisher_name: values.publisher_name });
  };

  const confirmDeleteOne = (p: IPublisher) =>
    confirmRef.current?.present({
      title: `Delete ${p.publisher_name || 'this publisher'}?`,
      message: 'This removes the outlet from your sources. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => deleteMut.mutate([p.id]),
    });

  const confirmDeleteSelected = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    confirmRef.current?.present({
      title: ids.length === 1 ? 'Delete publisher?' : `Delete ${ids.length} publishers?`,
      message: 'This removes them from your sources. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        deleteMut.mutate(ids);
        exitSelect();
      },
    });
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header: title · add · profile (a root tab — no back button) */}
      <View className="flex-row items-center px-4 py-2">
        <Txt variant="title" className="flex-1">
          Publishers
        </Txt>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => formRef.current?.present()}
            hitSlop={8}
            accessibilityLabel="Add publisher"
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.ink }}>
            <IconPlus size={18} color="#ffffff" />
          </Pressable>
          <ProfileAvatarButton />
        </View>
      </View>

      {selectMode ? (
        /* Selection toolbar */
        <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
          <Pressable onPress={toggleSelectAll} hitSlop={6}>
            <Txt weight="semibold" className="text-[14px] text-ink">
              {allSelected ? 'Deselect all' : 'Select all'}
            </Txt>
          </Pressable>
          <Txt mono className="text-[12px] uppercase tracking-wider text-ink-3">
            {selected.size} selected
          </Txt>
        </View>
      ) : (
        <>
          {/* Search + Filters — one row (long-press a row to multi-select) */}
          <View className="mx-4 mt-1 flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center rounded-full border border-border bg-surface px-3.5 py-2.5">
              <IconSearch size={16} color={colors.ink3} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search publishers…"
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
              onPress={() => filtersRef.current?.present()}
              hitSlop={6}
              accessibilityLabel="Filters"
              className="flex-row items-center justify-center rounded-full border border-border bg-surface px-2.5 py-2.5">
              <IconFilter size={18} color={colors.ink} />
              {filterCount > 0 && (
                <View className="ml-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1">
                  <Txt mono className="text-[10px] text-white">
                    {filterCount}
                  </Txt>
                </View>
              )}
            </Pressable>
          </View>

          {/* Buckets for: newsletter chips (the web's "Show buckets for:" selector) */}
          {newsletters.length > 0 && (
            <View className="mt-3">
              <Label className="px-4">Show buckets for</Label>
              <FlatList
                horizontal
                data={[{ id: null as string | null, name: 'None' }, ...newsletters]}
                keyExtractor={(n) => n.id ?? '__none__'}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 8 }}
                renderItem={({ item }) => (
                  <Chip
                    label={item.name}
                    active={newsletterId === item.id}
                    onPress={() => setNewsletterId(item.id)}
                  />
                )}
              />
            </View>
          )}
        </>
      )}

      {/* List */}
      <FlatList
        data={isLoading ? [] : visible}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PublisherCard
            publisher={item}
            buckets={newsletterId ? bucketMap?.[item.id] : undefined}
            selectMode={selectMode}
            selected={selected.has(item.id)}
            onToggleSelect={() => toggleSelect(item.id)}
            onEdit={() => formRef.current?.present(item)}
            onDelete={() => confirmDeleteOne(item)}
            onLongPress={() => enterSelect(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View className="mx-4 h-px bg-border" />}
        ListHeaderComponent={
          !isLoading && visible.length > 0 ? (
            <Txt mono className="px-5 pb-1 pt-3 text-[11px] text-ink-3">
              {visible.length} {visible.length === 1 ? 'publisher' : 'publishers'}
            </Txt>
          ) : undefined
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="pt-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </View>
          ) : search || statuses.length > 0 ? (
            <EmptyState
              title="No publishers match your filters"
              hint="Try adjusting your search or status filters."
            />
          ) : (
            <EmptyState
              title="No publishers yet"
              hint="Add your first outlet to supplement the publishers Scoup already tracks."
            />
          )
        }
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* Bottom action bar — shown in select mode (the tab bar is hidden to make room). */}
      {selectMode && (
        <View className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-border bg-surface px-4 pb-7 pt-3">
          <Pressable
            onPress={exitSelect}
            className="flex-1 items-center rounded-full border border-border py-3.5">
            <Txt weight="semibold" className="text-[14px] text-ink">
              Cancel
            </Txt>
          </Pressable>
          <Pressable
            onPress={confirmDeleteSelected}
            disabled={selected.size === 0}
            className="flex-1 items-center rounded-full bg-[#e34948] py-3.5"
            style={selected.size === 0 ? { opacity: 0.4 } : undefined}>
            <Txt weight="semibold" className="text-[14px] text-white">
              Delete{selected.size > 0 ? ` (${selected.size})` : ''}
            </Txt>
          </Pressable>
        </View>
      )}

      {/* Sheets */}
      <PublisherFormSheet ref={formRef} onSubmit={submitForm} />
      <PublisherFiltersSheet
        ref={filtersRef}
        statuses={statuses}
        sort={sort}
        onApply={(s, so) => {
          setStatuses(s);
          setSort(so);
        }}
      />
      <ConfirmSheet ref={confirmRef} />
    </SafeAreaView>
  );
}
