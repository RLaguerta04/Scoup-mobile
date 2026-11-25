import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { HourByHour } from '@/components/charts/HourByHour';
import { SegmentedControl } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { colors, sentiment } from '@/theme/tokens';
import { VerdictBadge } from '../badges';
import { compactNum, TREND_GLYPH } from '../verdict';
import type { IDecisionStory, IStoryHourlyDay, ReportVerdict } from '@/types';

const ACROSS_VIEWS: { value: 'map' | 'timeline'; label: string }[] = [
  { value: 'map', label: 'Map' },
  { value: 'timeline', label: 'Timeline' },
];

// Bubble style by verdict (web: act solid / watch tinted / skip outline).
const BUBBLE: Record<ReportVerdict, { fill: string; border: string; text: string; dashed: boolean }> = {
  act: { fill: sentiment.negative, border: sentiment.negative, text: '#ffffff', dashed: false },
  watch: { fill: '#fdefd4', border: '#e3b23c', text: colors.ink, dashed: false },
  skip: { fill: colors.surface, border: colors.ink3, text: colors.ink2, dashed: true },
};

function CornerLabel({ text, pos }: { text: string; pos: object }) {
  return (
    <Txt mono className="absolute text-[8px] leading-[11px] text-ink-3" style={pos}>
      {text}
    </Txt>
  );
}

// The Story-size (y) × Risk (x) quadrant. Absolute px positioning (not %) so it lands the
// same on web and native Fabric.
function Quadrant({ stories }: { stories: IDecisionStory[] }) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 32, 360);
  const maxEng = Math.max(...stories.map((s) => s.weightedEngagement), 1);
  const rOf = (eng: number) => 12 + (eng / maxEng) * 13;
  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <View className="absolute rounded-xl border border-border bg-surface" style={{ left: 0, top: 0, width: size, height: size }} />
      {/* risk shading on the right half */}
      <View className="absolute rounded-r-xl" style={{ left: size / 2, top: 0, width: size / 2, height: size, backgroundColor: 'rgba(227,73,72,0.04)' }} />
      {/* center gridlines */}
      <View style={{ position: 'absolute', left: size / 2, top: 0, width: 1, height: size, backgroundColor: colors.border }} />
      <View style={{ position: 'absolute', top: size / 2, left: 0, width: size, height: 1, backgroundColor: colors.border }} />
      <CornerLabel text={'BIG · LOW RISK\nUSE OR HOLD'} pos={{ left: 8, top: 8 }} />
      <CornerLabel text={'BIG · RISKY\nACT'} pos={{ right: 8, top: 8, textAlign: 'right' }} />
      <CornerLabel text={'SMALL · CALM\nSKIP'} pos={{ left: 8, bottom: 8 }} />
      <CornerLabel text={'SMALL · RISKY\nWATCH'} pos={{ right: 8, bottom: 8, textAlign: 'right' }} />
      {stories.map((s) => {
        const r = rOf(s.weightedEngagement);
        const cx = (s.risk / 100) * size;
        const cy = ((100 - s.storySize) / 100) * size;
        const b = BUBBLE[s.verdict];
        return (
          <View key={s.id} style={{ position: 'absolute', left: cx - r, top: cy - r }}>
            {s.trend === 'Rising' && (
              <View
                style={{
                  position: 'absolute',
                  left: -4,
                  top: -4,
                  width: (r + 4) * 2,
                  height: (r + 4) * 2,
                  borderRadius: r + 4,
                  borderWidth: 1,
                  borderColor: b.border,
                  borderStyle: 'dashed',
                  opacity: 0.6,
                }}
              />
            )}
            <View
              style={{
                width: r * 2,
                height: r * 2,
                borderRadius: r,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: b.fill,
                borderWidth: 1,
                borderColor: b.border,
                borderStyle: b.dashed ? 'dashed' : 'solid',
              }}>
              <Txt mono weight="bold" className="text-[11px]" style={{ color: b.text }}>{s.rank}</Txt>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const COLS: { key: keyof IDecisionStory | 'dir' | 'eng'; label: string; w: number }[] = [
  { key: 'priority', label: 'Pri', w: 40 },
  { key: 'storySize', label: 'Size', w: 42 },
  { key: 'risk', label: 'Risk', w: 42 },
  { key: 'momentum', label: 'Mom', w: 44 },
  { key: 'eng', label: 'Eng', w: 52 },
  { key: 'dir', label: 'Dir', w: 72 },
];

function Cell({ w, children, mono, bold }: { w: number; children: React.ReactNode; mono?: boolean; bold?: boolean }) {
  return (
    <Txt mono={mono} weight={bold ? 'bold' : 'regular'} numberOfLines={1} className="text-right text-[12px] text-ink-2" style={{ width: w }}>
      {children}
    </Txt>
  );
}

// "Across all stories" — a Map (impact×risk quadrant + metrics) / Timeline (the week, hour by
// hour) pair, toggled like the web (web: ReportStoryMap + ReportTimeline).
export function AcrossTab({
  stories,
  timeline,
}: {
  stories: IDecisionStory[];
  timeline: IStoryHourlyDay[];
}) {
  const [view, setView] = useState<'map' | 'timeline'>('map');
  return (
    <View>
      <View className="mb-4">
        <SegmentedControl options={ACROSS_VIEWS} value={view} onChange={setView} />
      </View>

      {view === 'map' ? (
        <>
          <Txt variant="body" className="text-ink-3">
            Where each story sits on the two things that decide priority.
          </Txt>

          <View className="mt-4">
            <Quadrant stories={stories} />
            <Txt mono className="mt-2 text-center text-[10px] uppercase tracking-wider text-ink-3">
              Risk → (x) · Story size → (y)
            </Txt>
            <Txt variant="caption" className="mt-1 text-center text-ink-3">
              act solid · watch tinted · skip outline · dashed ring = rising · size = engagement
            </Txt>
          </View>

          {/* Metrics table (horizontal scroll) */}
          <View className="mt-5">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* header */}
                <View className="flex-row items-center border-b border-border pb-2" style={{ gap: 8 }}>
                  <Txt mono className="text-[10px] uppercase tracking-wider text-ink-3" style={{ width: 150 }}>Story</Txt>
                  {COLS.map((c) => (
                    <Txt key={c.label} mono className="text-right text-[10px] uppercase tracking-wider text-ink-3" style={{ width: c.w }}>
                      {c.label}
                    </Txt>
                  ))}
                </View>
                {/* rows */}
                {stories.map((s) => (
                  <View key={s.id} className="flex-row items-center border-b border-border py-2.5" style={{ gap: 8 }}>
                    <View className="flex-row items-center" style={{ width: 150, gap: 6 }}>
                      <Txt mono weight="bold" className="text-[11px] text-ink-3">{s.rank}</Txt>
                      <VerdictBadge verdict={s.verdict} />
                      <Txt weight="semibold" numberOfLines={1} className="flex-1 text-[12px]">{s.title}</Txt>
                    </View>
                    <Cell w={40} mono bold>{s.priority}</Cell>
                    <Cell w={42} mono>{s.storySize}</Cell>
                    <Cell w={42} mono>{s.risk}</Cell>
                    <Cell w={44} mono>{s.momentum}</Cell>
                    <Cell w={52} mono>{compactNum(s.weightedEngagement)}</Cell>
                    <Cell w={72}>{TREND_GLYPH[s.trend]} {s.trend}</Cell>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </>
      ) : (
        <>
          <Txt variant="body" className="text-ink-3">
            The whole period, hour by hour — when the coverage and conversation happened.
          </Txt>
          <View className="mt-4">
            <HourByHour days={timeline} />
          </View>
        </>
      )}
    </View>
  );
}
