import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconFilter, IconPlus, IconSearch, IconX } from '@/components/navIcons';
import { ProfileAvatarButton } from '@/components/ProfileAvatarButton';
import type { SheetHandle } from '@/components/sheets/sheet';
import { Chip } from '@/components/ui/controls';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/features/publishers/ConfirmSheet';
import { type PublisherStatus } from '@/features/publishers/status';
import {
  useChannelBuckets,
  useChannels,
  useCreateChannel,
  useDeleteChannels,
  useNewsletters,
  useUpdateChannel,
} from '@/services/api/queries';
import { useTabBarStore } from '@/stores/tabBarStore';
import { colors } from '@/theme/tokens';
import type { ChannelPlatform, IChannel, IChannelSort } from '@/types';
import { ChannelCard } from './ChannelCard';
import { ChannelFiltersSheet } from './ChannelFiltersSheet';
import { ChannelFormSheet, type ChannelFormHandle } from './ChannelFormSheet';

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

export function ChannelsListView() {
  const { data: channels = [], isLoading } = useChannels();
  const { data: newsletters = [] } = useNewsletters();

  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<PublisherStatus[]>([]);
  const [platforms, setPlatforms] = useState<ChannelPlatform[]>([]);
  const [sort, setSort] = useState<IChannelSort>(null);
  const [newsletterId, setNewsletterId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: bucketMap } = useChannelBuckets(newsletterId);

  const createMut = useCreateChannel();
  const updateMut = useUpdateChannel();
  const deleteMut = useDeleteChannels();

  const formRef = useRef<ChannelFormHandle>(null);
  const filtersRef = useRef<SheetHandle>(null);
  const confirmRef = useRef<ConfirmSheetHandle>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = channels.filter((c) => {
      if (
        q &&
        !c.handle.toLowerCase().includes(q) &&
        !c.name.toLowerCase().includes(q) &&
        !c.profile_url.toLowerCase().includes(q)
      )
        return false;
      if (statuses.length > 0 && !(c.status != null && statuses.includes(c.status as PublisherStatus)))
        return false;
      if (platforms.length > 0 && !platforms.includes(c.platform)) return false;
      return true;
    });
    if (sort) {
      const dir = sort === 'followers_asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => (a.followers - b.followers) * dir);
    }
    return rows;
  }, [channels, search, statuses, platforms, sort]);

  const allSelected = visible.length > 0 && visible.every((c) => selected.has(c.id));

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
    setSelected(allSelected ? new Set() : new Set(visible.map((c) => c.id)));

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

  const submitForm = (values: { id?: string; profile_url: string; name: string }) => {
    if (values.id) updateMut.mutate({ id: values.id, profile_url: values.profile_url, name: values.name });
    else createMut.mutate({ profile_url: values.profile_url, name: values.name });
  };

  const confirmDeleteOne = (c: IChannel) =>
    confirmRef.current?.present({
      title: `Delete ${c.handle || c.name || 'this channel'}?`,
      message: 'This removes the account from your social channels. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => deleteMut.mutate([c.id]),
    });

  const confirmDeleteSelected = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    confirmRef.current?.present({
      title: ids.length === 1 ? 'Delete channel?' : `Delete ${ids.length} channels?`,
      message: 'This removes them from your social channels. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        deleteMut.mutate(ids);
        exitSelect();
      },
    });
  };

  const filterCount = statuses.length + platforms.length + (sort ? 1 : 0);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header: title · add · profile (a root tab — no back button) */}
      <View className="flex-row items-center px-4 py-2">
        <Txt variant="title" className="flex-1">
          Channels
        </Txt>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => formRef.current?.present()}
            hitSlop={8}
            accessibilityLabel="Add channel"
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
                placeholder="Search channels…"
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
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ChannelCard
            channel={item}
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
              {visible.length} {visible.length === 1 ? 'channel' : 'channels'}
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
          ) : search || filterCount > 0 ? (
            <EmptyState
              title="No channels match your filters"
              hint="Try adjusting your search, platform or status filters."
            />
          ) : (
            <EmptyState
              title="No channels yet"
              hint="Add a Facebook, X, YouTube or Reddit account to track its posts."
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
      <ChannelFormSheet ref={formRef} onSubmit={submitForm} />
      <ChannelFiltersSheet
        ref={filtersRef}
        platforms={platforms}
        statuses={statuses}
        sort={sort}
        onApply={(p, s, so) => {
          setPlatforms(p);
          setStatuses(s);
          setSort(so);
        }}
      />
      <ConfirmSheet ref={confirmRef} />
    </SafeAreaView>
  );
}
