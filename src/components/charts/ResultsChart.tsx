import { View } from 'react-native';
import { Txt } from '../ui/Txt';
import { withCommas } from '@/lib/format';
import { colors, heatFill, scoupYellow } from '@/theme/tokens';
import type { IHeatDay } from '@/types';

// Column widths for the hour heatmap (the 24 cells share the remaining space).
const DAY_W = 36;
const PRINT_W = 28;
const TOTAL_W = 36;
const HOUR_LABELS = ['12a', '6a', '12p', '6p'];

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const [HR, HG, HB] = hexToRgb(heatFill);

// Same curve as the web (heatIntensity): a sqrt ramp so low counts stay visible.
const cellColor = (count: number, max: number): string => {
  if (count === 0) return '#f0eee6';
  const opacity = 0.12 + Math.sqrt(count / max) * 0.88;
  return `rgba(${HR},${HG},${HB},${opacity})`;
};

export function ResultsChart({ heat, mode }: { heat: IHeatDay[]; mode: 'day' | 'hour' }) {
  if (mode === 'day') {
    const max = Math.max(...heat.map((d) => d.total), 1);
    const peak = heat.reduce((best, d) => (d.total > best.total ? d : best), heat[0]);
    return (
      <View className="h-40 flex-row justify-between gap-1.5">
        {heat.map((d) => {
          const isPeak = d.date === peak?.date;
          return (
            <View key={d.date} className="h-full flex-1 items-center">
              <Txt mono className="mb-1 text-[10px] text-ink-3">
                {d.total}
              </Txt>
              <View className="w-full flex-1 justify-end">
                <View
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.max((d.total / max) * 100, 3)}%`,
                    backgroundColor: isPeak ? colors.ink : scoupYellow,
                  }}
                />
              </View>
              <Txt className="mt-1 text-[10px] text-ink-3">{d.label.split(' ')[0]}</Txt>
            </View>
          );
        })}
      </View>
    );
  }

  // Hour heatmap — 24 columns + Print + Total, matching the web HeatGrid.
  const max = Math.max(1, ...heat.flatMap((d) => d.hours));
  return (
    <View>
      <View className="mb-1.5 flex-row items-center">
        <View style={{ width: DAY_W }} />
        <View className="flex-1 flex-row">
          {HOUR_LABELS.map((h) => (
            <Txt key={h} mono className="flex-1 text-[9px] text-ink-3">
              {h}
            </Txt>
          ))}
        </View>
        <Txt className="text-right text-[9px] text-ink-3" style={{ width: PRINT_W }}>
          Print
        </Txt>
        <Txt className="text-right text-[9px] text-ink-3" style={{ width: TOTAL_W }}>
          Total
        </Txt>
      </View>

      {heat.map((d) => (
        <View key={d.date} className="mb-0.5 flex-row items-center">
          <Txt className="text-[9px] text-ink-3" style={{ width: DAY_W }} numberOfLines={1}>
            {d.label}
          </Txt>
          <View className="flex-1 flex-row">
            {d.hours.map((count, hour) => (
              <View
                key={hour}
                style={{
                  flex: 1,
                  height: 14,
                  marginHorizontal: 0.5,
                  borderRadius: 2,
                  backgroundColor: cellColor(count, max),
                }}
              />
            ))}
          </View>
          <Txt mono className="text-right text-[10px] text-ink-3" style={{ width: PRINT_W }}>
            {d.print}
          </Txt>
          <Txt mono weight="semibold" className="text-right text-[10px] text-ink" style={{ width: TOTAL_W }}>
            {withCommas(d.total)}
          </Txt>
        </View>
      ))}
    </View>
  );
}
