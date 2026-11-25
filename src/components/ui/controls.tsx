import { Pressable, View } from 'react-native';
import { Txt } from './Txt';

export interface SegOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-full bg-surface3 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={`flex-1 flex-row items-center justify-center rounded-full py-2 ${active ? 'bg-surface' : ''}`}>
            <Txt
              numberOfLines={1}
              weight={active ? 'semibold' : 'medium'}
              className={`text-[13px] ${active ? 'text-ink' : 'text-ink-3'}`}>
              {o.label}
            </Txt>
            {o.count != null && (
              <Txt mono weight="medium" className={`ml-1.5 text-[11px] ${active ? 'text-ink-3' : 'text-ink-3'}`}>
                {o.count}
              </Txt>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// Level 1 — primary view tabs (Daily Feed / Dashboard / Decision Report).
// Underlined text tabs: the top of the hierarchy, visually distinct from the
// L2 segmented pill and the L3 lens toggle.
export function UnderlineTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} className="mr-5">
            <Txt
              weight={active ? 'bold' : 'medium'}
              className={`pb-2 text-[15px] ${active ? 'text-ink' : 'text-ink-3'}`}>
              {o.label}
            </Txt>
            <View className={`h-0.5 rounded-full ${active ? 'bg-ink' : 'bg-transparent'}`} />
          </Pressable>
        );
      })}
    </View>
  );
}

// Level 3 — content source filter (All / MediaWatch / SharedView). The lightest
// control in the hierarchy: a text toggle where the active source gets a soft
// pill background (no track, unlike the L2 segmented control).
export function LensToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row items-center gap-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            hitSlop={6}
            className={`rounded-full px-3 py-1 ${active ? 'bg-surface3' : ''}`}>
            <Txt
              weight={active ? 'semibold' : 'medium'}
              className={`text-[13px] ${active ? 'text-ink' : 'text-ink-3'}`}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${active ? 'border-ink bg-ink' : 'border-border bg-surface'}`}>
      <Txt weight="medium" className={`text-[12px] ${active ? 'text-white' : 'text-ink-2'}`}>
        {label}
      </Txt>
    </Pressable>
  );
}

export type PillTone = 'default' | 'positive' | 'negative' | 'neutral' | 'brand' | 'info';
const PILL: Record<PillTone, string> = {
  default: 'bg-surface3 text-ink-2',
  positive: 'bg-[#e4f0ea] text-[#0a7a52]',
  negative: 'bg-[#fbe6dc] text-[#b24a14]',
  neutral: 'bg-surface3 text-ink-3',
  brand: 'bg-[#fdefd4] text-[#9a6413]',
  info: 'bg-[#e3edf9] text-[#2f5b96]',
};

export function Pill({ label, tone = 'default' }: { label: string; tone?: PillTone }) {
  const [bg, text] = PILL[tone].split(' ');
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${bg}`}>
      <Txt mono weight="medium" className={`text-[10px] uppercase tracking-wide ${text}`}>
        {label}
      </Txt>
    </View>
  );
}
