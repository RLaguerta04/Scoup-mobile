import { ScrollView, View } from 'react-native';
import { BackHeader } from '@/components/BackHeader';
import { Screen } from '@/components/ui/Card';
import { Pill, type PillTone } from '@/components/ui/controls';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { useDecisionEdition } from '@/services/api/queries';
import { useSelectionStore } from '@/stores/selectionStore';
import { colors, sentiment } from '@/theme/tokens';
import { CanvasCard, CanvasSection } from '../canvas/section';
import { TrackerBadge } from '../badges';
import { formatTimesNormal, TRACKER_VERDICT } from '../verdict';
import type {
  IDecisionTracker,
  ITrackerCheckItem,
  ITrackerGoalItem,
  TrackerGoalStatus,
} from '@/types';

const GOAL_STATUS: Record<TrackerGoalStatus, { label: string; tone: PillTone }> = {
  met: { label: 'Met', tone: 'positive' },
  ontrack: { label: 'On track', tone: 'positive' },
  behind: { label: 'Behind', tone: 'brand' },
  missed: { label: 'Missed', tone: 'negative' },
  unmeasured: { label: 'Not measured', tone: 'neutral' },
};

// A compact "attention over the days" bar strip. A day above 2× (the containing goal) reads
// red; the rest read ink. The multiple sits above each bar, the day index below.
function AttentionStrip({ attention }: { attention: number[] }) {
  const max = Math.max(2, ...attention);
  return (
    <View className="mt-1 flex-row items-end" style={{ gap: 10, height: 86 }}>
      {attention.map((x, i) => {
        const h = Math.max(4, Math.round((x / max) * 54));
        const over = x > 2;
        return (
          <View key={i} className="items-center" style={{ gap: 4 }}>
            <Txt mono className="text-[9px] text-ink-3">
              {formatTimesNormal(x)}
            </Txt>
            <View
              style={{ width: 24, height: h, borderRadius: 4, backgroundColor: over ? sentiment.negative : colors.ink }}
            />
            <Txt mono className="text-[9px] text-ink-3">
              D{i}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

function Check({ item }: { item: ITrackerCheckItem }) {
  const mark = item.unmeasured ? '–' : item.ok ? '✓' : '✗';
  const color = item.unmeasured ? colors.ink3 : item.ok ? sentiment.positive : sentiment.negative;
  return (
    <View className="flex-row" style={{ gap: 8 }}>
      <Txt weight="bold" className="text-[13px]" style={{ color, width: 14 }}>
        {mark}
      </Txt>
      <View className="min-w-0 flex-1">
        <Txt variant="body" className="text-ink">
          {item.label}
        </Txt>
        {item.detail ? (
          <Txt variant="caption" className="mt-0.5 text-ink-3">
            {item.detail}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

function CheckList({ title, items }: { title: string; items: ITrackerCheckItem[] }) {
  return (
    <View className="mt-3">
      <Txt mono weight="medium" className="mb-1.5 text-[10px] uppercase tracking-wide text-ink-3">
        {title}
      </Txt>
      <View style={{ gap: 8 }}>
        {items.map((it, i) => (
          <Check key={i} item={it} />
        ))}
      </View>
    </View>
  );
}

function GoalRow({ goal }: { goal: ITrackerGoalItem }) {
  const s = GOAL_STATUS[goal.status];
  return (
    <View className="rounded-xl border border-border bg-surface px-3 py-2.5">
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Txt mono weight="bold" className="text-[11px] text-ink-3">
          {goal.id}
        </Txt>
        <Txt weight="semibold" className="min-w-0 flex-1 text-[13px]" numberOfLines={1}>
          {goal.label}
        </Txt>
        <Pill label={s.label} tone={s.tone} />
        <Txt mono weight="bold" className="text-[12px] text-ink">
          {goal.value}
        </Txt>
      </View>
      {goal.detail ? (
        <Txt variant="caption" className="mt-1 text-ink-3">
          {goal.detail}
        </Txt>
      ) : null}
    </View>
  );
}

function TrackerBody({ tracker }: { tracker: IDecisionTracker }) {
  const measured = tracker.goals.filter((g) => g.status !== 'unmeasured');
  const within = tracker.goals.filter((g) => g.status === 'met' || g.status === 'ontrack');
  const { changed } = tracker;
  const label = TRACKER_VERDICT[tracker.verdict].label.toLowerCase();

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}>
      {/* Status */}
      <CanvasCard>
        <View className="flex-row flex-wrap items-center" style={{ gap: 8 }}>
          <TrackerBadge verdict={tracker.verdict} />
          <Txt mono className="text-[11px] text-ink-3">
            Day {tracker.day} · {tracker.dateLabel} · {formatTimesNormal(tracker.timesNormal)} a normal day
          </Txt>
        </View>
        <Txt variant="body" className="mt-2 text-ink">
          {tracker.move}
        </Txt>
      </CanvasCard>

      {/* What to do today */}
      <CanvasSection kicker="What to do today">
        <Txt variant="body" className="text-ink">
          {tracker.decisionToday}
        </Txt>
        {tracker.nextStep ? (
          <View className="mt-3">
            <Label>Next step</Label>
            <Txt variant="body" className="mt-1 text-ink-2">
              {tracker.nextStep}
            </Txt>
          </View>
        ) : null}
      </CanvasSection>

      {/* The trajectory */}
      <CanvasSection kicker="The trajectory">
        <Txt variant="body" className="text-ink">
          Attention peaked at {formatTimesNormal(tracker.peakX)} a normal day on Day {tracker.peakDay}.
          {tracker.trend ? ` The trend is ${tracker.trend}.` : ''}
        </Txt>
        <AttentionStrip attention={tracker.attention} />
        <Txt variant="caption" className="mt-1 text-ink-3">
          Attention counts items against a normal day ({tracker.normalItems} items). The containing
          goal is 2× a normal day.
        </Txt>
      </CanvasSection>

      {/* What changed */}
      <CanvasSection kicker="What changed">
        <Txt variant="body" className="text-ink">
          {changed.items} items today, {changed.records} records, {changed.comments} coded comments.{' '}
          {changed.newOutlets.length > 0
            ? `${changed.newOutlets.length} new unfavorable outlet${changed.newOutlets.length === 1 ? '' : 's'}, tier score ${changed.tierScore}.`
            : 'No new unfavorable outlet.'}
        </Txt>
        {changed.newOutlets.length > 0 && (
          <View className="mt-2.5" style={{ gap: 6 }}>
            {changed.newOutlets.map((o) => (
              <View key={o} className="rounded-lg border border-border bg-surface px-3 py-2">
                <Txt mono weight="medium" className="text-[9px] uppercase tracking-wide" style={{ color: sentiment.negative }}>
                  New outlet against us
                </Txt>
                <Txt weight="semibold" className="text-[13px]">
                  {o}
                </Txt>
              </View>
            ))}
          </View>
        )}
        {changed.newClaim ? (
          <View className="mt-2 rounded-lg border border-border bg-surface px-3 py-2">
            <Txt mono weight="medium" className="text-[9px] uppercase tracking-wide" style={{ color: sentiment.negative }}>
              New claim · contested
            </Txt>
            <Txt variant="body" className="mt-0.5 text-ink">
              {changed.newClaim}
            </Txt>
          </View>
        ) : null}
      </CanvasSection>

      {/* Is the response working? */}
      <CanvasSection kicker="Is the response working?">
        <Txt variant="body" className="text-ink">
          {within.length} of {measured.length} measured goals sit within target.{' '}
          {tracker.goals.length - measured.length} of {tracker.goals.length} aren’t measured yet.
        </Txt>
        <Txt variant="caption" className="mt-0.5 text-ink-3">
          as of {tracker.goalsAsOf}
        </Txt>
        <View className="mt-2.5" style={{ gap: 8 }}>
          {tracker.goals.map((g) => (
            <GoalRow key={g.id} goal={g} />
          ))}
        </View>
      </CanvasSection>

      {/* Why it reads … */}
      <CanvasSection kicker={`Why it reads ${label}`}>
        <Txt variant="body" weight="medium" className="text-ink">
          {tracker.whyReading}
        </Txt>
        <CheckList title="Escalating when 2 are met" items={tracker.escalation} />
        <CheckList title="Containing if every measured check passes" items={tracker.containing} />
      </CanvasSection>

      {/* Who is driving it */}
      <CanvasSection kicker="Who is driving it">
        <Txt mono weight="medium" className="mb-1.5 text-[10px] uppercase tracking-wide text-ink-3">
          Outlets, by items
        </Txt>
        <View style={{ gap: 6 }}>
          {tracker.outlets.map((o) => (
            <View key={o.name} className="flex-row items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
              <View className="min-w-0 flex-1">
                <Txt weight="semibold" className="text-[13px]" numberOfLines={1}>
                  {o.name}
                </Txt>
                <Txt variant="caption" className="text-ink-3">
                  {o.medium} · {o.items} item{o.items === 1 ? '' : 's'} · {o.unfavorable} unfavorable
                </Txt>
              </View>
            </View>
          ))}
        </View>
        <Txt mono weight="medium" className="mb-1.5 mt-3 text-[10px] uppercase tracking-wide text-ink-3">
          Accounts, by engagement
        </Txt>
        <View style={{ gap: 6 }}>
          {tracker.accounts.map((a) => (
            <View key={a.name} className="flex-row items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
              <View className="min-w-0 flex-1">
                <Txt weight="semibold" className="text-[13px]" numberOfLines={1}>
                  {a.name}
                </Txt>
                <Txt variant="caption" className="text-ink-3">
                  {a.platform} · {a.posts} post{a.posts === 1 ? '' : 's'}
                </Txt>
              </View>
              <Txt mono weight="bold" className="text-[12px] text-ink">
                {a.engagement}
              </Txt>
            </View>
          ))}
        </View>
      </CanvasSection>

      {/* Response log */}
      <CanvasSection kicker="Response log">
        <View style={{ gap: 8 }}>
          {tracker.log.map((e) => {
            const toneColor =
              e.tone === 'bad'
                ? sentiment.negative
                : e.tone === 'us'
                  ? sentiment.positive
                  : e.tone === 'alert'
                    ? colors.link
                    : colors.ink3;
            return (
              <View key={e.key} className="rounded-lg border border-border bg-surface px-3 py-2">
                <View className="flex-row items-center justify-between">
                  <Txt mono weight="medium" className="text-[9px] uppercase tracking-wide" style={{ color: toneColor }}>
                    {e.kind}
                  </Txt>
                  <Txt mono className="text-[10px] text-ink-3">
                    {e.when}
                  </Txt>
                </View>
                <Txt variant="body" className="mt-0.5 text-ink-2">
                  {e.detail}
                </Txt>
              </View>
            );
          })}
        </View>
      </CanvasSection>
    </ScrollView>
  );
}

// The pushed crisis-tracker detail (web: ReportTracker + ReportTrackerSections, leaned for
// the phone). Reads the tracker from the already-cached decision edition.
export function TrackerDetailView({ trackerId }: { trackerId: string }) {
  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const { data: edition, isLoading } = useDecisionEdition(newsletterId, 'weekly');
  const tracker = edition?.trackers.find((t) => t.id === trackerId) ?? null;

  if (isLoading) {
    return (
      <Screen>
        <BackHeader title="Crisis tracker" />
        <View className="gap-3 px-4 pt-2">
          <Skeleton className="h-16 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </View>
      </Screen>
    );
  }

  if (!tracker) {
    return (
      <Screen>
        <BackHeader title="Crisis tracker" />
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState title="Tracker not found" hint="This crisis tracker is no longer open." />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackHeader title={tracker.storyTitle} />
      <TrackerBody tracker={tracker} />
    </Screen>
  );
}
