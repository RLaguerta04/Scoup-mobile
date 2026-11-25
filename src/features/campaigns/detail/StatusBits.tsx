import { IconArrowDownRight, IconArrowUpRight, IconMinus } from '@tabler/icons-react-native';
import { View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { colors, scoupYellow } from '@/theme/tokens';
import type { GoalStatus, ICampaignBar, ICampaignMoveChip } from '@/types';
import { GOAL_STATUS } from '../goalStatus';

// A goal's status square — the filled/dashed icon chip used across Home + Goals.
export function GoalSquare({ st, size = 28 }: { st: GoalStatus; size?: number }) {
  const s = GOAL_STATUS[st];
  const { Icon } = s;
  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        backgroundColor: s.fill,
        ...(s.dashed ? { borderWidth: 1, borderStyle: 'dashed', borderColor: s.border } : null),
      }}>
      <Icon size={Math.round(size * 0.57)} color={s.glyph} />
    </View>
  );
}

const CHIP_TONE: Record<GoalStatus, { bg: string; fg: string }> = {
  good: { bg: '#e4f2ea', fg: '#127a53' },
  warn: { bg: '#fdeccb', fg: '#8a5a00' },
  bad: { bg: '#fbe6e0', fg: '#b24a14' },
  early: { bg: colors.surface3, fg: colors.ink3 },
};

// The status pill with its word ("On track" / "At risk" / …).
export function StatusChip({ st }: { st: GoalStatus }) {
  const s = GOAL_STATUS[st];
  const { Icon } = s;
  const t = CHIP_TONE[st];
  return (
    <View
      className="flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: t.bg }}>
      <Icon size={13} color={t.fg} />
      <Txt weight="semibold" className="text-[11px]" style={{ color: t.fg }}>
        {s.word}
      </Txt>
    </View>
  );
}

const MOVE_TONE = {
  up: { color: '#127a53', Icon: IconArrowUpRight },
  down: { color: '#b24a14', Icon: IconArrowDownRight },
  flat: { color: colors.ink3, Icon: IconMinus },
} as const;

// A "what changed since Monday" movement chip (↑ green / ↓ amber / – grey).
export function MoveChip({ chip }: { chip: ICampaignMoveChip }) {
  const t = MOVE_TONE[chip.dir];
  const { Icon } = t;
  return (
    <View className="flex-row items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1">
      <Icon size={13} color={t.color} />
      <Txt weight="medium" className="text-[12px]" style={{ color: colors.ink2 }}>
        {chip.text}
      </Txt>
    </View>
  );
}

// A goal's figures as simple horizontal bars, with the brief target as a yellow mark line.
export function GoalBars({
  bars,
  max,
  unit,
}: {
  bars: ICampaignBar[];
  max: number;
  unit: string;
}) {
  if (bars.length === 0) return null;
  return (
    <View className="mt-3.5 gap-2.5">
      {bars.map((b) => {
        const pct = Math.max(0, Math.min(1, b.value / max));
        const markPct = b.mark != null ? Math.max(0, Math.min(1, b.mark / max)) : null;
        return (
          <View key={b.label}>
            <View className="flex-row items-center justify-between">
              <Txt className="text-[12px] text-ink-2">{b.label}</Txt>
              <Txt mono weight="medium" className="text-[12px] text-ink">
                {b.value}
                {unit}
              </Txt>
            </View>
            <View className="mt-1 h-2.5 rounded-full bg-surface3" style={{ position: 'relative' }}>
              <View
                style={{
                  width: `${pct * 100}%`,
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: b.highlight ? colors.ink : colors.ink3,
                }}
              />
              {markPct != null && (
                <View
                  style={{
                    position: 'absolute',
                    left: `${markPct * 100}%`,
                    top: -2,
                    bottom: -2,
                    width: 2,
                    backgroundColor: scoupYellow,
                  }}
                />
              )}
            </View>
          </View>
        );
      })}
      {bars.some((b) => b.mark != null) && (
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <View style={{ width: 10, height: 2, backgroundColor: scoupYellow }} />
          <Txt className="text-[11px] text-ink-3">Target</Txt>
        </View>
      )}
    </View>
  );
}
