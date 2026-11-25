import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { IconChevronLeft, IconChevronRight } from '@/components/navIcons';
import { Txt } from './Txt';
import { colors } from '@/theme/tokens';

// Lightweight month calendar with range selection, built from plain RN views (no
// external calendar dependency). Dates are 'yyyy-MM-dd' strings compared lexically.
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function MonthCalendar({
  start,
  end,
  onSelect,
  maxDate,
}: {
  start: string | null;
  end: string | null;
  onSelect: (day: string) => void;
  maxDate?: string;
}) {
  const base = end ?? start ?? maxDate ?? '2026-11-04';
  const bd = new Date(`${base}T00:00:00Z`);
  const [ym, setYm] = useState({ y: bd.getUTCFullYear(), m: bd.getUTCMonth() });

  const startWeekday = new Date(Date.UTC(ym.y, ym.m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array<null>(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => setYm((p) => (p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 }));
  const next = () => setYm((p) => (p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 }));

  const inRange = (ds: string) => (start && end ? ds >= start && ds <= end : ds === start);
  const isEndpoint = (ds: string) => ds === start || ds === end;

  return (
    <View>
      <View className="flex-row items-center justify-between px-1 py-2">
        <Pressable onPress={prev} hitSlop={8} className="p-1">
          <IconChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <Txt weight="bold" className="text-[15px]">
          {MONTHS[ym.m]} {ym.y}
        </Txt>
        <Pressable onPress={next} hitSlop={8} className="p-1">
          <IconChevronRight size={20} color={colors.ink} />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((w) => (
          <View key={w} className="flex-1 items-center py-1">
            <Txt mono className="text-[10px] text-ink-3">
              {w}
            </Txt>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((d, i) => {
          if (d === null) return <View key={`b${i}`} className="aspect-square" style={{ width: `${100 / 7}%` }} />;
          const ds = iso(ym.y, ym.m, d);
          const disabled = maxDate ? ds > maxDate : false;
          const endp = isEndpoint(ds);
          const mid = inRange(ds) && !endp;
          return (
            <View key={ds} className="aspect-square p-0.5" style={{ width: `${100 / 7}%` }}>
              <Pressable
                disabled={disabled}
                onPress={() => onSelect(ds)}
                className={`flex-1 items-center justify-center rounded-lg ${endp ? 'bg-ink' : mid ? 'bg-surface3' : ''}`}>
                <Txt
                  weight={endp ? 'bold' : 'regular'}
                  className="text-[13px]"
                  style={{ color: disabled ? '#cbc9c0' : endp ? '#ffffff' : colors.ink }}>
                  {d}
                </Txt>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
