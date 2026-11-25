import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { LensToggle } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { IReportCompareCard, IReportRankedItem } from '@/types';

// Reusable report chart primitives (web: components/charts/*). Built on react-native-svg so the
// EDCOM 2 tabs get the band/line/column charts the desktop uses, not just flat bars.

const GREY = '#bdbcb5';
const TEAL = colors.link;
const CHG = { up: '#0f7a52', down: '#c0492f', flat: colors.ink3 } as const;

// A chart card with a Chart ⇄ Table toggle (web: ChartCard). Shows `table` when toggled.
export function ChartCard({
  title,
  note,
  chart,
  table,
  initialView = 'chart',
}: {
  title?: string;
  note?: string;
  chart: ReactNode;
  table?: ReactNode;
  initialView?: 'chart' | 'table';
}) {
  const [view, setView] = useState<'chart' | 'table'>(initialView);
  return (
    <View className="rounded-xl border border-border bg-surface p-3">
      <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
        {title ? (
          <Txt weight="semibold" numberOfLines={2} className="flex-1 text-[13px] leading-[17px]">{title}</Txt>
        ) : (
          <View className="flex-1" />
        )}
        {table ? (
          <LensToggle
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
            value={view}
            onChange={setView}
          />
        ) : null}
      </View>
      <View className="mt-2.5">{view === 'table' && table ? table : chart}</View>
      {note ? <Txt className="mt-2 text-[11px] leading-[15px] text-ink-3">{note}</Txt> : null}
    </View>
  );
}

function Legend({ items }: { items: { color?: string; band?: boolean; label: string }[] }) {
  return (
    <View className="mt-1.5 flex-row flex-wrap" style={{ gap: 14 }}>
      {items.map((it) => (
        <View key={it.label} className="flex-row items-center" style={{ gap: 5 }}>
          {it.band ? (
            <View style={{ width: 12, height: 8, backgroundColor: TEAL, opacity: 0.14, borderRadius: 2 }} />
          ) : (
            <View style={{ width: 12, height: 2, backgroundColor: it.color, borderRadius: 1 }} />
          )}
          <Txt className="text-[11px] text-ink-3">{it.label}</Txt>
        </View>
      ))}
    </View>
  );
}

// Two-line chart with an optional usual-range band (web: LineBandChart). `labels` names the two
// lines (default 2025 / 2026; Credit uses DepEd / EDCOM 2).
export function ReportLineChart({
  rows,
  labels = { earlier: '2025', later: '2026' },
}: {
  rows: { month: string; earlier: number; later: number; lo?: number; hi?: number }[];
  labels?: { earlier: string; later: string };
}) {
  const W = 320;
  const H = 148;
  const padL = 6;
  const padR = 6;
  const padT = 10;
  const padB = 18;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const n = rows.length;
  const max = Math.max(...rows.flatMap((r) => [r.earlier, r.later, r.hi ?? 0]), 1) * 1.08;
  const x = (i: number) => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => padT + ih - (v / max) * ih;
  const path = (key: 'earlier' | 'later') =>
    rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`).join(' ');
  const hasBand = rows[0]?.lo != null;
  const band = hasBand
    ? rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(r.hi ?? 0).toFixed(1)}`).join(' ') +
      ' ' +
      [...rows].reverse().map((r, i) => `L${x(n - 1 - i).toFixed(1)},${y(r.lo ?? 0).toFixed(1)}`).join(' ') +
      ' Z'
    : null;
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {band ? <Path d={band} fill={TEAL} fillOpacity={0.09} /> : null}
        <Path d={path('earlier')} fill="none" stroke={GREY} strokeWidth={2} />
        <Path d={path('later')} fill="none" stroke={TEAL} strokeWidth={2} />
        {rows.map((r, i) => (
          <Circle key={i} cx={x(i)} cy={y(r.later)} r={2.4} fill={TEAL} />
        ))}
        {rows.map((r, i) =>
          i % 2 === 0 ? (
            <SvgText key={`x${i}`} x={x(i)} y={H - 5} fontSize={8} fill={colors.ink3} textAnchor="middle">
              {r.month}
            </SvgText>
          ) : null,
        )}
      </Svg>
      <Legend
        items={[
          { color: GREY, label: labels.earlier },
          { color: TEAL, label: labels.later },
          ...(hasBand ? [{ band: true, label: 'Usual range' }] : []),
        ]}
      />
    </View>
  );
}

// Per-row horizontal stacked bars (e.g. each month × categories) — web: StackedRows. Current row bold.
export function ReportStackedRows({
  rows,
  series,
}: {
  rows: { label: string; parts: number[]; isCurrent?: boolean }[];
  series: { label: string; color: string }[];
}) {
  return (
    <View>
      <Legend items={series.map((s) => ({ color: s.color, label: s.label }))} />
      <View className="mt-2.5" style={{ gap: 7 }}>
        {rows.map((r, ri) => (
          <View key={ri} className="flex-row items-center" style={{ gap: 8 }}>
            <Txt
              mono
              weight={r.isCurrent ? 'bold' : 'regular'}
              className={`text-[10px] ${r.isCurrent ? 'text-ink' : 'text-ink-3'}`}
              style={{ width: 34 }}>
              {r.label}
            </Txt>
            <View className="h-3.5 flex-1 flex-row overflow-hidden rounded-[3px]">
              {r.parts.map((v, si) => (
                <View key={si} style={{ flex: Math.max(v, 0.001), backgroundColor: series[si].color }} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// A tiny inline sparkline (line + previous-year ghost dot) for an issue's history.
export function Sparkline({ series, prevYear }: { series: number[]; prevYear?: number }) {
  const W = 72;
  const H = 18;
  const pad = 2;
  const n = series.length;
  const max = Math.max(...series, prevYear ?? 0, 1);
  const x = (i: number) => pad + (n <= 1 ? 0 : (i / (n - 1)) * (W - 2 * pad));
  const y = (v: number) => pad + (H - 2 * pad) - (v / max) * (H - 2 * pad);
  const d = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <Svg width={W} height={H}>
      <Path d={d} fill="none" stroke={TEAL} strokeWidth={1.3} />
      {prevYear != null ? <Circle cx={x(Math.max(0, n - 13))} cy={y(prevYear)} r={1.7} fill={GREY} /> : null}
      <Circle cx={x(n - 1)} cy={y(series[n - 1])} r={1.9} fill={TEAL} />
    </Svg>
  );
}

// Single-series column chart with the last column highlighted (web: ColumnChart).
export function ReportColumnChart({ months }: { months: { label: string; n: number }[] }) {
  const W = 320;
  const H = 128;
  const padL = 4;
  const padR = 4;
  const padT = 8;
  const padB = 18;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const n = months.length;
  const max = Math.max(...months.map((m) => m.n), 1);
  const slot = iw / n;
  const bw = slot * 0.62;
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {months.map((m, i) => {
        const h = Math.max(1, (m.n / max) * ih);
        const bx = padL + i * slot + (slot - bw) / 2;
        return <Rect key={i} x={bx} y={padT + ih - h} width={bw} height={h} rx={1.5} fill={i === n - 1 ? TEAL : '#c7d4ea'} />;
      })}
      {months.map((m, i) =>
        i % 2 === 0 || i === n - 1 ? (
          <SvgText key={`x${i}`} x={padL + i * slot + slot / 2} y={H - 5} fontSize={8} fill={colors.ink3} textAnchor="middle">
            {m.label}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
}

// Stacked column chart (e.g. day × channel), peak column at full opacity (web: ColumnChart stacked).
export function ReportStackedColumn({
  rows,
  series,
  peakIndex,
}: {
  rows: { label: string; parts: number[] }[];
  series: { label: string; color: string }[];
  peakIndex?: number;
}) {
  const W = 320;
  const H = 130;
  const padL = 4;
  const padR = 4;
  const padT = 8;
  const padB = 18;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const n = rows.length;
  const totals = rows.map((r) => r.parts.reduce((a, b) => a + b, 0));
  const max = Math.max(...totals, 1);
  const slot = iw / n;
  const bw = slot * 0.64;
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {rows.map((r, i) => {
          const bx = padL + i * slot + (slot - bw) / 2;
          let yTop = padT + ih;
          return r.parts.map((v, si) => {
            const h = (v / max) * ih;
            yTop -= h;
            return (
              <Rect
                key={`${i}-${si}`}
                x={bx}
                y={yTop}
                width={bw}
                height={Math.max(0, h)}
                fill={series[si].color}
                opacity={peakIndex != null && i !== peakIndex ? 0.8 : 1}
              />
            );
          });
        })}
        {rows.map((r, i) =>
          i % 2 === 0 || i === n - 1 ? (
            <SvgText key={`x${i}`} x={padL + i * slot + slot / 2} y={H - 5} fontSize={8} fill={colors.ink3} textAnchor="middle">
              {r.label.replace(/^\w+ /, '')}
            </SvgText>
          ) : null,
        )}
      </Svg>
      <Legend items={series.map((s) => ({ color: s.color, label: s.label }))} />
    </View>
  );
}

// A dot-timeline matrix — one dot per story per day it ran (web: Stories "when each story ran").
export function DotTimeline({ days, stories }: { days: string[]; stories: { title: string; days?: string[] }[] }) {
  return (
    <View>
      {stories.map((s, si) => (
        <View key={si} className="flex-row items-center py-1.5">
          <Txt numberOfLines={1} className="text-[11px] text-ink-2" style={{ width: 104 }}>{s.title}</Txt>
          <View className="flex-1 flex-row items-center" style={{ justifyContent: 'space-between', paddingHorizontal: 2 }}>
            {days.map((d) => {
              const on = s.days?.includes(d);
              return (
                <View
                  key={d}
                  className="rounded-full"
                  style={{ width: on ? 7 : 3, height: on ? 7 : 3, backgroundColor: on ? TEAL : colors.border }}
                />
              );
            })}
          </View>
        </View>
      ))}
      <View className="mt-1 flex-row items-center">
        <View style={{ width: 104 }} />
        <View className="flex-1 flex-row" style={{ justifyContent: 'space-between', paddingHorizontal: 2 }}>
          {days.map((d, i) => (
            <Txt key={d} className="text-[8px] text-ink-3" style={{ width: 10, textAlign: 'center' }}>
              {i % 2 === 0 ? d.replace(/^\w+ /, '') : ''}
            </Txt>
          ))}
        </View>
      </View>
    </View>
  );
}

// A "question" comparison card with 2–3 bars + an answer line (web: CompareBox).
export function CompareBox({ card }: { card: IReportCompareCard }) {
  const max = Math.max(...card.bars.map((b) => b.value), 1);
  return (
    <View className="rounded-xl border border-border bg-surface p-3">
      <Txt mono weight="medium" className="text-[9.5px] uppercase tracking-wide text-ink-3">{card.title}</Txt>
      <Txt className="mt-0.5 text-[12px] text-ink-3">{card.question}</Txt>
      <View className="mt-2.5" style={{ gap: 7 }}>
        {card.bars.map((b) => (
          <View key={b.label}>
            <View className="flex-row items-center justify-between">
              <Txt className="text-[12px] text-ink-2">{b.label}</Txt>
              <Txt mono weight="semibold" className="text-[12px] text-ink">{b.display}</Txt>
            </View>
            <View className="mt-1 h-2 overflow-hidden rounded-full bg-surface3">
              <View className="h-full rounded-full" style={{ width: `${(b.value / max) * 100}%`, backgroundColor: TEAL }} />
            </View>
          </View>
        ))}
      </View>
      <Txt weight="semibold" className="mt-2.5 text-[12px]" style={{ color: CHG[card.answerTone] }}>{card.answer}</Txt>
    </View>
  );
}

// Ranked bars with a previous-year ghost bar + a 12-month-average tick (web: RankedBars).
export function RankedBars({
  items,
  format,
  legend,
}: {
  items: IReportRankedItem[];
  format?: (n: number) => string;
  legend?: boolean;
}) {
  const max = Math.max(...items.map((i) => Math.max(i.value, i.prev ?? 0, i.tick ?? 0)), 1);
  return (
    <View>
      {legend ? (
        <Legend
          items={[
            { color: GREY, label: 'A year earlier' },
            { color: TEAL, label: 'This month' },
            { color: colors.ink, label: '12-mo avg' },
          ]}
        />
      ) : null}
      <View className={legend ? 'mt-2.5' : ''} style={{ gap: 12 }}>
        {items.map((it) => (
          <View key={it.label}>
            <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
              <Txt weight="medium" numberOfLines={1} className="flex-1 text-[13px]">{it.label}</Txt>
              <Txt mono weight="bold" className="text-[12px] text-ink">{format ? format(it.value) : it.value}</Txt>
              {it.change ? (
                <Txt mono weight="semibold" className="text-[11px]" style={{ color: CHG[it.changeTone ?? 'flat'] }}>{it.change}</Txt>
              ) : null}
            </View>
            <View className="mt-1.5" style={{ height: 10 }}>
              <View className="absolute inset-0 rounded-full" style={{ backgroundColor: colors.surface3 }} />
              {it.prev != null ? (
                <View className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${(it.prev / max) * 100}%`, backgroundColor: GREY, opacity: 0.6 }} />
              ) : null}
              <View className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, backgroundColor: TEAL }} />
              {it.tick != null ? (
                <View className="absolute" style={{ left: `${(it.tick / max) * 100}%`, top: -2, width: 2, height: 14, backgroundColor: colors.ink, borderRadius: 1 }} />
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// A horizontally-scrollable data table (web: SortableTable, minus the sort — a reference grid).
export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  const COL0 = 56;
  const COL = 92;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View className="flex-row border-b border-border pb-1.5">
          {columns.map((c, i) => (
            <Txt
              key={c}
              mono
              weight="medium"
              numberOfLines={2}
              className="text-[9px] uppercase tracking-wide text-ink-3"
              style={{ width: i === 0 ? COL0 : COL, paddingRight: 6 }}>
              {c}
            </Txt>
          ))}
        </View>
        {rows.map((r, ri) => (
          <View key={ri} className={`flex-row py-2 ${ri > 0 ? 'border-t border-border' : ''}`}>
            {r.map((cell, ci) => (
              <Txt
                key={ci}
                numberOfLines={1}
                weight={ci === 0 ? 'semibold' : 'regular'}
                className={`text-[11.5px] ${ci === 0 ? 'text-ink' : 'text-ink-2'}`}
                style={{ width: ci === 0 ? COL0 : COL, paddingRight: 6 }}>
                {cell}
              </Txt>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
