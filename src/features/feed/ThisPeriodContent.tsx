import { useState } from 'react';
import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StatTile } from '@/components/ui/StatTile';
import { SegmentedControl } from '@/components/ui/controls';
import { ToneBar } from '@/components/charts/ToneBar';
import { BarList } from '@/components/charts/BarList';
import { ResultsChart } from '@/components/charts/ResultsChart';
import { addDays, rangeLabel } from '@/lib/dateRange';
import { compact, formatHour, formatMonthDay, peso, signedPct, withCommas } from '@/lib/format';
import { mediumColor, scoupYellow, sentiment } from '@/theme/tokens';
import type { IHeatDay, IThisPeriod } from '@/types';

const deltaColor = (n: number) => (n >= 0 ? sentiment.positive : sentiment.negative);

const DAY_MS = 86_400_000;
const priorRangeLabel = (from: string, to: string): string => {
  const len = Math.max(
    1,
    Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1,
  );
  return rangeLabel({ from: addDays(from, -len), to: addDays(from, -1) });
};

function Figure({ label, name, value, delta }: { label: string; name: string; value: number; delta: number }) {
  return (
    <View className="flex-1">
      <Label>{label}</Label>
      <Txt weight="bold" className="mt-1 text-[15px]" numberOfLines={1}>
        {name}
      </Txt>
      <Txt className="mt-0.5 text-[12px]" style={{ color: deltaColor(delta) }}>
        {value} · {signedPct(delta)}
      </Txt>
    </View>
  );
}

// ── Results caption (matches the web's ResultsNote) ──────────────────────────
const peakDay = (heat: IHeatDay[]): IHeatDay | null =>
  heat.reduce<IHeatDay | null>((best, d) => (!best || d.total > best.total ? d : best), null);

const busiestCell = (heat: IHeatDay[]): { date: string; hour: number; count: number } | null => {
  let best: { date: string; hour: number; count: number } | null = null;
  for (const d of heat) {
    d.hours.forEach((count, hour) => {
      if (count > 0 && (!best || count > best.count)) best = { date: d.date, hour, count };
    });
  }
  return best;
};

const topHours = (heat: IHeatDay[], n: number): number[] => {
  const sums = Array<number>(24).fill(0);
  for (const d of heat) d.hours.forEach((count, hour) => (sums[hour] += count));
  return sums
    .map((sum, hour) => ({ sum, hour }))
    .sort((a, b) => b.sum - a.sum)
    .slice(0, n)
    .map((x) => x.hour);
};

function ResultsNote({ heat, mode, captured }: { heat: IHeatDay[]; mode: 'day' | 'hour'; captured: number }) {
  if (mode === 'day') {
    const peak = peakDay(heat);
    if (!peak || peak.total === 0) {
      return <Txt className="text-[11px] leading-5 text-ink-3">No articles in this period.</Txt>;
    }
    return (
      <Txt className="text-[11px] leading-5 text-ink-3">
        Peak <Txt weight="semibold" className="text-[11px] text-ink">{withCommas(peak.total)}</Txt> on{' '}
        {formatMonthDay(peak.date)}. Media Meter&apos;s full daily counts.
      </Txt>
    );
  }
  const cell = busiestCell(heat);
  if (!cell) {
    return (
      <Txt className="text-[11px] leading-5 text-ink-3">
        No broadcast or online articles with an hour in this period.
      </Txt>
    );
  }
  const [a, b, c] = topHours(heat, 3).map(formatHour);
  return (
    <Txt className="text-[11px] leading-5 text-ink-3">
      Busiest hour:{' '}
      <Txt weight="semibold" className="text-[11px] text-ink">
        {formatMonthDay(cell.date)}, {formatHour(cell.hour)}
      </Txt>{' '}
      ({cell.count}). Most broadcast items land at {a}, {b} and {c}. Cells count the {withCommas(captured)}{' '}
      captured articles by the hour they aired or posted, Manila time. Print carries a 1:00 AM edition stamp,
      so it has its own column. Totals are Media Meter&apos;s full daily counts.
    </Txt>
  );
}

export function ThisPeriodContent({ data }: { data: IThisPeriod }) {
  const [mode, setMode] = useState<'day' | 'hour'>('hour');
  const priorLabel = priorRangeLabel(data.from, data.to);
  const byMedium = [...data.byMedium].sort((x, y) => y.ave - x.ave);
  const byPlatform = [...data.social.byPlatform].sort((x, y) => y.count - x.count);

  return (
    <View className="gap-3 px-4 pb-12 pt-2">
      <Card>
        <SectionTitle title="This period" origin="mm" />
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <StatTile
              label="Results"
              value={withCommas(data.results)}
              sub={`${signedPct(data.resultsDelta)} vs ${priorLabel}`}
              subColor={deltaColor(data.resultsDelta)}
            />
          </View>
          <View className="flex-1">
            <StatTile label="AVE" value={peso(data.ave)} sub={`${withCommas(data.pressBroadcast)} press and broadcast`} />
          </View>
        </View>
        <View className="mt-4 flex-row gap-3">
          <Figure label="Top outlet" name={data.topOutlet.name} value={data.topOutlet.value} delta={data.topOutlet.delta} />
          <Figure label="Top author" name={data.topAuthor.name} value={data.topAuthor.value} delta={data.topAuthor.delta} />
        </View>
      </Card>

      <Card>
        <SectionTitle title="Article tone" origin="mm" />
        <View className="mt-3">
          <ToneBar positive={data.tone.positive} neutral={data.tone.neutral} negative={data.tone.negative} />
        </View>
      </Card>

      <Card>
        <View className="flex-row items-center justify-between">
          <SectionTitle title="Results" origin="mm" />
          <View className="w-40">
            <SegmentedControl
              options={[
                { value: 'hour', label: 'By hour' },
                { value: 'day', label: 'By day' },
              ]}
              value={mode}
              onChange={setMode}
            />
          </View>
        </View>
        <View className="mt-4">
          <ResultsChart heat={data.heat} mode={mode} />
        </View>
        <View className="mt-3">
          <ResultsNote heat={data.heat} mode={mode} captured={data.results} />
        </View>
      </Card>

      <Card>
        <SectionTitle title="AVE by medium" origin="mm" />
        <View className="mt-3">
          <BarList
            items={byMedium.map((m) => ({ label: m.medium, value: m.ave }))}
            format={peso}
            colorFor={(l) => mediumColor[l] ?? '#121212'}
            valueWidth="w-[84px]"
          />
        </View>
        <Txt className="mt-3 text-[11px] leading-5 text-ink-3">
          Media Meter&apos;s dashboard figures for the same filters.
        </Txt>
      </Card>

      <Card>
        <SectionTitle title="Social this period" origin="sc" />
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <StatTile label="Posts" value={withCommas(data.social.posts)} sub={`on ${byPlatform.length} platforms`} />
          </View>
          <View className="flex-1">
            <StatTile label="Comments" value={withCommas(data.social.comments)} sub="on those posts" />
          </View>
        </View>
        <Label className="mt-4">Posts by platform</Label>
        <View className="mt-2.5">
          <BarList
            items={byPlatform.map((p) => ({ label: p.platform, value: p.count }))}
            format={compact}
            colorFor={() => scoupYellow}
          />
        </View>
        <Txt className="mt-3 text-[11px] leading-5 text-ink-3">Switch to SharedView for posts by hour.</Txt>
      </Card>
    </View>
  );
}
