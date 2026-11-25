import { Pressable, View } from 'react-native';
import { IconChevronRight } from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { GoalStatus, ICampaignDetail } from '@/types';
import { GoalSquare } from './StatusBits';

// Most-urgent-first ordering (web: off track → at risk → too early → on track).
const URGENCY: Record<GoalStatus, number> = { bad: 0, warn: 1, early: 2, good: 3 };

// The Goals list — every judged goal, most urgent first, each opening its detail.
export function CampaignGoals({
  detail,
  onOpenGoal,
}: {
  detail: ICampaignDetail;
  onOpenGoal: (goalId: string) => void;
}) {
  const goals = [...(detail.goals ?? [])].sort((a, b) => URGENCY[a.st] - URGENCY[b.st]);

  return (
    <View className="gap-3.5">
      <View>
        <Txt variant="title" className="text-[18px]">
          Goals
        </Txt>
        <Txt className="mt-0.5 text-[12px] text-ink-3">Most urgent first</Txt>
      </View>

      <View className="overflow-hidden rounded-card border border-border bg-surface">
        {goals.map((g, i) => (
          <Pressable
            key={g.id}
            onPress={() => onOpenGoal(g.id)}
            className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-surface2 ${i > 0 ? 'border-t border-border' : ''}`}>
            <GoalSquare st={g.st} />
            <View className="min-w-0 flex-1">
              <Txt weight="semibold" numberOfLines={1} className="text-[14px]">
                {g.short}
              </Txt>
              <Txt numberOfLines={2} className="mt-0.5 text-[12px] leading-[16px] text-ink-3">
                {g.line}
              </Txt>
            </View>
            <Txt mono weight="semibold" className="text-[14px] text-ink">
              {g.big}
            </Txt>
            <IconChevronRight size={16} color={colors.ink3} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
