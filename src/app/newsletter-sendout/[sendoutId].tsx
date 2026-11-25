import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft, IconPlus, IconX } from '@/components/navIcons';
import { Chip, SegmentedControl } from '@/components/ui/controls';
import { EmptyState } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { useSelectionStore } from '@/stores/selectionStore';
import {
  useCreateSendout,
  useEmailConfig,
  useNewsletterSettings,
  useRecipientGroups,
  useUpdateSendout,
} from '@/services/api/queries';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';
import type { IEmailSendout, ISendoutType } from '@/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_PRESETS = ['06:00', '07:00', '08:00', '09:00', '12:00', '17:00', '18:00', '20:00'];
const TYPE_OPTIONS = [
  { value: 'daily' as const, label: 'Daily' },
  { value: 'weekly' as const, label: 'Weekly' },
  { value: 'alert' as const, label: 'Alert' },
];
const sameArr = (a: (string | number)[], b: (string | number)[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);
const fmt = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hn = Number(h);
  return `${hn % 12 === 0 ? 12 : hn % 12}:${m ?? '00'} ${hn >= 12 ? 'PM' : 'AM'}`;
};

// Pushed sendout editor (web: ScheduleItem). Report type, send time, days (weekly), buckets,
// subject, and To/CC/BCC recipients (groups + emails). sendoutId="new" = create.
export default function SendoutEditorScreen() {
  const { sendoutId } = useLocalSearchParams<{ sendoutId: string }>();
  const isCreate = sendoutId === 'new';
  const newsletterId = useSelectionStore((s) => s.newsletterId);

  const { data: config } = useEmailConfig(newsletterId);
  const { data: settings } = useNewsletterSettings(newsletterId);
  const { data: groups = [] } = useRecipientGroups();
  const createSendout = useCreateSendout();
  const updateSendout = useUpdateSendout();

  const buckets = useMemo(() => settings?.buckets ?? [], [settings]);
  const existing = useMemo(
    () => (isCreate ? undefined : config?.sendouts.find((s) => s.id === sendoutId)),
    [config, sendoutId, isCreate],
  );

  const [type, setType] = useState<ISendoutType>('daily');
  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState('08:00');
  const [subject, setSubject] = useState('');
  const [bucketIds, setBucketIds] = useState<number[]>([]);
  const [toGroupIds, setToGroupIds] = useState<string[]>([]);
  const [ccGroupIds, setCcGroupIds] = useState<string[]>([]);
  const [bccGroupIds, setBccGroupIds] = useState<string[]>([]);
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [threshold, setThreshold] = useState('30');

  const initRef = useRef<string | null>(null);
  useEffect(() => {
    if (!config) return;
    const key = isCreate ? 'new' : (existing?.id ?? null);
    if (!key || initRef.current === key) return;
    initRef.current = key;
    if (existing) {
      setType(existing.type);
      setDays(existing.days);
      setTime(existing.sendoutTime || '08:00');
      setSubject(existing.subject);
      setBucketIds(existing.bucketIds);
      setToGroupIds(existing.toGroupIds);
      setCcGroupIds(existing.ccGroupIds);
      setBccGroupIds(existing.bccGroupIds);
      setToEmails(existing.toEmails);
      setCcEmails(existing.ccEmails);
      setBccEmails(existing.bccEmails);
      setThreshold(existing.alertThreshold != null ? String(existing.alertThreshold) : '30');
    } else {
      setSubject(config.subject);
    }
  }, [config, existing, isCreate]);

  const isAlert = type === 'alert';
  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const hasTo = toEmails.length > 0 || toGroupIds.length > 0;
  const subjectValid = subject.trim().length > 0;
  const bucketsValid = isAlert || bucketIds.length > 0;
  const timeValid = isAlert || !!time;
  const daysValid = type !== 'weekly' || days.length > 0;
  const thresholdValid = !isAlert || Number(threshold) > 0;
  const saving = createSendout.isPending || updateSendout.isPending;

  const payload: Omit<IEmailSendout, 'id'> = {
    type,
    days: type === 'weekly' ? days : [],
    sendoutTime: isAlert ? '' : time,
    subject: subject.trim(),
    bucketIds: isAlert ? bucketIds : bucketIds,
    toGroupIds,
    ccGroupIds,
    bccGroupIds,
    toEmails,
    ccEmails,
    bccEmails,
    alertThreshold: isAlert ? Number(threshold) : null,
  };

  const dirty = isCreate
    ? true
    : !!existing &&
      (type !== existing.type ||
        !sameArr(days, existing.days) ||
        time !== existing.sendoutTime ||
        subject.trim() !== existing.subject ||
        !sameArr(bucketIds, existing.bucketIds) ||
        !sameArr(toGroupIds, existing.toGroupIds) ||
        !sameArr(ccGroupIds, existing.ccGroupIds) ||
        !sameArr(bccGroupIds, existing.bccGroupIds) ||
        !sameArr(toEmails, existing.toEmails) ||
        !sameArr(ccEmails, existing.ccEmails) ||
        !sameArr(bccEmails, existing.bccEmails) ||
        Number(threshold) !== (existing.alertThreshold ?? 30));

  const canSave =
    subjectValid && bucketsValid && timeValid && daysValid && thresholdValid && hasTo && dirty && !saving;

  const save = () => {
    if (!canSave) return;
    if (isCreate) createSendout.mutate({ newsletterId, sendout: payload }, { onSuccess: goBack });
    else if (existing) updateSendout.mutate({ newsletterId, sendoutId: existing.id, sendout: payload }, { onSuccess: goBack });
  };

  const notFound = !isCreate && config && !existing;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="flex-row items-center gap-1 px-2 py-2">
        <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <Txt variant="title" numberOfLines={1} className="flex-1">
          {isCreate ? 'New sendout' : 'Edit sendout'}
        </Txt>
      </View>

      {notFound ? (
        <EmptyState title="Sendout not found" hint="It may have been deleted. Go back to Email." />
      ) : (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4, gap: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Report type */}
            <View>
              <Label>Report type</Label>
              <View className="mt-2">
                <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={(v) => setType(v as ISendoutType)} />
              </View>
            </View>

            {/* Send time */}
            {!isAlert && (
              <View>
                <Label>Send time</Label>
                <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
                  {TIME_PRESETS.map((t) => (
                    <Chip key={t} label={fmt(t)} active={time === t} onPress={() => setTime(t)} />
                  ))}
                </View>
              </View>
            )}

            {/* Days (weekly) */}
            {type === 'weekly' && (
              <View>
                <Label>Days</Label>
                <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
                  {DAYS.map((d) => (
                    <Chip key={d} label={d} active={days.includes(d)} onPress={() => toggle(days, d, setDays)} />
                  ))}
                </View>
              </View>
            )}

            {/* Buckets */}
            {!isAlert && (
              <View>
                <Label>Buckets</Label>
                {buckets.length === 0 ? (
                  <Txt className="mt-1.5 text-[12px] text-ink-3">This newsletter has no buckets yet.</Txt>
                ) : (
                  <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
                    {buckets.map((b) => (
                      <Chip
                        key={b.id}
                        label={b.name}
                        active={bucketIds.includes(b.id)}
                        onPress={() => toggle(bucketIds, b.id, setBucketIds)}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Alert threshold */}
            {isAlert && (
              <View>
                <Label>Spike threshold</Label>
                <Txt className="mt-1 text-[12px] text-ink-3">Alert fires when a bucket exceeds this many posts/hour.</Txt>
                <View className="mt-2 w-28 flex-row items-center rounded-full border border-border bg-surface px-3 py-2">
                  <TextInput
                    value={threshold}
                    onChangeText={(t) => setThreshold(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    className="flex-1 text-[14px] text-ink"
                    style={{ fontFamily: 'Archivo_400Regular', padding: 0 }}
                  />
                  <Txt className="text-[12px] text-ink-3">/hr</Txt>
                </View>
              </View>
            )}

            {/* Subject */}
            <View>
              <Label>Subject line</Label>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Enter subject line…"
                placeholderTextColor={colors.ink3}
                className="mt-2 rounded-xl border border-border bg-surface px-3.5 py-3 text-[14px] text-ink"
                style={{ fontFamily: 'Archivo_400Regular' }}
              />
              <View className="mt-1.5 rounded-lg border border-border bg-surface2 px-3 py-2">
                <Txt mono weight="medium" className="text-[9px] uppercase tracking-widest text-ink-3">
                  {isAlert ? 'Sends as 1 email per spike' : 'Sends as 1 email'}
                </Txt>
                <Txt numberOfLines={1} className="mt-0.5 text-[13px] text-ink">
                  {subject.trim() || 'No subject'}
                  <Txt className="text-ink-3">
                    {` [${type.charAt(0).toUpperCase() + type.slice(1)}]${isAlert ? '' : ` — ${fmt(time)}`}`}
                  </Txt>
                </Txt>
              </View>
            </View>

            {/* Recipients */}
            <View style={{ gap: 16 }}>
              <Label>Recipients</Label>
              <RecipientField
                label="To"
                required
                groups={groups}
                selectedGroupIds={toGroupIds}
                onToggleGroup={(id) => toggle(toGroupIds, id, setToGroupIds)}
                emails={toEmails}
                onEmailsChange={setToEmails}
              />
              <RecipientField
                label="CC"
                groups={groups}
                selectedGroupIds={ccGroupIds}
                onToggleGroup={(id) => toggle(ccGroupIds, id, setCcGroupIds)}
                emails={ccEmails}
                onEmailsChange={setCcEmails}
              />
              <RecipientField
                label="BCC"
                groups={groups}
                selectedGroupIds={bccGroupIds}
                onToggleGroup={(id) => toggle(bccGroupIds, id, setBccGroupIds)}
                emails={bccEmails}
                onEmailsChange={setBccEmails}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="border-t border-border px-4 pb-3 pt-2.5">
            <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
              {!subjectValid ? (
                <Txt className="flex-1 text-[12px] text-ink-3">Add a subject line.</Txt>
              ) : !hasTo ? (
                <Txt className="flex-1 text-[12px] text-ink-3">Add at least one “To” recipient.</Txt>
              ) : !bucketsValid ? (
                <Txt className="flex-1 text-[12px] text-ink-3">Select at least one bucket.</Txt>
              ) : !daysValid ? (
                <Txt className="flex-1 text-[12px] text-ink-3">Pick at least one day.</Txt>
              ) : (
                <View className="flex-1" />
              )}
              <Pressable
                onPress={save}
                disabled={!canSave}
                accessibilityRole="button"
                accessibilityLabel={isCreate ? 'Create sendout' : 'Save sendout'}
                style={{ opacity: canSave ? 1 : 0.4 }}
                className="min-w-[120px] items-center rounded-full bg-ink py-3 active:opacity-90">
                <Txt weight="semibold" className="text-[14px] text-white">
                  {saving ? 'Saving…' : isCreate ? 'Create sendout' : 'Save'}
                </Txt>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function RecipientField({
  label,
  required,
  groups,
  selectedGroupIds,
  onToggleGroup,
  emails,
  onEmailsChange,
}: {
  label: string;
  required?: boolean;
  groups: { id: string; name: string }[];
  selectedGroupIds: string[];
  onToggleGroup: (id: string) => void;
  emails: string[];
  onEmailsChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const e = draft.trim().toLowerCase();
    if (e && e.includes('@') && !emails.includes(e)) onEmailsChange([...emails, e]);
    setDraft('');
  };
  return (
    <View>
      <View className="flex-row items-center" style={{ gap: 4 }}>
        <Txt weight="semibold" className="text-[13px]">{label}</Txt>
        {required ? <Txt className="text-[13px]" style={{ color: '#c0492f' }}>*</Txt> : null}
      </View>

      {/* Recipient groups */}
      {groups.length > 0 && (
        <View className="mt-1.5 flex-row flex-wrap" style={{ gap: 6 }}>
          {groups.map((g) => (
            <Chip key={g.id} label={g.name} active={selectedGroupIds.includes(g.id)} onPress={() => onToggleGroup(g.id)} />
          ))}
        </View>
      )}

      {/* Email chips */}
      {emails.length > 0 && (
        <View className="mt-2 flex-row flex-wrap" style={{ gap: 6 }}>
          {emails.map((e) => (
            <View key={e} className="flex-row items-center rounded-md bg-surface3 py-1 pl-2.5 pr-1.5" style={{ gap: 4 }}>
              <Txt mono className="text-[11px] text-ink-2">{e}</Txt>
              <Pressable onPress={() => onEmailsChange(emails.filter((x) => x !== e))} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Remove ${e}`}>
                <IconX size={13} color={colors.ink3} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Add email */}
      <View className="mt-2 flex-row items-center rounded-full border border-border bg-surface px-3 py-2" style={{ gap: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          blurOnSubmit={false}
          placeholder="Add an email address…"
          placeholderTextColor={colors.ink3}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          className="flex-1 text-[14px] text-ink"
          style={{ fontFamily: 'Archivo_400Regular', padding: 0 }}
        />
        {draft.trim().length > 0 && (
          <Pressable onPress={add} hitSlop={6} accessibilityRole="button" accessibilityLabel="Add email">
            <IconPlus size={16} color={colors.ink3} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
