import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Chip } from '@/components/ui/controls';
import { Label, Txt } from '@/components/ui/Txt';
import { MEDIUMS, OUTLETS, PLATFORMS } from '@/data/mock/entities';
import { eachDay } from '@/data/mock/util';
import {
  countActiveFilters,
  EMPTY_FILTERS,
  useMentionsFilterStore,
} from '@/stores/mentionsFilterStore';
import { usePeriodStore } from '@/stores/periodStore';
import type { CommentSentiment, Emphasis, IMentionsFilters, RankBy, ToneKey } from '@/types';
import { renderBackdrop, sheetSurface, type SheetHandle } from './sheet';

// Rank-by options (Stories tab only). Short chip labels; the order is "most first".
const RANK_OPTS: { value: RankBy; label: string }[] = [
  { value: 'articles', label: 'Articles' },
  { value: 'engagement', label: 'Score' },
  { value: 'posts', label: 'Posts' },
  { value: 'comments', label: 'Comments' },
];

const EMPHASIS_OPTS: { value: Emphasis; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'focus', label: 'Main focus only' },
];
const TONE_OPTS: { value: ToneKey; label: string }[] = [
  { value: 'negative', label: 'Negative' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'positive', label: 'Positive' },
];
const STORY_VALUE_OPTS: { value: number; label: string }[] = [
  { value: 0, label: 'Any' },
  { value: 1, label: 'Low+' },
  { value: 2, label: 'Medium+' },
  { value: 3, label: 'High+' },
];
const COMMENT_OPTS: { value: CommentSentiment; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'neg', label: 'Mostly negative' },
  { value: 'neu', label: 'Mostly neutral' },
  { value: 'pos', label: 'Mostly positive' },
];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-5">
      <Label>{title}</Label>
      <View className="mt-2.5 flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

export const FilterSheet = forwardRef<SheetHandle, { showRankBy?: boolean }>(
  ({ showRankBy = false }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['88%'], []);

  const committed = useMentionsFilterStore((s) => s.filters);
  const applyFilters = useMentionsFilterStore((s) => s.applyFilters);
  const rankBy = useMentionsFilterStore((s) => s.rankBy);
  const setRankBy = useMentionsFilterStore((s) => s.setRankBy);

  const from = usePeriodStore((s) => s.from);
  const to = usePeriodStore((s) => s.to);
  const days = useMemo(() => eachDay(from, to), [from, to]);

  const [draft, setDraft] = useState<IMentionsFilters>(committed);
  const [draftRankBy, setDraftRankBy] = useState<RankBy>(rankBy);

  useImperativeHandle(
    ref,
    () => ({
      present: () => {
        setDraft(committed);
        setDraftRankBy(rankBy);
        sheet.current?.present();
      },
    }),
    [committed, rankBy],
  );

  const count = countActiveFilters(draft);

  const apply = () => {
    applyFilters(draft);
    setRankBy(draftRankBy);
    sheet.current?.dismiss();
  };

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <View style={{ flex: 1 }} className="px-4">
        <View className="flex-row items-center justify-between py-1.5">
          <Txt weight="bold" className="text-[18px]">
            Filters
          </Txt>
          <Pressable onPress={() => setDraft(EMPTY_FILTERS)} hitSlop={8}>
            <Txt weight="medium" className="text-[13px] text-ink-3">
              Reset
            </Txt>
          </Pressable>
        </View>

        <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {showRankBy && (
            <Section title="Rank by">
              {RANK_OPTS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={draftRankBy === o.value}
                  onPress={() => setDraftRankBy(o.value)}
                />
              ))}
            </Section>
          )}

          <Section title="Medium">
            {MEDIUMS.map((m) => (
              <Chip
                key={m.medium}
                label={m.label}
                active={draft.mediums.includes(m.medium)}
                onPress={() => setDraft((d) => ({ ...d, mediums: toggle(d.mediums, m.medium) }))}
              />
            ))}
          </Section>

          <Section title="Emphasis">
            {EMPHASIS_OPTS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={draft.emphasis === o.value}
                onPress={() => setDraft((d) => ({ ...d, emphasis: o.value }))}
              />
            ))}
          </Section>

          <Section title="Article tone">
            {TONE_OPTS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={draft.tones.includes(o.value)}
                onPress={() => setDraft((d) => ({ ...d, tones: toggle(d.tones, o.value) }))}
              />
            ))}
          </Section>

          <Section title="Story value — at least">
            {STORY_VALUE_OPTS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={draft.storyValueMin === o.value}
                onPress={() => setDraft((d) => ({ ...d, storyValueMin: o.value }))}
              />
            ))}
          </Section>

          <Section title="Platform">
            {PLATFORMS.map((p) => (
              <Chip
                key={p.code}
                label={p.label}
                active={draft.platforms.includes(p.code)}
                onPress={() => setDraft((d) => ({ ...d, platforms: toggle(d.platforms, p.code) }))}
              />
            ))}
          </Section>

          <Section title="Comment sentiment">
            {COMMENT_OPTS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={draft.commentSentiment === o.value}
                onPress={() => setDraft((d) => ({ ...d, commentSentiment: o.value }))}
              />
            ))}
          </Section>

          <Section title="Days">
            {days.map((d) => (
              <Chip
                key={d.date}
                label={d.label}
                active={draft.days.includes(d.date)}
                onPress={() => setDraft((dr) => ({ ...dr, days: toggle(dr.days, d.date) }))}
              />
            ))}
          </Section>

          <Section title="Outlet">
            {OUTLETS.map((o) => (
              <Chip
                key={o.name}
                label={o.name}
                active={draft.outlets.includes(o.name)}
                onPress={() => setDraft((d) => ({ ...d, outlets: toggle(d.outlets, o.name) }))}
              />
            ))}
          </Section>
        </BottomSheetScrollView>

        <Pressable onPress={apply} className="mb-3 mt-2 items-center rounded-full bg-ink py-3.5">
          <Txt weight="semibold" className="text-[14px] text-white">
            {count > 0 ? `Apply · ${count}` : 'Apply'}
          </Txt>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
});

FilterSheet.displayName = 'FilterSheet';
