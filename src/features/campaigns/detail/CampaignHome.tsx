import { Pressable, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Txt } from '@/components/ui/Txt';
import type { ICampaignDetail } from '@/types';
import { GoalSquare, MoveChip } from './StatusBits';

function CardLabel({ children }: { children: string }) {
  return (
    <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-3">
      {children}
    </Txt>
  );
}

// The Home / weekly-answer view: are we on track, what to decide, what moved since
// Monday, and the story so far — plus a "this week at a glance" table. Mirrors the web's
// CampaignHomePage cards. Tapping a goal opens its detail.
export function CampaignHome({
  detail,
  onOpenGoal,
}: {
  detail: ICampaignDetail;
  onOpenGoal: (goalId: string) => void;
}) {
  const home = detail.home;
  if (!home) return null;

  const onTrackLine = detail.tooEarly
    ? `Too early to call on all ${detail.goalTotal} goals`
    : `On track on ${detail.onTrackCount} of ${detail.goalTotal} goals`;

  return (
    <View className="gap-3.5">
      {/* Are we on track? */}
      <Card className="gap-0">
        <CardLabel>Are we on track?</CardLabel>
        <Txt weight="bold" className="mt-1 text-[18px] leading-[24px]">
          {onTrackLine}
        </Txt>
        <View className="mt-3 flex-row flex-wrap" style={{ gap: 10 }}>
          {detail.goalSummaries.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => onOpenGoal(g.id)}
              className="items-center active:opacity-70"
              style={{ width: 92 }}>
              <GoalSquare st={g.st} />
              <Txt numberOfLines={2} className="mt-1 text-center text-[10px] leading-[12px] text-ink-3">
                {g.short}
              </Txt>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Decide this week */}
      <Card className="gap-0">
        <CardLabel>Decide this week</CardLabel>
        <Txt className="mt-1.5 text-[14px] leading-[20px] text-ink">{home.decide}</Txt>
      </Card>

      {/* Since Monday */}
      <Card className="gap-0">
        <CardLabel>What changed since Monday</CardLabel>
        <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
          {home.since.map((chip) => (
            <MoveChip key={chip.text} chip={chip} />
          ))}
        </View>
        {home.chain && (
          <Txt className="mt-2.5 text-[13px] leading-[19px] text-ink-2">{home.chain}</Txt>
        )}
      </Card>

      {/* The story so far */}
      <Card className="gap-0">
        <CardLabel>The story so far</CardLabel>
        <Txt className="mt-1.5 text-[14px] leading-[20px] text-ink">{home.story}</Txt>
      </Card>

      {/* This week at a glance */}
      <Card className="gap-0">
        <CardLabel>This week at a glance</CardLabel>
        <View className="mt-2.5">
          <View className="flex-row border-b border-border pb-1.5">
            <Txt mono className="flex-1 text-[10px] uppercase tracking-wide text-ink-3">Goal</Txt>
            <Txt mono className="w-14 text-right text-[10px] uppercase tracking-wide text-ink-3">Now</Txt>
            <Txt mono className="w-16 text-right text-[10px] uppercase tracking-wide text-ink-3">Since</Txt>
          </View>
          {home.glance.map((row) => (
            <View key={row.short} className="flex-row items-center border-b border-border py-2">
              <View className="mr-2">
                <GoalSquare st={row.st} size={18} />
              </View>
              <Txt numberOfLines={1} className="flex-1 text-[12px] text-ink-2">{row.short}</Txt>
              <Txt mono weight="medium" className="w-14 text-right text-[12px] text-ink">{row.now}</Txt>
              <Txt mono className="w-16 text-right text-[12px] text-ink-3">{row.since}</Txt>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
