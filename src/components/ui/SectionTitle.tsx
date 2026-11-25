import { View } from 'react-native';
import { Txt } from './Txt';

// Data-source chip — mirrors the web's OriginChip (Media Meter = press/broadcast,
// Scoup = social). Exact web colors (--color-origin-*).
type Origin = 'mm' | 'sc';
const ORIGIN: Record<Origin, { label: string; bg: string; fg: string }> = {
  mm: { label: 'Media Meter', bg: '#e2f5f1', fg: '#0f6e63' },
  sc: { label: 'Scoup', bg: '#fff1c2', fg: '#7a4e00' },
};

export function OriginChip({ origin }: { origin: Origin }) {
  const o = ORIGIN[origin];
  return (
    <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: o.bg }}>
      <Txt mono weight="semibold" className="text-[9px] uppercase tracking-wide" style={{ color: o.fg }}>
        {o.label}
      </Txt>
    </View>
  );
}

// A section header: bold title + optional data-source chip, matching the web's
// AsideTile header row.
export function SectionTitle({ title, origin }: { title: string; origin?: Origin }) {
  return (
    <View className="flex-row items-center gap-2">
      <Txt weight="bold" className="text-[14px]">
        {title}
      </Txt>
      {origin && <OriginChip origin={origin} />}
    </View>
  );
}
