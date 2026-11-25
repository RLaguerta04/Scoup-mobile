import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft, IconInfoCircle, IconMail, IconPlus, IconTrash, IconX } from '@/components/navIcons';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/components/sheets/ConfirmSheet';
import { Divider } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { UsageChip } from '@/features/recipients/UsageChip';
import { goBack } from '@/lib/nav';
import {
  useDeleteRecipientGroup,
  useRecipientGroups,
  useUpdateRecipientGroup,
} from '@/services/api/queries';
import { colors } from '@/theme/tokens';
import type { IRecipientGroupMember } from '@/types';

// Draft member (id is local until saved; the mock re-assigns on save).
type DraftMember = Pick<IRecipientGroupMember, 'id' | 'email' | 'role'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A stable snapshot of the editable fields, for dirty-checking.
const snap = (description: string, members: DraftMember[]): string =>
  JSON.stringify({ description, members: members.map((m) => ({ e: m.email, r: m.role })) });

export default function RecipientGroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useRecipientGroups();
  const group = data?.find((g) => g.id === id);

  const updateMut = useUpdateRecipientGroup();
  const deleteMut = useDeleteRecipientGroup();
  const confirmRef = useRef<ConfirmSheetHandle>(null);

  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<DraftMember[]>([]);
  const [baseline, setBaseline] = useState('');
  const seeded = useRef(false);

  // Email/role being added.
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Seed the draft once, when the group first resolves (so a save-triggered refetch
  // doesn't clobber in-progress edits).
  const localId = useRef(0);
  useEffect(() => {
    if (!group || seeded.current) return;
    seeded.current = true;
    setDescription(group.description);
    setMembers(group.members.map((m) => ({ id: m.id, email: m.email, role: m.role })));
    setBaseline(snap(group.description, group.members));
  }, [group]);

  if (!group) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-bg">
        <View className="flex-row items-center gap-1 px-2 py-2">
          <Pressable onPress={goBack} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
            <IconChevronLeft size={24} color={colors.ink} />
          </Pressable>
          <Txt variant="title" className="flex-1">
            Recipient group
          </Txt>
        </View>
        <View className="flex-1 items-center justify-center">
          <EmptyState
            title={isLoading ? 'Loading…' : 'Group not found'}
            hint={isLoading ? undefined : 'It may have been deleted.'}
          />
        </View>
      </SafeAreaView>
    );
  }

  const dirty = snap(description, members) !== baseline;
  const count = members.length;

  const addMember = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_RE.test(email)) {
      setAddError('Please enter a valid email address');
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === email)) {
      setAddError('Already added');
      return;
    }
    setMembers((prev) => [...prev, { id: `draft_${localId.current++}`, email, role: newRole.trim() }]);
    setNewEmail('');
    setNewRole('');
    setAddError(null);
  };

  const removeMember = (mid: string) =>
    setMembers((prev) => prev.filter((m) => m.id !== mid));

  const setRole = (mid: string, role: string) =>
    setMembers((prev) => prev.map((m) => (m.id === mid ? { ...m, role } : m)));

  const save = () => {
    if (!dirty) return;
    updateMut.mutate(
      {
        id: group.id,
        name: group.name,
        description,
        members: members.map((m, i) => ({ email: m.email, role: m.role, sort_order: i })),
      },
      { onSuccess: () => setBaseline(snap(description, members)) },
    );
  };

  const confirmDelete = () =>
    confirmRef.current?.present({
      title: `Delete "${group.name}"?`,
      message:
        group.used_in.length > 0
          ? `This cannot be undone and will remove it from ${group.used_in.length} active sendout${group.used_in.length === 1 ? '' : 's'}.`
          : 'This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => deleteMut.mutate(group.id, { onSuccess: goBack }),
    });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header: back · name · save */}
      <View className="flex-row items-center gap-1 px-2 py-2">
        <Pressable onPress={goBack} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <Txt variant="title" numberOfLines={1} className="flex-1">
          {group.name}
        </Txt>
        <Pressable
          onPress={save}
          disabled={!dirty || updateMut.isPending}
          hitSlop={8}
          className="rounded-full px-3 py-1.5"
          style={{ opacity: dirty && !updateMut.isPending ? 1 : 0.4, backgroundColor: colors.ink }}>
          <Txt weight="semibold" className="text-[13px] text-white">
            {updateMut.isPending ? 'Saving…' : 'Save'}
          </Txt>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Txt mono className="text-[11px] uppercase text-ink-3">
            {count} {count === 1 ? 'member' : 'members'}
          </Txt>

          {/* Used-in warning */}
          {group.used_in.length > 0 && (
            <View className="mt-3 flex-row items-start rounded-xl border border-[#f0d9a8] bg-[#fdf6e8] px-3 py-2.5">
              <IconInfoCircle size={15} color="#8a5a00" />
              <Txt className="ml-2 flex-1 text-[12px] leading-[17px]" style={{ color: '#8a5a00' }}>
                Used in {group.used_in.length} active sendout{group.used_in.length === 1 ? '' : 's'}. Changes apply on the next send, not retroactively.
              </Txt>
            </View>
          )}

          {/* Description */}
          <View className="mt-5">
            <Label>Description</Label>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Who's in this list and when should it be used?"
              placeholderTextColor={colors.ink3}
              multiline
              className="mt-1.5 min-h-[72px] rounded-xl border border-border bg-surface px-3.5 py-3 text-[14px] text-ink"
              style={{ fontFamily: 'Archivo_400Regular', textAlignVertical: 'top' }}
            />
          </View>

          {/* Members */}
          <View className="mt-6">
            <Label>Members ({count})</Label>

            {members.length === 0 ? (
              <View className="mt-2 items-center rounded-xl border border-dashed border-border py-6">
                <Txt className="text-[13px] text-ink-3">No members yet. Add one below.</Txt>
              </View>
            ) : (
              <View className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
                {members.map((m, i) => (
                  <View key={m.id}>
                    {i > 0 && <Divider />}
                    <View className="flex-row items-center px-3 py-2.5">
                      <IconMail size={16} color={colors.ink3} />
                      <View className="ml-2.5 flex-1">
                        <Txt mono numberOfLines={1} className="text-[12px] text-ink">
                          {m.email}
                        </Txt>
                        <TextInput
                          value={m.role}
                          onChangeText={(t) => setRole(m.id, t)}
                          placeholder="Role or title"
                          placeholderTextColor={colors.ink3}
                          className="mt-0.5 p-0 text-[12px] text-ink-3"
                          style={{ fontFamily: 'Archivo_400Regular' }}
                        />
                      </View>
                      <Pressable
                        onPress={() => removeMember(m.id)}
                        hitSlop={8}
                        accessibilityLabel={`Remove ${m.email}`}
                        className="h-8 w-8 items-center justify-center rounded-full active:bg-[#fef3f2]">
                        <IconX size={16} color="#b42318" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Add member */}
            <View className="mt-3 rounded-xl border border-border bg-surface2 p-3">
              <TextInput
                value={newEmail}
                onChangeText={(t) => {
                  setNewEmail(t);
                  if (addError) setAddError(null);
                }}
                placeholder="name@example.com"
                placeholderTextColor={colors.ink3}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onSubmitEditing={addMember}
                className="rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-ink"
                style={{ fontFamily: 'Archivo_400Regular' }}
              />
              <View className="mt-2 flex-row items-center" style={{ gap: 8 }}>
                <TextInput
                  value={newRole}
                  onChangeText={setNewRole}
                  placeholder="Role or title"
                  placeholderTextColor={colors.ink3}
                  onSubmitEditing={addMember}
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-ink"
                  style={{ fontFamily: 'Archivo_400Regular' }}
                />
                <Pressable
                  onPress={addMember}
                  className="flex-row items-center gap-1 rounded-lg bg-ink px-3.5 py-2.5 active:opacity-80">
                  <IconPlus size={15} color="#ffffff" />
                  <Txt weight="semibold" className="text-[13px] text-white">
                    Add
                  </Txt>
                </Pressable>
              </View>
              {addError && <Txt className="mt-2 text-[12px] text-[#e34948]">{addError}</Txt>}
            </View>
          </View>

          {/* Used in */}
          <View className="mt-6">
            <Label>Used in</Label>
            {group.used_in.length > 0 ? (
              <View className="mt-2 flex-row flex-wrap items-center" style={{ gap: 6 }}>
                {group.used_in.map((u) => (
                  <UsageChip key={u.schedule_id} usage={u} />
                ))}
              </View>
            ) : (
              <View className="mt-2 flex-row items-center">
                <IconInfoCircle size={14} color={colors.ink3} />
                <Txt className="ml-1.5 text-[12px] text-ink-3">Not used in any sendouts yet</Txt>
              </View>
            )}
          </View>

          {/* Delete */}
          <Pressable
            onPress={confirmDelete}
            className="mt-8 flex-row items-center justify-center rounded-full border py-3.5 active:bg-[#fef3f2]"
            style={{ borderColor: 'rgba(180,35,24,0.35)' }}>
            <IconTrash size={17} color="#b42318" />
            <Txt weight="semibold" className="ml-2 text-[14px]" style={{ color: '#b42318' }}>
              Delete group
            </Txt>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmSheet ref={confirmRef} />
    </SafeAreaView>
  );
}
