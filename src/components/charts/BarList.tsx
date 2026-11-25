import { View } from 'react-native';
import { Txt } from '../ui/Txt';

export interface BarItem {
  label: string;
  value: number;
}

export function BarList({
  items,
  format,
  colorFor,
  // Width of the value cell. Widen it (e.g. 'w-[84px]') for formats like
  // 'PHP 33.8M' so the value stays on one line; defaults to the social-count width.
  valueWidth = 'w-16',
}: {
  items: BarItem[];
  format: (v: number) => string;
  colorFor?: (label: string) => string;
  valueWidth?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <View className="gap-2.5">
      {items.map((it) => (
        <View key={it.label} className="flex-row items-center">
          <Txt className="w-24 text-[13px] text-ink-2" numberOfLines={1}>
            {it.label}
          </Txt>
          <View className="mx-2 h-2.5 flex-1 overflow-hidden rounded-full bg-surface3">
            <View
              className="h-full rounded-full"
              style={{
                width: `${(it.value / max) * 100}%`,
                backgroundColor: colorFor ? colorFor(it.label) : '#121212',
              }}
            />
          </View>
          <Txt mono weight="medium" numberOfLines={1} className={`${valueWidth} text-right text-[12px] text-ink`}>
            {format(it.value)}
          </Txt>
        </View>
      ))}
    </View>
  );
}
