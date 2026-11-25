import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconFilter, IconPlus, IconSearch, IconX } from '@/components/navIcons';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { ProfileAvatarButton } from '@/components/ProfileAvatarButton';
import { Txt } from '@/components/ui/Txt';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/components/sheets/ConfirmSheet';
import type { SheetHandle } from '@/components/sheets/sheet';
import { useTabBarStore } from '@/stores/tabBarStore';
import {
  useCreatePersona,
  useDeletePersonas,
  useDuplicatePersona,
  usePersonas,
  useSetPrimaryPersona,
  useUpdatePersona,
} from '@/services/api/queries';
import { colors } from '@/theme/tokens';
import type { IPersona, IPersonaSort } from '@/types';
import { PersonaActionsSheet, type PersonaActionsHandle } from './PersonaActionsSheet';
import { PersonaCard } from './PersonaCard';
import { PersonaFormSheet, type PersonaFormHandle, type PersonaFormValues } from './PersonaFormSheet';
import { PersonaSortSheet } from './PersonaSortSheet';

// New personas carry "" createdAt → sort to the top of "newest".
const recentVal = (p: IPersona): number =>
  p.createdAt ? Date.parse(p.createdAt) : Number.POSITIVE_INFINITY;

// Primary (active) persona pinned first; `s` orders the rest (and ties) within that.
const byActive = (a: IPersona, b: IPersona): number =>
  a.active === b.active ? 0 : a.active ? -1 : 1;

const sortPersonas = (rows: IPersona[], sort: IPersonaSort): IPersona[] => {
  const out = [...rows];
  switch (sort) {
    case 'name-az':
      return out.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-za':
      return out.sort((a, b) => b.name.localeCompare(a.name));
    case 'recent-newest':
      return out.sort((a, b) => recentVal(b) - recentVal(a));
    case 'recent-oldest':
      return out.sort((a, b) => recentVal(a) - recentVal(b));
    case 'active-oldest':
      return out.sort((a, b) => byActive(a, b) || recentVal(a) - recentVal(b));
    case 'active-newest':
    default:
      return out.sort((a, b) => byActive(a, b) || recentVal(b) - recentVal(a));
  }
};

function SkeletonCard() {
  return (
    <View className="mx-4 my-1.5 rounded-card border border-border bg-surface p-4">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-2 h-3 w-40" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-4/5" />
      <Skeleton className="mt-4 h-8 w-full rounded-md" />
    </View>
  );
}

export function PersonasListView() {
  const { data: personas = [], isLoading } = usePersonas();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<IPersonaSort>('active-newest');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const createMut = useCreatePersona();
  const updateMut = useUpdatePersona();
  const deleteMut = useDeletePersonas();
  const duplicateMut = useDuplicatePersona();
  const setPrimaryMut = useSetPrimaryPersona();

  const formRef = useRef<PersonaFormHandle>(null);
  const actionsRef = useRef<PersonaActionsHandle>(null);
  const confirmRef = useRef<ConfirmSheetHandle>(null);
  const sortRef = useRef<SheetHandle>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = personas.filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.dossierNames.some((n) => n.toLowerCase().includes(q)),
    );
    return sortPersonas(rows, sort);
  }, [personas, search, sort]);

  const allSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(visible.map((p) => p.id)));

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  // Long-press a card to start selecting (and select it) — the native mobile gesture.
  const enterSelect = (id: string) => {
    setSelectMode(true);
    setSelected((prev) => new Set(prev).add(id));
  };

  // Hide the floating tab bar while selecting so the bottom Cancel/Delete bar is reachable.
  const setTabBarHidden = useTabBarStore((s) => s.setHidden);
  useEffect(() => {
    setTabBarHidden(selectMode);
    return () => setTabBarHidden(false);
  }, [selectMode, setTabBarHidden]);

  const openDetail = (p: IPersona) =>
    router.push({ pathname: '/persona/[id]', params: { id: p.id } });

  const submitForm = (v: PersonaFormValues) => {
    if (v.id) updateMut.mutate({ id: v.id, name: v.name, role: v.role, org: v.org, focus: v.focus, prompt: v.prompt });
    else createMut.mutate({ name: v.name, role: v.role, org: v.org, focus: v.focus, prompt: v.prompt });
  };

  const confirmDeleteOne = (p: IPersona) =>
    confirmRef.current?.present({
      title: `Delete “${p.name}”?`,
      message: 'This removes the persona and its dossiers. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => deleteMut.mutate([p.id]),
    });

  const confirmDeleteSelected = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    confirmRef.current?.present({
      title: ids.length === 1 ? 'Delete persona?' : `Delete ${ids.length} personas?`,
      message: 'This removes them and their dossiers. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        deleteMut.mutate(ids);
        exitSelect();
      },
    });
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header: title · add · account avatar (a main-tab header, no back button) */}
      <View className="flex-row items-center px-4 py-2">
        <Txt variant="title" className="flex-1">
          Personas
        </Txt>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => formRef.current?.present()}
            hitSlop={8}
            accessibilityLabel="Add persona"
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.ink }}>
            <IconPlus size={18} color="#ffffff" />
          </Pressable>
          <ProfileAvatarButton />
        </View>
      </View>

      {selectMode ? (
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
          {/* Search + Sort — one row (long-press a card to multi-select) */}
          <View className="mx-4 mt-1 flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center rounded-full border border-border bg-surface px-3.5 py-2.5">
              <IconSearch size={16} color={colors.ink3} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search personas…"
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
              hitSlop={6}
              accessibilityLabel="Sort personas"
              className="flex-row items-center justify-center rounded-full border border-border bg-surface px-2.5 py-2.5">
              <IconFilter size={18} color={colors.ink} />
            </Pressable>
          </View>
        </>
      )}

      {/* Grid (single column — matches the web's mobile layout) */}
      <FlatList
        data={isLoading ? [] : visible}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PersonaCard
            persona={item}
            onOpen={() => openDetail(item)}
            onActions={() => actionsRef.current?.present(item)}
            onSetPrimary={() => setPrimaryMut.mutate(item.id)}
            selectMode={selectMode}
            selected={selected.has(item.id)}
            onToggleSelect={() => toggleSelect(item.id)}
            onLongPress={() => enterSelect(item.id)}
          />
        )}
        ListHeaderComponent={
          !isLoading && visible.length > 0 ? (
            <Txt mono className="px-5 pb-1 pt-3 text-[11px] text-ink-3">
              {visible.length} {visible.length === 1 ? 'persona' : 'personas'}
            </Txt>
          ) : undefined
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="pt-2">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </View>
          ) : search ? (
            <EmptyState title="No personas found" hint={`No personas match “${search}”.`} />
          ) : (
            <EmptyState
              title="No personas yet"
              hint="Add a persona to shape who every brief is written for."
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
      <PersonaSortSheet ref={sortRef} sort={sort} onChange={setSort} />
      <PersonaFormSheet ref={formRef} onSubmit={submitForm} />
      <PersonaActionsSheet
        ref={actionsRef}
        onView={openDetail}
        onEdit={(p) => formRef.current?.present(p)}
        onDuplicate={(p) => duplicateMut.mutate(p.id)}
        onDelete={confirmDeleteOne}
        onSetPrimary={(p) => setPrimaryMut.mutate(p.id)}
      />
      <ConfirmSheet ref={confirmRef} />
    </SafeAreaView>
  );
}
