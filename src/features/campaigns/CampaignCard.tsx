import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconTrash } from '@/components/navIcons';
import { Card, Divider } from '@/components/ui/Card';
import { Txt } from '@/components/ui/Txt';
import { GoalSquare } from './detail/StatusBits';
import { formatCampaignDay, formatCampaignShortDay, isAllEarly } from './phase';
import { colors } from '@/theme/tokens';
import type { ICampaignGoalSummary, ICampaignSummary } from '@/types';

// brand · launch 16 Oct 2026 · against realme
const metaLine = (c: ICampaignSummary): string =>
  [
    c.brand,
    c.launch ? `launch ${formatCampaignDay(c.launch)}` : 'no launch date',
    c.competitor ? `against ${c.competitor}` : '',
  ]
    .filter(Boolean)
    .join('  ·  ');

// The phase badge, top-right — green when live, muted otherwise (web: tone success/muted).
function PhaseBadge({ phase }: { phase: ICampaignSummary['phase'] }) {
  const live = phase.phase === 'live';
  return (
    <View
      className="shrink-0 rounded-full px-2.5 py-1"
      style={{ backgroundColor: live ? '#e4f2ea' : colors.surface3 }}>
      <Txt weight="semibold" className="text-[11px]" style={{ color: live ? '#127a53' : colors.ink3 }}>
        {phase.big}
      </Txt>
    </View>
  );
}

// The goal-health strip — equal columns so up to 7 goals fit a phone without squishing.
function GoalHealthStrip({ goals }: { goals: ICampaignGoalSummary[] }) {
  return (
    <View className="mt-2.5 flex-row" style={{ gap: 6 }}>
      {goals.map((g) => (
        <View key={g.id} className="flex-1 items-center">
          <GoalSquare st={g.st} />
          <Txt numberOfLines={2} className="mt-1 text-center text-[9px] leading-[11px] text-ink-3">
            {g.short}
          </Txt>
        </View>
      ))}
    </View>
  );
}

// A small footer status pill: an outline "Locked …" or an amber "Brief not locked".
function FootBadge({ tone, children }: { tone: 'outline' | 'warning'; children: string }) {
  const warning = tone === 'warning';
  return (
    <View
      className="rounded-full px-2 py-0.5"
      style={warning ? { backgroundColor: '#fbeccb' } : { borderWidth: 1, borderColor: colors.border }}>
      <Txt weight="semibold" className="text-[11px]" style={{ color: warning ? '#8a5a00' : colors.ink3 }}>
        {children}
      </Txt>
    </View>
  );
}

// An evaluation card (web: EvaluationCard). Once a campaign has figures it shows the goal
// scorecard — "On track on X of Y goals" + the health strip; before then, the phase line.
export function CampaignCard({
  campaign,
  onDelete,
}: {
  campaign: ICampaignSummary;
  onDelete?: () => void;
}) {
  const router = useRouter();
  const goals = campaign.goals;
  const onTrack = goals?.filter((g) => g.st === 'good').length ?? 0;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: campaign.id } })}
      className="active:opacity-90">
      <Card className="gap-0">
        <View className="flex-row items-start gap-2">
          <Txt weight="bold" numberOfLines={2} className="flex-1 text-[15px] leading-[20px]">
            {campaign.name}
          </Txt>
          <View className="flex-row items-center gap-1.5">
            <PhaseBadge phase={campaign.phase} />
            {onDelete && (
              <Pressable
                onPress={onDelete}
                hitSlop={8}
                accessibilityLabel={`Delete ${campaign.name}`}
                className="p-0.5">
                <IconTrash size={16} color={colors.ink3} />
              </Pressable>
            )}
          </View>
        </View>

        <View className="mt-1.5 flex-row items-center" style={{ gap: 6 }}>
          {campaign.example && (
            <View className="rounded-full px-1.5 py-px" style={{ backgroundColor: '#e7effa' }}>
              <Txt weight="semibold" className="text-[10px]" style={{ color: colors.link }}>
                Sample
              </Txt>
            </View>
          )}
          <Txt numberOfLines={1} className="flex-1 text-[12px] text-ink-3">
            {metaLine(campaign)}
          </Txt>
        </View>

        {goals ? (
          <>
            <Txt weight="semibold" className="mt-2.5 text-[13px] text-ink">
              {isAllEarly(goals)
                ? `Too early to call on all ${goals.length} goals, `
                : `On track on ${onTrack} of ${goals.length} goals, `}
              {campaign.left ?? 0} {campaign.left === 1 ? 'day' : 'days'} left.
            </Txt>
            <GoalHealthStrip goals={goals} />
          </>
        ) : (
          <Txt weight="semibold" className="mt-2.5 text-[13px] leading-[19px] text-ink">
            {campaign.phase.sub}
          </Txt>
        )}

        <Divider className="mt-3 mb-2.5" />
        <View className="flex-row items-center">
          {campaign.locked_at ? (
            <FootBadge tone="outline">{`Locked ${formatCampaignShortDay(campaign.locked_at)}`}</FootBadge>
          ) : (
            <FootBadge tone="warning">Brief not locked</FootBadge>
          )}
          <Txt weight="semibold" className="ml-auto text-[12px]" style={{ color: colors.link }}>
            Open ›
          </Txt>
        </View>
      </Card>
    </Pressable>
  );
}
