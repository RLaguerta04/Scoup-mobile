import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Label, Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import { TrackerBadge } from './badges';
import { formatTimesNormal } from './verdict';
import type { IDecisionTracker } from '@/types';

// The "Crises open" panel (web: ReportCrisisCard) — the open crisis trackers, worst first,
// each with its reading badge, the decision for today, where it's moving, and a link into
// the full tracker. Hidden when nothing is open.
export function CrisesOpenPanel({ trackers }: { trackers: IDecisionTracker[] }) {
  if (trackers.length === 0) return null;
  const open = (id: string) =>
    router.push({ pathname: '/report-tracker/[trackerId]', params: { trackerId: id } });
  return (
    <View className="rounded-card border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Label>Crises open</Label>
        <Txt mono className="text-[10px] uppercase tracking-wider text-ink-3">
          {trackers.length} tracker{trackers.length === 1 ? '' : 's'}, worst first
        </Txt>
      </View>

      <View className="mt-3" style={{ gap: 10 }}>
        {trackers.map((t) => (
          <View key={t.id} className="rounded-xl border border-border bg-surface2 px-3.5 py-3">
            <View className="flex-row flex-wrap items-center" style={{ gap: 8 }}>
              <TrackerBadge verdict={t.verdict} />
              <Pressable onPress={() => open(t.id)} className="min-w-0 flex-1">
                <Txt weight="bold" className="text-[15px]" numberOfLines={2}>
                  {t.storyTitle}
                </Txt>
              </Pressable>
            </View>
            <Txt mono className="mt-1.5 text-[11px] text-ink-3">
              Day {t.day} · {t.dateLabel} · {formatTimesNormal(t.timesNormal)} a normal day
            </Txt>

            <Label className="mt-2.5">The decision today</Label>
            <Txt variant="body" className="mt-1 text-ink">
              {t.decisionToday}
            </Txt>
            <Txt variant="body" className="mt-1.5 text-ink-3">
              {t.move}
            </Txt>

            <Pressable onPress={() => open(t.id)} hitSlop={6} className="mt-2 self-start">
              <Txt weight="semibold" className="text-[13px]" style={{ color: colors.link }}>
                Open the tracker ›
              </Txt>
            </Pressable>
          </View>
        ))}
      </View>

      <Txt className="mt-3 text-[11px] leading-[16px] text-ink-3">
        A tracker opens 24 hours after a story’s first ESCALATE if a signal was live in the six
        hours before. With none, the duty officer reviews it.
      </Txt>
    </View>
  );
}
