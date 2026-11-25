import { Pressable, View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { colors, sentiment } from '@/theme/tokens';
import type { ReportVerdict } from '@/types';

const ORDER: ReportVerdict[] = ['act', 'watch', 'skip'];
const META: Record<ReportVerdict, { label: string; color: string }> = {
  act: { label: 'ACT', color: sentiment.negative },
  watch: { label: 'WATCH', color: colors.brand },
  skip: { label: 'SKIP', color: colors.ink3 },
};

// The ACT / WATCH / SKIP tally (web: ReportBriefBar tally). Tapping one filters the
// ranked list to that verdict; tapping the active one clears the filter.
export function VerdictTally({
  counts,
  active,
  onToggle,
}: {
  counts: Record<ReportVerdict, number>;
  active: ReportVerdict | null;
  onToggle: (v: ReportVerdict) => void;
}) {
  return (
    <View className="flex-row" style={{ gap: 8 }}>
      {ORDER.map((v) => {
        const on = active === v;
        const m = META[v];
        return (
          <Pressable
            key={v}
            onPress={() => onToggle(v)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            className="flex-row items-center rounded-full border px-3 py-1.5"
            style={{
              gap: 6,
              borderColor: on ? m.color : colors.border,
              backgroundColor: on ? `${m.color}1a` : colors.surface,
            }}>
            <Txt weight="bold" className="text-[14px]" style={{ color: m.color }}>
              {counts[v]}
            </Txt>
            <Txt mono weight="medium" className="text-[10px] uppercase tracking-wider text-ink-3">
              {m.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
