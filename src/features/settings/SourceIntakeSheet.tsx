import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { IconPlus, IconSearch, IconX } from '@/components/navIcons';
import { Checkbox } from '@/components/ui/Checkbox';
import { Pill, SegmentedControl } from '@/components/ui/controls';
import { Toggle } from '@/components/ui/Toggle';
import { Label, Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { STATUS_LABEL, statusTone } from '@/features/publishers/status';
import {
  useChannels,
  useCreateChannel,
  useCreatePublisher,
  usePublishers,
} from '@/services/api/queries';
import { colors } from '@/theme/tokens';
import type { IPublisherStatus } from '@/types';

type SourceKind = 'publication' | 'social';
type SourceOption = { id: string; name: string; sub: string; kind: SourceKind; status: IPublisherStatus };

// MANAGE → source intake (web: SourceIntakeSidebar). The "Restrict to bucket sources" rule,
// and when it's on, a per-source checklist (the desktop's two-pane Account↔Bucket transfer
// collapsed to a single include/exclude list for the phone): Publications/Social tabs, search,
// select-all, status badges, add-a-source, and the "can't save an empty restricted bucket" guard.
export type SourceIntakeConfig = {
  bucketId: number;
  bucketName: string;
  restrict: boolean;
  sourceIds: string[];
};
export type SourceIntakeHandle = { present: (config: SourceIntakeConfig) => void };

const domainOf = (url: string) =>
  url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

export const SourceIntakeSheet = forwardRef<
  SourceIntakeHandle,
  { onSave: (bucketId: number, restrict: boolean, sourceIds: string[]) => void }
>(({ onSave }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['92%'], []);

  const { data: publishers = [] } = usePublishers();
  const { data: channels = [] } = useChannels();
  const createPub = useCreatePublisher();
  const createChan = useCreateChannel();

  const pool: SourceOption[] = useMemo(
    () => [
      ...publishers.map((p) => ({
        id: `pub:${p.id}`,
        name: p.publisher_name,
        sub: domainOf(p.website_url),
        kind: 'publication' as const,
        status: p.status ?? null,
      })),
      ...channels.map((c) => ({
        id: `soc:${c.id}`,
        name: c.name || c.handle,
        sub: c.handle,
        kind: 'social' as const,
        status: c.status ?? null,
      })),
    ],
    [publishers, channels],
  );

  const [bucketId, setBucketId] = useState(0);
  const [bucketName, setBucketName] = useState('');
  const [restrict, setRestrict] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState<SourceKind>('publication');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [addName, setAddName] = useState('');

  useImperativeHandle(ref, () => ({
    present: (c) => {
      setBucketId(c.bucketId);
      setBucketName(c.bucketName);
      setRestrict(c.restrict);
      setSelected(new Set(c.sourceIds));
      setKind('publication');
      setSearch('');
      setAdding(false);
      setAddUrl('');
      setAddName('');
      sheet.current?.present();
    },
  }));

  const inKind = pool.filter((s) => s.kind === kind);
  const q = search.trim().toLowerCase();
  const visible = q
    ? inKind.filter((s) => s.name.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q))
    : inKind;
  const allVisibleSelected = visible.length > 0 && visible.every((s) => selected.has(s.id));
  const pubSel = pool.filter((s) => s.kind === 'publication' && selected.has(s.id)).length;
  const socSel = pool.filter((s) => s.kind === 'social' && selected.has(s.id)).length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((s) => next.delete(s.id));
      else visible.forEach((s) => next.add(s.id));
      return next;
    });

  const submitAdd = async () => {
    const url = addUrl.trim();
    if (!url) return;
    const name = addName.trim() || domainOf(url);
    try {
      if (kind === 'publication') {
        const p = await createPub.mutateAsync({ website_url: url, publisher_name: name });
        setSelected((prev) => new Set(prev).add(`pub:${p.id}`));
      } else {
        const c = await createChan.mutateAsync({ profile_url: url, name });
        setSelected((prev) => new Set(prev).add(`soc:${c.id}`));
      }
    } catch {
      // ignore — the create mutation surfaces its own failure
    }
    setAdding(false);
    setAddUrl('');
    setAddName('');
  };

  const wouldStarve = restrict && selected.size === 0;
  const save = () => {
    if (wouldStarve) return;
    onSave(bucketId, restrict, [...selected]);
    sheet.current?.dismiss();
  };

  const KIND_TABS = [
    { value: 'publication' as const, label: 'Publications', count: pubSel },
    { value: 'social' as const, label: 'Social', count: socSel },
  ];

  return (
    <BottomSheetModal
      ref={sheet}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      {...sheetSurface}>
      <View style={{ flex: 1 }} className="px-4">
        {/* Header */}
        <View className="flex-row items-start justify-between py-1" style={{ gap: 8 }}>
          <View className="min-w-0 flex-1">
            <Label>Source intake</Label>
            <Txt variant="title" numberOfLines={1} className="mt-0.5">
              {bucketName}
            </Txt>
          </View>
          <Pressable
            onPress={() => sheet.current?.dismiss()}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-surface2">
            <IconX size={18} color={colors.ink3} />
          </Pressable>
        </View>

        {/* Restrict rule */}
        <View className="mt-2 flex-row items-center rounded-card border border-border bg-surface p-4" style={{ gap: 12 }}>
          <View className="flex-1">
            <Txt weight="semibold" className="text-[14px]">
              Restrict to bucket sources
            </Txt>
            <Txt variant="body" className="mt-0.5 text-ink-3">
              {restrict
                ? 'Only the sources in this bucket feed it.'
                : 'Every source in your garden feeds this bucket.'}
            </Txt>
          </View>
          <Toggle value={restrict} onValueChange={setRestrict} />
        </View>

        {/* Picker */}
        {restrict ? (
          <View className="mt-4 min-h-0 flex-1">
            <SegmentedControl
              options={KIND_TABS}
              value={kind}
              onChange={(v) => {
                setKind(v);
                setAdding(false);
                setSearch('');
              }}
            />

            <View className="mt-2.5 flex-row items-center rounded-full border border-border bg-surface px-3 py-2">
              <IconSearch size={15} color={colors.ink3} />
              <BottomSheetTextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search sources…"
                placeholderTextColor={colors.ink3}
                autoCapitalize="none"
                autoCorrect={false}
                className="ml-2 flex-1 text-[14px] text-ink"
                style={{ fontFamily: 'Archivo_400Regular', padding: 0 }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <IconX size={14} color={colors.ink3} />
                </Pressable>
              )}
            </View>

            <View className="mt-2.5 flex-row items-center justify-between px-0.5">
              <Pressable onPress={toggleAllVisible} hitSlop={6} className="flex-row items-center" style={{ gap: 8 }}>
                <Checkbox checked={allVisibleSelected} />
                <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-2">
                  Select all in view
                </Txt>
              </Pressable>
              <Txt mono className="text-[11px] text-ink-3">
                {kind === 'publication' ? pubSel : socSel} in bucket
              </Txt>
            </View>

            <BottomSheetScrollView
              className="mt-1.5"
              contentContainerStyle={{ paddingBottom: 12 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {/* Add a source */}
              {adding ? (
                <View className="mb-2.5 rounded-xl border border-border bg-surface2 p-3">
                  <BottomSheetTextInput
                    value={addUrl}
                    onChangeText={setAddUrl}
                    placeholder={kind === 'publication' ? 'Website URL (e.g. example.com)' : 'Profile URL'}
                    placeholderTextColor={colors.ink3}
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-ink"
                    style={{ fontFamily: 'Archivo_400Regular' }}
                  />
                  <BottomSheetTextInput
                    value={addName}
                    onChangeText={setAddName}
                    placeholder="Name (optional)"
                    placeholderTextColor={colors.ink3}
                    className="mt-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-ink"
                    style={{ fontFamily: 'Archivo_400Regular' }}
                  />
                  <View className="mt-2.5 flex-row" style={{ gap: 8 }}>
                    <Pressable
                      onPress={() => setAdding(false)}
                      className="flex-1 items-center rounded-full border border-border bg-surface py-2.5 active:opacity-80">
                      <Txt weight="semibold" className="text-[13px] text-ink-2">Cancel</Txt>
                    </Pressable>
                    <Pressable
                      onPress={submitAdd}
                      disabled={!addUrl.trim() || createPub.isPending || createChan.isPending}
                      style={{ opacity: addUrl.trim() ? 1 : 0.4 }}
                      className="flex-1 items-center rounded-full bg-ink py-2.5 active:opacity-90">
                      <Txt weight="semibold" className="text-[13px] text-white">Add</Txt>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => setAdding(true)}
                  className="mb-2.5 flex-row items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 active:opacity-80">
                  <IconPlus size={15} color={colors.ink3} />
                  <Txt weight="medium" className="text-[12px] text-ink-3">
                    Add a new source to this bucket
                  </Txt>
                </Pressable>
              )}

              {visible.length === 0 ? (
                <Txt className="py-6 text-center text-[13px] text-ink-3">
                  {q ? 'No sources match your search.' : `No ${kind === 'publication' ? 'publications' : 'social sources'} yet.`}
                </Txt>
              ) : (
                visible.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => toggle(s.id)}
                    className="flex-row items-center border-b border-border py-2.5 active:opacity-70"
                    style={{ gap: 10 }}>
                    <Checkbox checked={selected.has(s.id)} />
                    <View className="min-w-0 flex-1">
                      <Txt weight="semibold" numberOfLines={1} className="text-[14px]">
                        {s.name}
                      </Txt>
                      <Txt variant="caption" numberOfLines={1} className="text-ink-3">
                        {s.sub}
                      </Txt>
                    </View>
                    {s.status ? <Pill label={STATUS_LABEL[s.status]} tone={statusTone(s.status)} /> : null}
                  </Pressable>
                ))
              )}
            </BottomSheetScrollView>
          </View>
        ) : (
          <View className="flex-1">
            <Txt variant="caption" className="mt-3 text-ink-3">
              Every publisher and channel in your garden feeds this bucket. Turn on Restrict to
              choose a specific set.
            </Txt>
          </View>
        )}

        {/* Footer */}
        <View className="border-t border-border pb-3 pt-2.5">
          {wouldStarve && (
            <Txt className="mb-2 text-right text-[11px]" style={{ color: '#b24a14' }}>
              Add at least one source to the bucket to save.
            </Txt>
          )}
          <Pressable
            onPress={save}
            disabled={wouldStarve}
            style={{ opacity: wouldStarve ? 0.4 : 1 }}
            className="items-center rounded-full bg-ink py-3.5 active:opacity-90">
            <Txt weight="semibold" className="text-[14px] text-white">
              Save
            </Txt>
          </Pressable>
        </View>
      </View>
    </BottomSheetModal>
  );
});

SourceIntakeSheet.displayName = 'SourceIntakeSheet';
