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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft, IconPlus, IconX } from '@/components/navIcons';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/components/sheets/ConfirmSheet';
import { Card } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { useDraftForm, useLockBrief, useUpdateBrief } from '@/services/api/queries';
import { addDays, TODAY } from '@/lib/dateRange';
import { formatCampaignDay } from '@/features/campaigns/phase';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';

const LAUNCH_OPTIONS = [
  { label: 'In 2 weeks', days: 14 },
  { label: 'In 1 month', days: 30 },
  { label: 'In 6 weeks', days: 42 },
  { label: 'In 2 months', days: 60 },
];

type GoalRow = { short: string; target: string };

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <View className="mt-3">
      <Label>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        className="mt-1.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[15px] text-ink"
        style={{ fontFamily: 'Archivo_400Regular' }}
      />
    </View>
  );
}

// The lean "New evaluation" brief builder — one screen: what you're launching + goals and
// targets, then Save draft or Lock brief. A locked brief becomes a pre-launch evaluation.
export default function CampaignBriefScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: form } = useDraftForm(id);
  const updateMut = useUpdateBrief();
  const lockMut = useLockBrief();
  const confirmRef = useRef<ConfirmSheetHandle>(null);

  const [product, setProduct] = useState('');
  const [brand, setBrand] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [launch, setLaunch] = useState('');
  const [goals, setGoals] = useState<GoalRow[]>([]);

  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !form) return;
    seededRef.current = true;
    setProduct(form.product);
    setBrand(form.brand);
    setCompetitor(form.competitor);
    setLaunch(form.launch);
    setGoals(form.goals.map((g) => ({ ...g })));
  }, [form]);

  const input = () => ({ id, product, brand, competitor, launch, goals });
  const saving = updateMut.isPending || lockMut.isPending;
  const canLock = product.trim().length > 0 && launch.length > 0;

  const setGoal = (i: number, patch: Partial<GoalRow>) =>
    setGoals((prev) => prev.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  const removeGoal = (i: number) => setGoals((prev) => prev.filter((_, j) => j !== i));
  const addGoal = () => setGoals((prev) => [...prev, { short: 'New goal', target: '' }]);

  const saveDraft = () => updateMut.mutate(input(), { onSuccess: () => goBack() });
  const lock = () =>
    confirmRef.current?.present({
      title: 'Lock this brief?',
      message:
        'Once locked, the brief is set and the pre-launch baseline is captured on launch day. You can still reopen it to read.',
      confirmLabel: 'Lock brief',
      onConfirm: () => lockMut.mutate(input(), { onSuccess: () => goBack() }),
    });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center gap-1 px-2 py-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Txt variant="caption" numberOfLines={1} className="text-ink-3">
            New evaluation
          </Txt>
          <Txt variant="title" numberOfLines={1}>
            {product.trim() ? `${product.trim()} launch` : 'New evaluation'}
          </Txt>
        </View>
      </View>

      <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Txt className="text-[13px] leading-[19px] text-ink-3">
            Fill the brief — what you’re launching and the goals it’s measured against. Lock it
            before launch day to capture the baseline.
          </Txt>

          {/* What you're launching */}
          <Card className="gap-0">
            <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-3">
              What you’re launching
            </Txt>
            <Field label="Product" value={product} onChangeText={setProduct} placeholder="e.g. VinFast VF 8" />
            <Field label="Brand" value={brand} onChangeText={setBrand} placeholder="e.g. VinFast" />
            <Field label="Against" value={competitor} onChangeText={setCompetitor} placeholder="e.g. BYD" />

            <View className="mt-3">
              <Label>Launch date</Label>
              <View className="mt-1.5 flex-row flex-wrap gap-2">
                {LAUNCH_OPTIONS.map((o) => {
                  const date = addDays(TODAY, o.days);
                  const active = launch === date;
                  return (
                    <Pressable
                      key={o.label}
                      onPress={() => setLaunch(date)}
                      className={`rounded-full border px-3 py-1.5 ${active ? 'border-ink bg-ink' : 'border-border bg-surface'}`}>
                      <Txt weight="medium" className={`text-[12px] ${active ? 'text-white' : 'text-ink-2'}`}>
                        {o.label}
                      </Txt>
                    </Pressable>
                  );
                })}
              </View>
              {launch ? (
                <Txt className="mt-2 text-[12px] text-ink-2">Launches {formatCampaignDay(launch)}</Txt>
              ) : (
                <Txt className="mt-2 text-[12px] text-ink-3">
                  Pick a launch date to start the countdown.
                </Txt>
              )}
            </View>
          </Card>

          {/* Goals & targets */}
          <Card className="gap-0">
            <View className="flex-row items-center justify-between">
              <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-3">
                Goals &amp; targets
              </Txt>
              <Pressable onPress={addGoal} hitSlop={6} className="flex-row items-center gap-1">
                <IconPlus size={14} color={colors.ink3} />
                <Txt weight="medium" className="text-[12px] text-ink-2">
                  Add goal
                </Txt>
              </Pressable>
            </View>
            <View className="mt-2 gap-3">
              {goals.length === 0 ? (
                <Txt className="text-[12px] text-ink-3">No goals yet — add one above.</Txt>
              ) : (
                goals.map((g, i) => (
                  <View key={i} className="rounded-xl bg-surface2 p-3">
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        value={g.short}
                        onChangeText={(t) => setGoal(i, { short: t })}
                        placeholder="Goal"
                        placeholderTextColor={colors.ink3}
                        className="flex-1 text-[14px] text-ink"
                        style={{ fontFamily: 'Archivo_600SemiBold', padding: 0 }}
                      />
                      <Pressable onPress={() => removeGoal(i)} hitSlop={8} accessibilityLabel="Remove goal">
                        <IconX size={15} color={colors.ink3} />
                      </Pressable>
                    </View>
                    <TextInput
                      value={g.target}
                      onChangeText={(t) => setGoal(i, { target: t })}
                      placeholder="Target…"
                      placeholderTextColor={colors.ink3}
                      multiline
                      className="mt-1 text-[13px] text-ink-2"
                      style={{ fontFamily: 'Archivo_400Regular', padding: 0 }}
                    />
                  </View>
                ))
              )}
            </View>
          </Card>
        </ScrollView>

        {/* Sticky actions */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          className="flex-row gap-2 border-t border-border bg-bg px-4 pt-3">
          <Pressable
            onPress={saveDraft}
            disabled={saving}
            style={{ opacity: saving ? 0.5 : 1 }}
            className="flex-1 items-center rounded-full border border-border bg-surface py-3 active:opacity-80">
            <Txt weight="semibold" className="text-[14px] text-ink-2">
              Save draft
            </Txt>
          </Pressable>
          <Pressable
            onPress={lock}
            disabled={!canLock || saving}
            style={{ opacity: !canLock || saving ? 0.4 : 1 }}
            className="flex-1 items-center rounded-full bg-ink py-3 active:opacity-80">
            <Txt weight="semibold" className="text-[14px] text-white">
              Lock brief
            </Txt>
          </Pressable>
        </View>

      <ConfirmSheet ref={confirmRef} />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
