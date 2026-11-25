import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft, IconCopy, IconTrash } from '@/components/navIcons';
import { EmptyState } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/components/sheets/ConfirmSheet';
import { KeywordTagInput } from '@/features/settings/KeywordTagInput';
import { useSelectionStore } from '@/stores/selectionStore';
import {
  useCreateKeywordGroup,
  useDeleteKeywordGroup,
  useDuplicateKeywordGroup,
  useNewsletterSettings,
  useUpdateKeywordGroup,
} from '@/services/api/queries';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';

const sameArr = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

// Pushed keyword-group editor (web: BucketCreateEditForm). Create mode (groupId="new") adds a
// group-name field; edit mode carries duplicate/delete. Three chip fields — Main (required),
// Additional, Excluded — then Save. The parent bucket comes in as a ?bucketId query param.
export default function KeywordGroupEditorScreen() {
  const { groupId, bucketId: bucketParam } = useLocalSearchParams<{ groupId: string; bucketId: string }>();
  const bucketId = Number(bucketParam);
  const isCreate = groupId === 'new';
  const newsletterId = useSelectionStore((s) => s.newsletterId);

  const { data } = useNewsletterSettings(newsletterId);
  const createGroup = useCreateKeywordGroup();
  const updateGroup = useUpdateKeywordGroup();
  const duplicateGroup = useDuplicateKeywordGroup();
  const deleteGroup = useDeleteKeywordGroup();

  const confirmRef = useRef<ConfirmSheetHandle>(null);

  const bucket = useMemo(() => data?.buckets.find((b) => b.id === bucketId), [data, bucketId]);
  const group = useMemo(
    () => (isCreate ? undefined : bucket?.keywordGroups.find((g) => g.id === groupId)),
    [bucket, groupId, isCreate],
  );

  const [name, setName] = useState('');
  const [main, setMain] = useState<string[]>([]);
  const [additional, setAdditional] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);

  // Seed state once the group resolves from the cache (keyed on id so a post-save refetch
  // doesn't clobber edits — we navigate back on save anyway).
  const initFor = useRef<string | null>(null);
  useEffect(() => {
    if (isCreate) return;
    if (group && initFor.current !== group.id) {
      initFor.current = group.id;
      setName(group.name);
      setMain(group.mainKeywords);
      setAdditional(group.additionalKeywords);
      setExcluded(group.excludedKeywords);
    }
  }, [group, isCreate]);

  const initial = {
    name: group?.name ?? '',
    main: group?.mainKeywords ?? [],
    additional: group?.additionalKeywords ?? [],
    excluded: group?.excludedKeywords ?? [],
  };
  const dirty = isCreate
    ? name.trim().length > 0 || main.length > 0 || additional.length > 0 || excluded.length > 0
    : !sameArr(main, initial.main) ||
      !sameArr(additional, initial.additional) ||
      !sameArr(excluded, initial.excluded);

  const nameValid = !isCreate || name.trim().length > 0;
  const mainValid = main.length > 0;
  const saving = createGroup.isPending || updateGroup.isPending;
  const canSave = mainValid && nameValid && (isCreate ? true : dirty) && !saving;

  const save = () => {
    if (!canSave) return;
    const payload = {
      name: name.trim() || group?.name || 'Untitled group',
      mainKeywords: main,
      additionalKeywords: additional,
      excludedKeywords: excluded,
    };
    if (isCreate) {
      createGroup.mutate({ newsletterId, bucketId, group: payload }, { onSuccess: goBack });
    } else if (group) {
      updateGroup.mutate({ newsletterId, bucketId, groupId: group.id, group: payload }, { onSuccess: goBack });
    }
  };

  const duplicate = () =>
    group && duplicateGroup.mutate({ newsletterId, bucketId, groupId: group.id }, { onSuccess: goBack });

  const confirmDelete = () =>
    group &&
    confirmRef.current?.present({
      title: `Delete “${group.name}”?`,
      message: 'This removes the keyword group from this bucket.',
      confirmLabel: 'Delete group',
      onConfirm: () => deleteGroup.mutate({ newsletterId, bucketId, groupId: group.id }, { onSuccess: goBack }),
    });

  const notFound = !isCreate && data && !group;

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
          {!!bucket?.name && (
            <Txt variant="caption" numberOfLines={1} className="text-ink-3">
              {bucket.name}
            </Txt>
          )}
          <Txt variant="title" numberOfLines={1}>
            {isCreate ? 'New keyword group' : (group?.name ?? 'Keyword group')}
          </Txt>
        </View>
        {!isCreate && group && (
          <View className="flex-row" style={{ gap: 2 }}>
            <Pressable
              onPress={duplicate}
              accessibilityRole="button"
              accessibilityLabel="Duplicate keyword group"
              hitSlop={6}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
              <IconCopy size={17} color={colors.ink3} />
            </Pressable>
            <Pressable
              onPress={confirmDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete keyword group"
              hitSlop={6}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
              <IconTrash size={17} color="#c0492f" />
            </Pressable>
          </View>
        )}
      </View>

      {notFound ? (
        <EmptyState title="Keyword group not found" hint="It may have been deleted. Go back to the bucket." />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4, gap: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Txt variant="body" className="text-ink-3">
              {group?.summary || 'Your keyword summary will appear here as you add more keywords…'}
            </Txt>

            {isCreate && (
              <View>
                <Label>Keyword group name</Label>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Brand Mentions, Crisis, Competitors"
                  placeholderTextColor={colors.ink3}
                  className="mt-1.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[14px] text-ink"
                  style={{ fontFamily: 'Archivo_400Regular' }}
                />
              </View>
            )}

            <KeywordTagInput
              label="Main Keywords"
              required
              tone="main"
              value={main}
              onChange={setMain}
              placeholder="Add main keywords here and press enter"
              footerLabel="matches any of these"
            />
            <KeywordTagInput
              label="Additional Keywords"
              tone="additional"
              value={additional}
              onChange={setAdditional}
              placeholder="Add additional keywords here and press enter"
              footerLabel="matches any of these"
            />
            <KeywordTagInput
              label="Excluded Keywords"
              tone="excluded"
              value={excluded}
              onChange={setExcluded}
              placeholder="Add excluded keywords here and press enter"
              footerLabel="excludes any of these"
            />
          </ScrollView>

          {/* Footer */}
          <View className="border-t border-border px-4 pb-3 pt-2.5">
            <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
              {dirty && !saving ? (
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <View className="size-2 rounded-full" style={{ backgroundColor: '#e08a1e' }} />
                  <Txt className="text-[12px]" style={{ color: '#b45309' }}>
                    Unsaved changes
                  </Txt>
                </View>
              ) : !mainValid ? (
                <Txt className="text-[12px] text-ink-3">Add at least one main keyword.</Txt>
              ) : (
                <View />
              )}
              <Pressable
                onPress={save}
                disabled={!canSave}
                accessibilityRole="button"
                accessibilityLabel={isCreate ? 'Create group' : 'Save'}
                style={{ opacity: canSave ? 1 : 0.4 }}
                className="min-w-[120px] items-center rounded-full bg-ink py-3 active:opacity-90">
                <Txt weight="semibold" className="text-[14px] text-white">
                  {saving ? (isCreate ? 'Creating…' : 'Saving…') : isCreate ? 'Create group' : 'Save'}
                </Txt>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <ConfirmSheet ref={confirmRef} />
    </SafeAreaView>
  );
}
