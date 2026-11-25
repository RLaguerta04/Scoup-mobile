import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { Skeleton } from '@/components/ui/feedback';
import { ConfirmSheet, type ConfirmSheetHandle } from '@/components/sheets/ConfirmSheet';
import { IconPlus } from '@/components/navIcons';
import { SendoutCard } from './SendoutCard';
import { useSelectionStore } from '@/stores/selectionStore';
import {
  useDeleteSendout,
  useEmailConfig,
  useNewsletterSettings,
  useUpdateEmailBranding,
} from '@/services/api/queries';
import { colors } from '@/theme/tokens';
import type { IEmailSendout } from '@/types';

// The newsletter's Email config (web: EmailTablePage) — header branding + a list of
// sendouts (schedules). Newsletter-level; reads the selected newsletter from the store so
// it drops into both the bucket detail's Email tab and the Settings → Email tab. Renders
// inside the parent's ScrollView (no scroll of its own).
export function EmailConfigView() {
  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const { data: config, isLoading } = useEmailConfig(newsletterId);
  const { data: settings } = useNewsletterSettings(newsletterId);
  const updateBranding = useUpdateEmailBranding();
  const deleteSendout = useDeleteSendout();
  const confirmRef = useRef<ConfirmSheetHandle>(null);

  const bucketNameOf = useMemo(() => {
    const map = new Map<number, string>();
    settings?.buckets.forEach((b) => map.set(b.id, b.name));
    return (id: number) => map.get(id) ?? `Bucket ${id}`;
  }, [settings]);

  const [header, setHeader] = useState('');
  const [subject, setSubject] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const initRef = useRef(false);
  useEffect(() => {
    if (config && !initRef.current) {
      initRef.current = true;
      setHeader(config.header);
      setSubject(config.subject);
      setLogoUrl(config.logoUrl);
    }
  }, [config]);

  const brandingDirty = config
    ? header !== config.header || subject !== config.subject || logoUrl.trim() !== config.logoUrl
    : false;
  const saveBranding = () => updateBranding.mutate({ newsletterId, header, subject, logoUrl });

  const openCreate = () =>
    router.push({ pathname: '/newsletter-sendout/[sendoutId]', params: { sendoutId: 'new' } });
  const openEdit = (s: IEmailSendout) =>
    router.push({ pathname: '/newsletter-sendout/[sendoutId]', params: { sendoutId: s.id } });

  const confirmDelete = (s: IEmailSendout) =>
    confirmRef.current?.present({
      title: `Delete this ${s.type} sendout?`,
      message: 'This removes the sendout schedule from this newsletter.',
      confirmLabel: 'Delete sendout',
      onConfirm: () => deleteSendout.mutate({ newsletterId, sendoutId: s.id }),
    });

  if (isLoading || !config) {
    return (
      <View style={{ gap: 12 }} className="pt-2">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </View>
    );
  }

  return (
    <View style={{ gap: 24 }}>
      {/* Header branding */}
      <View>
        <Label>Email header</Label>
        <Card className="mt-2">
          <Txt weight="semibold" className="text-[13px]">Header text</Txt>
          <TextInput
            value={header}
            onChangeText={setHeader}
            placeholder="e.g. Your weekly media brief"
            placeholderTextColor={colors.ink3}
            multiline
            className="mt-1.5 min-h-[44px] rounded-xl border border-border bg-surface2 px-3.5 py-2.5 text-[14px] text-ink"
            style={{ fontFamily: 'Archivo_400Regular', textAlignVertical: 'top' }}
          />

          <Txt weight="semibold" className="mt-3.5 text-[13px]">Default subject</Txt>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. Telecommunications Newsletter"
            placeholderTextColor={colors.ink3}
            className="mt-1.5 rounded-xl border border-border bg-surface2 px-3.5 py-2.5 text-[14px] text-ink"
            style={{ fontFamily: 'Archivo_400Regular' }}
          />

          <Txt weight="semibold" className="mt-3.5 text-[13px]">Logo URL</Txt>
          <TextInput
            value={logoUrl}
            onChangeText={setLogoUrl}
            placeholder="https://…/logo.png"
            placeholderTextColor={colors.ink3}
            autoCapitalize="none"
            autoCorrect={false}
            className="mt-1.5 rounded-xl border border-border bg-surface2 px-3.5 py-2.5 text-[14px] text-ink"
            style={{ fontFamily: 'Archivo_400Regular' }}
          />

          {/* Preview */}
          <Txt mono weight="medium" className="mt-4 text-[10px] uppercase tracking-wide text-ink-3">Preview</Txt>
          <View className="mt-1.5 flex-row items-center rounded-xl border border-border bg-surface p-3" style={{ gap: 12 }}>
            {logoUrl.trim() ? (
              <Image source={{ uri: logoUrl.trim() }} style={{ width: 44, height: 44, borderRadius: 8 }} resizeMode="cover" />
            ) : (
              <View className="h-11 w-11 items-center justify-center rounded-lg bg-surface3">
                <Txt mono className="text-[9px] text-ink-3">LOGO</Txt>
              </View>
            )}
            <Txt weight="semibold" numberOfLines={2} className="flex-1 text-[15px]">
              {header || 'Enter header text above…'}
            </Txt>
          </View>

          {brandingDirty && (
            <View className="mt-3 flex-row items-center justify-end" style={{ gap: 10 }}>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <View className="size-2 rounded-full" style={{ backgroundColor: '#e08a1e' }} />
                <Txt className="text-[12px]" style={{ color: '#b45309' }}>Unsaved</Txt>
              </View>
              <Pressable
                onPress={saveBranding}
                disabled={updateBranding.isPending}
                accessibilityRole="button"
                accessibilityLabel="Save header"
                className="rounded-full bg-ink px-4 py-2 active:opacity-90">
                <Txt weight="semibold" className="text-[13px] text-white">
                  {updateBranding.isPending ? 'Saving…' : 'Save header'}
                </Txt>
              </Pressable>
            </View>
          )}
        </Card>
      </View>

      {/* Sendouts */}
      <View>
        <Label>Sendouts ({config.sendouts.length})</Label>
        <Txt className="mb-2.5 mt-1 text-[12px] text-ink-3">
          When this newsletter is delivered, and to whom.
        </Txt>

        <Pressable
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel="Add sendout"
          className="mb-3 flex-row items-center justify-center rounded-full bg-ink py-2.5 active:opacity-90"
          style={{ gap: 6 }}>
          <IconPlus size={16} color="#ffffff" />
          <Txt weight="semibold" className="text-[13px] text-white">Add sendout</Txt>
        </Pressable>

        {config.sendouts.length === 0 ? (
          <View className="items-center rounded-card border border-dashed border-border py-8">
            <Txt weight="semibold" className="text-[14px]">No sendouts yet</Txt>
            <Txt className="mt-1 text-[12px] text-ink-3">Add a sendout to choose when this newsletter is delivered.</Txt>
          </View>
        ) : (
          config.sendouts.map((s) => (
            <SendoutCard
              key={s.id}
              sendout={s}
              bucketNames={s.bucketIds.map(bucketNameOf)}
              onOpen={() => openEdit(s)}
              onDelete={() => confirmDelete(s)}
            />
          ))
        )}
      </View>

      <ConfirmSheet ref={confirmRef} />
    </View>
  );
}
