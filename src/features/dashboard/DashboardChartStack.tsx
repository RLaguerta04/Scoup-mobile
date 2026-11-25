import { Pressable, View } from 'react-native';
import Svg, { Circle, Polygon, Polyline } from 'react-native-svg';
import { IconChevronRight } from '@/components/navIcons';
import { Label, Txt } from '@/components/ui/Txt';
import { useDashDrill } from '@/features/dashboard/drill/DrillContext';
import { colors, tone } from '@/theme/tokens';
import type { ReactNode } from 'react';
import type {
  IDashboardCharts,
  IDashEntity,
  IDashExposure,
  IDashKeyFigures,
  IDashOverTime,
  IDashPublisher,
  IDashTonality,
} from '@/types';

// The web Dashboard's MediaWatch chart stack, ported to mobile. Each card is place-aware (the
// data is already scoped), with a chart + a one-line "what it says". Cards: Over time, Key
// figures, Media exposure, Tonality, Top publishers, Entities. Every figure is drillable —
// tapping it opens its records + analysis (the web's drill drawer), via useDashDrill().

const MEDIUM_COLORS = ['#7c5cff', '#1e4fa8', '#eda100', '#e34948', '#159d72', '#8f897b'];
const TONE_COLORS = { pos: tone.positive, neu: colors.ink3, neg: tone.negative };
const ENTITY_COLORS: Record<IDashEntity['type'], string> = {
  Organisation: '#7c5cff',
  Person: '#1e4fa8',
  Place: '#eda100',
};

const pressFx = ({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.55 : 1 });

function ChartCard({ title, sub, says, children }: { title: string; sub: string; says: string; children: ReactNode }) {
  return (
    <View className="mx-4 mb-3 rounded-card border border-border bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <Txt weight="bold" className="text-[15px]">
          {title}
        </Txt>
        <View className="rounded border border-border px-1.5 py-0.5">
          <Txt mono className="text-[8px] uppercase tracking-wider text-ink-3">
            Media Meter
          </Txt>
        </View>
      </View>
      <Txt className="mt-0.5 text-[12px] text-ink-3">{sub}</Txt>
      <View className="mt-3">{children}</View>
      <View className="mt-3 border-t border-border pt-2.5">
        <Label className="mb-1">What it says</Label>
        <Txt className="text-[12.5px] leading-[18px] text-ink-2">{says}</Txt>
      </View>
    </View>
  );
}

// Over-time stat cell — drillable when given a spec.
function Stat({ label, value, spec }: { label: string; value: string; spec?: string }) {
  const onDrill = useDashDrill();
  const body = (
    <>
      <Txt weight="bold" className="text-[15px]">
        {value}
      </Txt>
      <Txt className="text-[10px] text-ink-3">{label}</Txt>
    </>
  );
  if (spec && onDrill) {
    return (
      <Pressable className="flex-1" style={pressFx} onPress={() => onDrill(spec)}>
        {body}
      </Pressable>
    );
  }
  return <View className="flex-1">{body}</View>;
}

// ─── 1. Over time (area line) ────────────────────────────────────────────────
function OverTimeChart({ d }: { d: IDashOverTime }) {
  const W = 300;
  const H = 120;
  const P = 8;
  const max = Math.max(1, ...d.days.map((p) => p.value));
  const n = d.days.length;
  const x = (i: number) => (n <= 1 ? W / 2 : P + (i * (W - 2 * P)) / (n - 1));
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const line = d.days.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  const area = `${P},${H - P} ${line} ${x(n - 1)},${H - P}`;
  const peakI = d.days.findIndex((p) => p.value === d.peak.value);
  return (
    <View>
      <Svg width="100%" height={126} viewBox={`0 0 ${W} ${H}`}>
        <Polygon points={area} fill="rgba(21,157,114,0.14)" />
        <Polyline points={line} fill="none" stroke="#159d72" strokeWidth={2} />
        {peakI >= 0 && <Circle cx={x(peakI)} cy={y(d.peak.value)} r={3.5} fill="#fff" stroke="#159d72" strokeWidth={2} />}
      </Svg>
      <View className="mt-1 flex-row justify-between">
        <Txt mono className="text-[9px] text-ink-3">
          {d.days[0]?.label}
        </Txt>
        <Txt mono className="text-[9px] text-ink-3">
          {d.days[d.days.length - 1]?.label}
        </Txt>
      </View>
      <View className="mt-2 flex-row gap-3">
        <Stat label="Peak" value={`${d.peak.value}`} spec={`day:${d.peak.label}`} />
        <Stat label="Avg / active day" value={`${d.avgPerDay}`} />
        <Stat label="Busiest" value={d.busiestDay} spec={`day:${d.busiestDay}`} />
        <Stat label="Items" value={`${d.total}`} spec="total" />
      </View>
    </View>
  );
}

// ─── 2. Key figures (tiles) ──────────────────────────────────────────────────
function Tile({ label, value, sub, spec }: { label: string; value: string; sub?: string; spec?: string }) {
  const onDrill = useDashDrill();
  const inner = (
    <View className="rounded-lg border border-border bg-bg px-3 py-2.5">
      <Txt mono className="text-[9px] uppercase tracking-wider text-ink-3">
        {label}
      </Txt>
      <Txt weight="bold" className="mt-0.5 text-[15px]" numberOfLines={1}>
        {value}
      </Txt>
      {sub ? (
        <Txt className="text-[11px] text-ink-3" numberOfLines={1}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
  return (
    <View className="mb-2 w-1/2 px-1">
      {spec && onDrill ? (
        <Pressable style={pressFx} onPress={() => onDrill(spec)}>
          {inner}
        </Pressable>
      ) : (
        inner
      )}
    </View>
  );
}
function KeyFigures({ d }: { d: IDashKeyFigures }) {
  return (
    <View className="-mx-1 flex-row flex-wrap">
      <Tile label="Total results" value={`${d.total}`} sub="articles in scope" spec="total" />
      <Tile label="Top publisher" value={d.topPublisher.name} sub={`${d.topPublisher.count} articles`} spec={`outlet:${d.topPublisher.name}`} />
      <Tile label="Top medium" value={d.topMedium.label} sub={`${d.topMedium.count} · ${d.topMedium.pct}%`} spec={`medium:${d.topMedium.label}`} />
      <Tile label="Dominant section" value={d.dominantSection} spec={`section:${d.dominantSection}`} />
      <Tile label="Top author" value={d.topAuthor.name} sub={`${d.topAuthor.count} articles`} spec={`author:${d.topAuthor.name}`} />
      <Tile label="Busiest day" value={d.busiestDay.label} sub={`${d.busiestDay.count} articles`} spec={`day:${d.busiestDay.label}`} />
      <Tile label="Top tonality" value={d.topTone.label} sub={`${d.topTone.pct}%`} spec={`tone:${d.topTone.label}`} />
      <Tile label="Top entity" value={d.topEntity.name} sub={`${d.topEntity.count} mentions`} spec={`entity:${d.topEntity.name}`} />
    </View>
  );
}

// ─── 3. Media exposure (share bar + per-day stacks) ──────────────────────────
function Exposure({ d }: { d: IDashExposure }) {
  const onDrill = useDashDrill();
  const dayMax = Math.max(1, ...d.byDay.map((day) => day.values.reduce((a, b) => a + b, 0)));
  return (
    <View>
      {/* Share bar — each medium drillable */}
      <View className="h-6 flex-row overflow-hidden rounded-md">
        {d.shares.map((s, i) => (
          <Pressable
            key={s.medium}
            style={({ pressed }) => ({
              width: `${s.pct}%`,
              backgroundColor: MEDIUM_COLORS[i % MEDIUM_COLORS.length],
              opacity: pressed ? 0.55 : 1,
            })}
            className="items-center justify-center"
            onPress={onDrill ? () => onDrill(`medium:${s.medium}`) : undefined}>
            {s.pct >= 12 ? (
              <Txt className="text-[9px] font-semibold text-white" numberOfLines={1}>
                {s.pct}%
              </Txt>
            ) : null}
          </Pressable>
        ))}
      </View>
      {/* Per-day stacked columns */}
      <View className="mt-3 flex-row items-end justify-between" style={{ height: 70 }}>
        {d.byDay.map((day) => {
          const stackH = (day.values.reduce((a, b) => a + b, 0) / dayMax) * 64;
          return (
            <View key={day.label} className="items-center" style={{ flex: 1 }}>
              <View className="w-3 overflow-hidden rounded-sm" style={{ height: Math.max(2, stackH) }}>
                {day.values.map((v, i) => (
                  <View key={i} style={{ flex: v || 0.0001, backgroundColor: MEDIUM_COLORS[i % MEDIUM_COLORS.length] }} />
                ))}
              </View>
            </View>
          );
        })}
      </View>
      {/* Legend — each medium drillable */}
      <View className="mt-2 flex-row flex-wrap gap-x-3 gap-y-1">
        {d.shares.map((s, i) => (
          <Pressable
            key={s.medium}
            style={pressFx}
            className="flex-row items-center gap-1"
            onPress={onDrill ? () => onDrill(`medium:${s.medium}`) : undefined}>
            <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: MEDIUM_COLORS[i % MEDIUM_COLORS.length] }} />
            <Txt className="text-[10px] text-ink-3">{s.medium}</Txt>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── 4. Tonality (donut + legend) ────────────────────────────────────────────
function Donut({ pos, neu, neg, total }: { pos: number; neu: number; neg: number; total: number }) {
  const R = 34;
  const C = 2 * Math.PI * R;
  const segs = [
    { v: neg, color: TONE_COLORS.neg },
    { v: neu, color: TONE_COLORS.neu },
    { v: pos, color: TONE_COLORS.pos },
  ];
  let offset = 0;
  return (
    <Svg width={92} height={92} viewBox="0 0 92 92">
      <Circle cx={46} cy={46} r={R} fill="none" stroke={colors.border} strokeWidth={12} />
      {total > 0 &&
        segs.map((s, i) => {
          const frac = s.v / total;
          const el = (
            <Circle
              key={i}
              cx={46}
              cy={46}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={12}
              strokeDasharray={`${frac * C} ${C}`}
              strokeDashoffset={-offset * C}
              transform="rotate(-90 46 46)"
            />
          );
          offset += frac;
          return el;
        })}
    </Svg>
  );
}
function Tonality({ d }: { d: IDashTonality }) {
  const onDrill = useDashDrill();
  const pct = (v: number) => (d.total ? Math.round((v / d.total) * 100) : 0);
  return (
    <View className="flex-row items-center gap-4">
      <View className="items-center justify-center">
        <Donut pos={d.positive} neu={d.neutral} neg={d.negative} total={d.total} />
      </View>
      <View className="flex-1 gap-1.5">
        {[
          { label: 'Negative', v: d.negative, c: TONE_COLORS.neg },
          { label: 'Neutral', v: d.neutral, c: TONE_COLORS.neu },
          { label: 'Positive', v: d.positive, c: TONE_COLORS.pos },
        ].map((r) => (
          <Pressable
            key={r.label}
            style={pressFx}
            className="flex-row items-center gap-2"
            onPress={onDrill ? () => onDrill(`tone:${r.label}`) : undefined}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: r.c }} />
            <Txt className="flex-1 text-[12px] text-ink-2">{r.label}</Txt>
            <Txt weight="semibold" className="text-[12px] text-ink">
              {pct(r.v)}% ({r.v})
            </Txt>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── 5. Top publishers (dot grid) ────────────────────────────────────────────
function TopPublishers({ pubs, days }: { pubs: IDashPublisher[]; days: string[] }) {
  const onDrill = useDashDrill();
  return (
    <View>
      {pubs.slice(0, 8).map((p) => (
        <Pressable
          key={p.name}
          style={pressFx}
          className="flex-row items-center py-1"
          onPress={onDrill ? () => onDrill(`outlet:${p.name}`) : undefined}>
          <Txt className="w-[104px] text-[11px] text-ink-2" numberOfLines={1}>
            {p.name}
          </Txt>
          <View className="flex-1 flex-row items-center justify-between">
            {p.perDay.map((count, di) => (
              <View key={di} className="flex-row items-center gap-0.5">
                {Array.from({ length: Math.min(count, 4) }).map((_, k) => (
                  <View key={k} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#1e4fa8' }} />
                ))}
                {count === 0 ? <View style={{ width: 5, height: 5 }} /> : null}
              </View>
            ))}
          </View>
          <Txt mono weight="semibold" className="ml-2 w-5 text-right text-[11px] text-ink">
            {p.total}
          </Txt>
          <IconChevronRight size={13} color={colors.ink3} style={{ marginLeft: 2 }} />
        </Pressable>
      ))}
      <View className="mt-1 flex-row justify-between pl-[104px] pr-9">
        <Txt mono className="text-[8px] text-ink-3">
          {days[0]}
        </Txt>
        <Txt mono className="text-[8px] text-ink-3">
          {days[days.length - 1]}
        </Txt>
      </View>
    </View>
  );
}

// ─── 6. Entities (ranked list) ───────────────────────────────────────────────
function Entities({ items }: { items: IDashEntity[] }) {
  const onDrill = useDashDrill();
  const max = Math.max(1, ...items.map((e) => e.count));
  return (
    <View className="gap-1.5">
      {items.slice(0, 10).map((e, i) => (
        <Pressable
          key={e.name}
          style={pressFx}
          className="flex-row items-center gap-2"
          onPress={onDrill ? () => onDrill(`entity:${e.name}`) : undefined}>
          <Txt mono className="w-4 text-[10px] text-ink-3">
            {i + 1}
          </Txt>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ENTITY_COLORS[e.type] }} />
          <Txt className="flex-1 text-[12px] text-ink-2" numberOfLines={1}>
            {e.name}
          </Txt>
          <View className="h-1.5 w-16 overflow-hidden rounded-full bg-surface3">
            <View style={{ width: `${(e.count / max) * 100}%`, backgroundColor: ENTITY_COLORS[e.type] }} className="h-full" />
          </View>
          <Txt mono weight="semibold" className="w-5 text-right text-[11px] text-ink">
            {e.count}
          </Txt>
          <IconChevronRight size={13} color={colors.ink3} />
        </Pressable>
      ))}
    </View>
  );
}

// ─── Chart registry — drives both the stack and the "Choose charts" picker ───
export type DashChartId = 'overTime' | 'keyFigures' | 'exposure' | 'tonality' | 'topPublishers' | 'entities';

export const DASH_CHART_META: { id: DashChartId; title: string; description: string }[] = [
  { id: 'overTime', title: 'Over time', description: 'Articles by day' },
  { id: 'keyFigures', title: 'Key figures', description: 'Totals and leaders for the articles in scope' },
  { id: 'exposure', title: 'Media exposure', description: 'Share of articles by medium, per day' },
  { id: 'tonality', title: 'Tonality', description: 'Article tone overall and by day' },
  { id: 'topPublishers', title: 'Top publishers', description: 'The outlets with the most articles' },
  { id: 'entities', title: 'Entities', description: 'People, organisations and places named' },
];

export const DASH_CHART_IDS: DashChartId[] = DASH_CHART_META.map((c) => c.id);

function renderChart(id: DashChartId, data: IDashboardCharts): ReactNode {
  const { overTime: ot, keyFigures: kf, exposure, tonality, topPublishers, entities, days } = data;
  switch (id) {
    case 'overTime':
      return (
        <ChartCard
          key={id}
          title="Over time"
          sub="Articles by day"
          says={`Articles peaked on ${ot.busiestDay} (${ot.peak.value}), led by “${ot.lead}”. ${ot.total} in the range, about ${ot.avgPerDay} a day.`}>
          <OverTimeChart d={ot} />
        </ChartCard>
      );
    case 'keyFigures':
      return (
        <ChartCard
          key={id}
          title="Key figures"
          sub="Totals and leaders for the articles in scope"
          says={`${kf.total} articles; ${kf.topPublisher.name} ran the most (${kf.topPublisher.count}) and ${kf.topTone.label.toLowerCase()} tone leads at ${kf.topTone.pct}%.`}>
          <KeyFigures d={kf} />
        </ChartCard>
      );
    case 'exposure': {
      const topExp = exposure.shares[0];
      return (
        <ChartCard
          key={id}
          title="Media exposure"
          sub="Share of articles by medium, and the articles each medium ran per day"
          says={topExp ? `${topExp.medium} carries ${topExp.pct}% of the articles${exposure.shares[1] ? `, ahead of ${exposure.shares[1].medium} (${exposure.shares[1].pct}%)` : ''}.` : 'No articles in scope.'}>
          <Exposure d={exposure} />
        </ChartCard>
      );
    }
    case 'tonality':
      return (
        <ChartCard
          key={id}
          title="Tonality"
          sub="Article tone overall and by day"
          says={`${tonality.total ? Math.round((Math.max(tonality.negative, tonality.neutral, tonality.positive) / tonality.total) * 100) : 0}% leads; negative coverage was heaviest on ${tonality.peakNegDay}.`}>
          <Tonality d={tonality} />
        </ChartCard>
      );
    case 'topPublishers':
      return (
        <ChartCard
          key={id}
          title="Top publishers"
          sub="The outlets with the most articles, one dot per article per day"
          says={topPublishers[0] ? `${topPublishers[0].name} carried the most (${topPublishers[0].total} articles).` : 'No articles in scope.'}>
          <TopPublishers pubs={topPublishers} days={days} />
        </ChartCard>
      );
    case 'entities':
      return (
        <ChartCard
          key={id}
          title="Entities"
          sub="People, organisations and places named in the articles"
          says={entities[0] ? `${entities[0].name} is named most (${entities[0].count} mentions).` : 'No entities in scope.'}>
          <Entities items={entities} />
        </ChartCard>
      );
  }
}

// `shown` is the ordered list of visible chart ids; defaults to all, in registry order.
export function DashboardCharts({ data, shown }: { data: IDashboardCharts; shown?: DashChartId[] }) {
  const ids = shown ?? DASH_CHART_IDS;
  return <View className="pt-1">{ids.map((id) => renderChart(id, data))}</View>;
}
