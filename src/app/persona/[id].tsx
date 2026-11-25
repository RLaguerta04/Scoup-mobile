import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft, IconPencil, IconStar, IconTrash } from '@/components/navIcons';
import { Card, Divider } from '@/components/ui/Card';
import { Pill } from '@/components/ui/controls';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/components/sheets/ConfirmSheet';
import { PersonaFormSheet, type PersonaFormHandle } from '@/features/personas/PersonaFormSheet';
import {
  useDeletePersonas,
  usePersonas,
  useSetPrimaryPersona,
  useUpdatePersona,
} from '@/services/api/queries';
import { formatLongDate } from '@/lib/format';
import { goBack } from '@/lib/nav';
import { colors, scoupYellow } from '@/theme/tokens';

// Pushed persona detail — the dossier reader (User Profile + Organization Profile, each
// section rendered), newsletter badges, and rename / set-primary / delete. The AI chat
// and the manual rich-text dossier editor are deferred; Edit reuses the list form sheet.
export default function PersonaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = usePersonas();
  const persona = data?.find((p) => p.id === id);

  const updateMut = useUpdatePersona();
  const deleteMut = useDeletePersonas();
  const setPrimaryMut = useSetPrimaryPersona();

  const formRef = useRef<PersonaFormHandle>(null);
  const confirmRef = useRef<ConfirmSheetHandle>(null);

  const confirmDelete = () =>
    persona &&
    confirmRef.current?.present({
      title: `Delete “${persona.name}”?`,
      message: 'This removes the persona and its dossiers. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => deleteMut.mutate([persona.id], { onSuccess: goBack }),
    });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center gap-1 px-2 py-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <Txt variant="title" numberOfLines={1} className="flex-1">
          {persona?.name ?? 'Persona'}
        </Txt>
        {persona && (
          <View className="flex-row" style={{ gap: 2 }}>
            <Pressable
              onPress={() => formRef.current?.present(persona)}
              hitSlop={6}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
              <IconPencil size={17} color={colors.ink3} />
            </Pressable>
            <Pressable
              onPress={confirmDelete}
              hitSlop={6}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
              <IconTrash size={17} color="#c0492f" />
            </Pressable>
          </View>
        )}
      </View>

      {isLoading && !persona ? (
        <View className="gap-3 px-4 pt-2">
          <Skeleton className="h-20 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
        </View>
      ) : !persona ? (
        <EmptyState title="Persona not found" hint="It may have been deleted. Go back to Personas." />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4, gap: 16 }}
          showsVerticalScrollIndicator={false}>
          {/* Identity + status */}
          <View>
            {persona.active && (
              <View className="mb-2 self-start rounded-full px-3 py-0.5" style={{ backgroundColor: '#fdeccb' }}>
                <Txt mono weight="semibold" className="text-[10px] uppercase tracking-wide text-[#9a6413]">
                  Primary persona
                </Txt>
              </View>
            )}
            <Txt weight="bold" className="text-[18px] leading-[24px]">{persona.title}</Txt>
            <Txt className="mt-1.5 text-[12px] text-ink-3">
              Last edited <Txt weight="medium" className="text-[12px] text-ink-2">{formatLongDate(persona.updatedAt)}</Txt>
            </Txt>

            {!persona.active && (
              <Pressable
                onPress={() => setPrimaryMut.mutate(persona.id)}
                disabled={setPrimaryMut.isPending}
                className="mt-3 flex-row items-center self-start rounded-full border px-3.5 py-2 active:opacity-80"
                style={{ borderColor: scoupYellow }}>
                <IconStar size={15} color="#9a6413" />
                <Txt weight="semibold" className="ml-2 text-[12px]" style={{ color: '#9a6413' }}>
                  Set as primary persona
                </Txt>
              </Pressable>
            )}
          </View>

          {/* Newsletters */}
          {persona.newsletters.length > 0 && (
            <View>
              <Label>Newsletters</Label>
              <View className="mt-2 flex-row flex-wrap" style={{ gap: 6 }}>
                {persona.newsletters.map((n) => (
                  <Pill key={n.id} label={n.name} tone="info" />
                ))}
              </View>
            </View>
          )}

          {/* Dossiers */}
          {persona.dossiers.map((d) => (
            <View key={d.id}>
              <Label>{d.name}</Label>
              <Card className="mt-2">
                {d.sections.map((s, i) => (
                  <View key={s.id}>
                    {i > 0 && <Divider className="my-3" />}
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Txt weight="semibold" className="text-[13px]">{s.name}</Txt>
                      {s.dynamic && <Pill label="Dynamic" tone="brand" />}
                    </View>
                    <Txt className="mt-1.5 text-[13px] leading-[19px] text-ink-2">{s.content}</Txt>
                  </View>
                ))}
              </Card>
            </View>
          ))}

          {/* Monitoring prompt */}
          {!!persona.prompt && (
            <View>
              <Label>Monitoring prompt</Label>
              <Card className="mt-2">
                <Txt className="text-[13px] leading-[19px] text-ink-2">{persona.prompt}</Txt>
              </Card>
            </View>
          )}

          <Txt className="px-1 text-[11px] leading-[16px] text-ink-3">
            The AI chat builder and the full dossier editor are coming next. For now, Edit updates the
            persona’s role, organisation, coverage focus and prompt.
          </Txt>
        </ScrollView>
      )}

      <PersonaFormSheet
        ref={formRef}
        onSubmit={(v) =>
          v.id &&
          updateMut.mutate({ id: v.id, name: v.name, role: v.role, org: v.org, focus: v.focus, prompt: v.prompt })
        }
      />
      <ConfirmSheet ref={confirmRef} />
    </SafeAreaView>
  );
}
