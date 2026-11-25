import { Pressable, View } from 'react-native';
import { IconChevronRight } from '@/components/navIcons';
import { Card } from '@/components/ui/Card';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { ICampaignGoalDetail } from '@/types';
import { GoalBars, StatusChip } from './StatusBits';

// Forecast colour by chance of ending Met (web thresholds: ≥70 on track, <30 off track).
const forecastTone = (chance: number): string =>
  chance >= 70 ? '#127a53' : chance < 30 ? '#b24a14' : '#8a5a00';

// One goal's detail: the headline number (opens its evidence), the read, its figures, the
// "to hit the target" note, and the forecast. Mirrors the web's CampaignGoalPage.
export function GoalDetailView({
  goal,
  onOpenEvidence,
}: {
  goal: ICampaignGoalDetail;
  onOpenEvidence: () => void;
}) {
  const early = goal.st === 'early';
  return (
    <View className="gap-3.5">
      {/* Headline number — opens its evidence */}
      <Card className="gap-0">
        <Txt className="text-[12px] text-ink-3">{goal.name}</Txt>
        <Pressable onPress={onOpenEvidence} className="mt-1 self-start active:opacity-70">
          <Txt weight="bold" className="text-[40px] leading-[46px]">
            {goal.big}
          </Txt>
          <View className="flex-row items-center">
            <Txt weight="semibold" className="text-[12px]" style={{ color: colors.link }}>
              Open the evidence
            </Txt>
            <IconChevronRight size={14} color={colors.link} />
          </View>
        </Pressable>
        <View className="mt-2.5">
          <StatusChip st={goal.st} />
        </View>
        <Txt className="mt-2.5 text-[14px] leading-[21px] text-ink">{goal.reading}</Txt>
        <GoalBars bars={goal.bars} max={goal.barMax} unit={goal.barUnit} />
      </Card>

      {/* To hit the target */}
      <Card className="gap-0">
        <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-3">
          To hit the target
        </Txt>
        <Txt className="mt-1.5 text-[14px] leading-[21px] text-ink">{goal.target}</Txt>
      </Card>

      {/* Forecast */}
      <Card className="gap-0">
        <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-3">
          Status, as a forecast
        </Txt>
        {early ? (
          <Txt weight="semibold" className="mt-1.5 text-[15px] text-ink-2">
            Too early to call.
          </Txt>
        ) : (
          <View className="mt-2 flex-row items-end gap-3">
            <View>
              <Txt weight="bold" className="text-[28px] leading-[32px]" style={{ color: forecastTone(goal.chanceMet) }}>
                {goal.chanceMet}%
              </Txt>
              <Txt className="text-[11px] text-ink-3">chance of ending Met</Txt>
            </View>
            <View className="flex-1">
              <Txt className="text-[12px] text-ink-2">
                Likely finish <Txt weight="semibold" className="text-[12px] text-ink">{goal.forecastBand}</Txt>
              </Txt>
              <Txt className="mt-0.5 text-[12px] text-ink-3">{goal.forecastNote}</Txt>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}
