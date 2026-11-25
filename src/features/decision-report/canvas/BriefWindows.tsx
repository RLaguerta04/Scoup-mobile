import { Pressable, View } from 'react-native';
import { Label, Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import { useDrill } from '../drill/DrillContext';
import type { BriefSeverity, IBriefWindow } from '@/types';

// Severity → the count-circle fill (web: SEVERITY_CLASS). quiet reads as a faint outline,
// then amber → orange → dark red as the window gets busier.
const SEV: Record<BriefSeverity, { fill: string; text: string; outline?: boolean }> = {
  quiet: { fill: colors.surface3, text: colors.ink3, outline: true },
  elevated: { fill: '#f6c667', text: '#6b4a06' },
  high: { fill: '#e8890c', text: '#ffffff' },
  critical: { fill: '#8a2a2a', text: '#ffffff' },
};
const LEGEND: BriefSeverity[] = ['quiet', 'elevated', 'high', 'critical'];

// The four six-hour windows of the brief's last day, each a count circle colored by
// severity (web: BriefWindows).
export function BriefWindows({ windows, dayLabel }: { windows: IBriefWindow[]; dayLabel: string }) {
  const drill = useDrill();
  return (
    <View>
      <Label>Brief windows · {dayLabel}</Label>
      <View className="mt-3 flex-row" style={{ gap: 10 }}>
        {windows.map((w) => {
          const sev = SEV[w.severity];
          return (
            <Pressable key={w.label} {...drill(`window:${w.label}`)} className="flex-1 items-center active:opacity-70">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{
                  backgroundColor: sev.fill,
                  borderWidth: sev.outline ? 1 : 0,
                  borderColor: colors.border,
                }}>
                <Txt mono weight="bold" className="text-[13px]" style={{ color: sev.text }}>
                  {w.count}
                </Txt>
              </View>
              <Txt className="mt-1.5 text-[11px] text-ink-3">{w.label}</Txt>
            </Pressable>
          );
        })}
      </View>
      <View className="mt-3 flex-row flex-wrap" style={{ gap: 12 }}>
        {LEGEND.map((s) => (
          <View key={s} className="flex-row items-center" style={{ gap: 4 }}>
            <View
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: SEV[s].fill,
                borderWidth: SEV[s].outline ? 1 : 0,
                borderColor: colors.border,
              }}
            />
            <Txt className="text-[10px] text-ink-3">{s}</Txt>
          </View>
        ))}
      </View>
    </View>
  );
}
