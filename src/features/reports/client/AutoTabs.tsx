import { Pressable, View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { colors, sentiment } from '@/theme/tokens';
import type { DrillPayload } from './ClientReportDrillSheet';
import type { IAutoTabData } from '@/types';

const TONE = { pos: sentiment.positive, neu: colors.ink3, neg: sentiment.negative };
const TONE_LABEL = { pos: 'Positive', neu: 'Neutral', neg: 'Negative' };
const fmtPhp = (n: number) => `PHP ${(n / 1e6).toFixed(1)}M`;

function SubHead({ children }: { children: string }) {
  return <Txt className="mb-3 text-[13px] leading-[19px] text-ink-3">{children}</Txt>;
}

// PH-automotive deep tabs (web: components/auto/*). Overview reuses the shell's At-a-glance
// figures; this covers Brands, Nameplates, Stories, Head-to-head. The rest stay placeholders.
export function AutoTabs({
  data,
  tab,
  onDrill,
}: {
  data: IAutoTabData;
  tab: string;
  onDrill: (p: DrillPayload) => void;
}) {
  if (tab === 'brands') {
    const max = Math.max(...data.brands.map((b) => b.n), 1);
    return (
      <View>
        <SubHead>Brands ranked by share of voice. Tap a brand to see the coverage behind it.</SubHead>
        <View style={{ gap: 11 }}>
          {data.brands.map((b, i) => (
            <Pressable
              key={b.name}
              onPress={() => onDrill({ title: b.name, sub: `${b.n} articles · ${b.share}% share of voice · ${fmtPhp(b.ave)} AVE`, stories: data.stories })}
              accessibilityRole="button"
              className="active:opacity-70">
              <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                <View className="flex-row items-center" style={{ gap: 7 }}>
                  <Txt mono weight="bold" className="w-4 text-[11px] text-ink-3">{i + 1}</Txt>
                  <Txt weight="semibold" className="text-[13px]">{b.name}</Txt>
                </View>
                <View className="flex-row items-baseline" style={{ gap: 8 }}>
                  <Txt mono weight="bold" className="text-[13px] text-ink">{b.share}%</Txt>
                  <Txt mono className="w-8 text-right text-[11px] text-ink-3">{b.n}</Txt>
                </View>
              </View>
              <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface3">
                <View className="h-full rounded-full" style={{ width: `${(b.n / max) * 100}%`, backgroundColor: i === 0 ? colors.ink : colors.link }} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (tab === 'nameplates') {
    const max = Math.max(...data.nameplates.map((m) => m.n), 1);
    return (
      <View>
        <SubHead>The most-covered nameplates this month, across all brands.</SubHead>
        <View style={{ gap: 11 }}>
          {data.nameplates.map((m, i) => (
            <View key={`${m.brand}-${m.name}`}>
              <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                <View className="flex-row items-center" style={{ gap: 7 }}>
                  <Txt mono weight="bold" className="w-4 text-[11px] text-ink-3">{i + 1}</Txt>
                  <View>
                    <Txt weight="semibold" className="text-[13px]">{m.name}</Txt>
                    <Txt variant="caption" className="text-ink-3">{m.brand}</Txt>
                  </View>
                </View>
                <Txt mono weight="bold" className="text-[13px] text-ink">{m.n}</Txt>
              </View>
              <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface3">
                <View className="h-full rounded-full" style={{ width: `${(m.n / max) * 100}%`, backgroundColor: colors.link }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (tab === 'stories') {
    return (
      <View>
        <SubHead>The month’s most prominent automotive stories by AVE. Tap one to read the detail.</SubHead>
        <View>
          {data.stories.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => onDrill({ title: 'Top stories', stories: data.stories, focusId: s.id })}
              accessibilityRole="button"
              className="active:bg-surface2">
              <View className={`flex-row items-start py-3 ${i > 0 ? 'border-t border-border' : ''}`} style={{ gap: 10 }}>
                <View className="min-w-0 flex-1">
                  <Txt weight="semibold" numberOfLines={2} className="text-[13px] leading-[18px]">{s.title}</Txt>
                  <Txt variant="caption" className="mt-0.5 text-ink-3">{s.outlet} · {s.date}</Txt>
                </View>
                <View className="items-end">
                  <Txt mono weight="bold" className="text-[12px] text-ink">{fmtPhp(s.ave)}</Txt>
                  <Txt weight="semibold" className="mt-0.5 text-[10px]" style={{ color: TONE[s.tone] }}>{TONE_LABEL[s.tone]}</Txt>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (tab === 'h2h') {
    const { a, b, rows } = data.h2h;
    return (
      <View>
        <SubHead>The market leader against its fastest-rising challenger, side by side.</SubHead>
        <View className="rounded-xl border border-border bg-surface">
          {/* Header */}
          <View className="flex-row border-b border-border px-3 py-2.5">
            <View className="flex-1" />
            <Txt weight="bold" className="w-24 text-center text-[13px]">{a}</Txt>
            <Txt weight="bold" className="w-24 text-center text-[13px]">{b}</Txt>
          </View>
          {rows.map((r, i) => (
            <View key={r.label} className={`flex-row items-center px-3 py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}>
              <Txt className="flex-1 text-[12px] text-ink-3">{r.label}</Txt>
              <Txt
                mono
                weight={r.leader === 'a' ? 'bold' : 'medium'}
                className="w-24 text-center text-[13px]"
                style={{ color: r.leader === 'a' ? colors.link : colors.ink3 }}>
                {r.a}
              </Txt>
              <Txt
                mono
                weight={r.leader === 'b' ? 'bold' : 'medium'}
                className="w-24 text-center text-[13px]"
                style={{ color: r.leader === 'b' ? colors.link : colors.ink3 }}>
                {r.b}
              </Txt>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return null;
}
