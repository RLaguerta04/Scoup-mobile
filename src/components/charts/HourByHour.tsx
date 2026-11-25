import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SegmentedControl } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { formatHour, withCommas } from '@/lib/format';
import { scoupYellow } from '@/theme/tokens';
import type { IStoryHourlyDay } from '@/types';

// "Hour by hour" — article/post counts by channel across the recent days. Mirrors the web's
// StoryHourly: a Both/Brief/Hourly mode, a day strip where each chip is a mini-sparkline, the
// time-of-day "brief windows" sized by share, the selected day's 24-hour stacked bars, and a
// composed caption (per-channel peaks, busiest hour of the week, undated items left out). The
// source badge lives on the card header (PanelCard action). Views only.

type HourLens = 'narrative' | 'coverage' | 'social';
type Channel = 'broadcast' | 'online' | 'social';

const CH: Record<Channel, string> = { broadcast: '#159d72', online: '#1e4fa8', social: scoupYellow };
const CH_LABEL: Record<Channel, string> = { broadcast: 'Broadcast', online: 'Online', social: 'Social' };
// Which channels a lens shows (web hourChannels): Coverage drops social, Social keeps only social.
const CHANNELS_FOR: Record<HourLens, Channel[]> = {
  narrative: ['broadcast', 'online', 'social'],
  coverage: ['broadcast', 'online'],
  social: ['social'],
};

const MAX_H = 72;
const MINI_H = 14;

// Web brief windows: Morning 12a–6a, Midday 6a–12p, Evening 12p–7p, Overnight 7p–12a.
const WINDOWS = [
  { label: 'Morning', from: 0, to: 6 },
  { label: 'Midday', from: 6, to: 12 },
  { label: 'Evening', from: 12, to: 19 },
  { label: 'Overnight', from: 19, to: 24 },
] as const;

const MODES = [
  { value: 'both', label: 'Both' },
  { value: 'brief', label: 'Brief' },
  { value: 'hourly', label: 'Hourly' },
] as const;
type Mode = (typeof MODES)[number]['value'];

const sum = (a: number[]): number => a.reduce((x, y) => x + y, 0);
const hourTotals = (d: IStoryHourlyDay, channels: Channel[]): number[] =>
  Array.from({ length: 24 }, (_, h) => sum(channels.map((c) => d[c][h])));
const dayTotal = (d: IStoryHourlyDay, channels: Channel[]): number => sum(hourTotals(d, channels));

export function HourByHour({
  days,
  lens = 'narrative',
  undatedArticles = 0,
  undatedPosts = 0,
}: {
  days: IStoryHourlyDay[];
  lens?: HourLens;
  undatedArticles?: number;
  undatedPosts?: number;
}) {
  const channels = CHANNELS_FOR[lens];
  const [mode, setMode] = useState<Mode>('both');

  const busiest = days.reduce(
    (best, d, i) => (dayTotal(d, channels) > dayTotal(days[best], channels) ? i : best),
    0,
  );
  const [sel, setSel] = useState(busiest);
  const day = days[sel] ?? days[0];
  if (!day) return null;

  const showWindows = mode !== 'hourly';
  const showBars = mode !== 'brief';

  const totals = hourTotals(day, channels);
  const maxHour = Math.max(1, ...totals);
  const seg = (n: number): number => Math.round((n / maxHour) * MAX_H);

  const windows = WINDOWS.map((w) => ({
    label: w.label,
    count: totals.reduce((acc, c, h) => acc + (h >= w.from && h < w.to ? c : 0), 0),
  }));
  const maxWindow = Math.max(1, ...windows.map((w) => w.count));

  // Caption: per-channel peaks for the selected day.
  const peaks = channels
    .map((c) => {
      const max = Math.max(0, ...day[c]);
      return max > 0 ? `${CH_LABEL[c]} peaked at ${formatHour(day[c].indexOf(max))} (${max})` : null;
    })
    .filter(Boolean)
    .join(' · ');

  // Busiest hour across the whole week.
  let best = { total: 0, label: day.label, hour: 0 };
  days.forEach((d) => {
    hourTotals(d, channels).forEach((t, h) => {
      if (t > best.total) best = { total: t, label: d.label, hour: h };
    });
  });

  const leftOut: string[] = [];
  if (channels.includes('online') && undatedArticles > 0)
    leftOut.push(`${withCommas(undatedArticles)} online ${undatedArticles === 1 ? 'article' : 'articles'}`);
  if (channels.includes('social') && undatedPosts > 0)
    leftOut.push(`${withCommas(undatedPosts)} ${undatedPosts === 1 ? 'post' : 'posts'}`);

  return (
    <View className="mt-1">
      {/* Day label + Both/Brief/Hourly mode */}
      <View className="flex-row items-center justify-between gap-2">
        <Txt mono numberOfLines={1} className="flex-1 text-[10px] uppercase tracking-wide text-ink-3">
          {day.label} · Manila time
        </Txt>
        <View style={{ width: 176 }}>
          <SegmentedControl
            options={MODES.map((m) => ({ value: m.value, label: m.label }))}
            value={mode}
            onChange={setMode}
          />
        </View>
      </View>

      {/* Legend */}
      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
        {channels.map((c) => (
          <View key={c} className="flex-row items-center">
            <View className="mr-1.5 h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CH[c] }} />
            <Txt className="text-[12px] text-ink-2">{CH_LABEL[c]}</Txt>
          </View>
        ))}
      </View>

      {/* Day strip — each chip carries a 24-bucket sparkline */}
      <View className="mt-3 flex-row gap-2">
        {days.map((d, i) => {
          const active = i === sel;
          const t = hourTotals(d, channels);
          const dmax = Math.max(1, ...t);
          return (
            <Pressable
              key={d.date}
              onPress={() => setSel(i)}
              accessibilityRole="button"
              className={`flex-1 rounded-lg border px-2 py-1.5 ${active ? 'border-ink bg-surface2' : 'border-border bg-surface'}`}>
              <View className="flex-row items-baseline justify-between">
                <Txt mono className="text-[10px] text-ink-3">
                  {d.label}
                </Txt>
                <Txt weight="bold" className="text-[13px]">
                  {dayTotal(d, channels)}
                </Txt>
              </View>
              <View className="mt-1 flex-row items-end gap-px" style={{ height: MINI_H }}>
                {t.map((v, h) => (
                  <View
                    key={h}
                    className="flex-1 rounded-[1px]"
                    style={{ height: Math.max(1, (v / dmax) * MINI_H), backgroundColor: active ? CH.social : '#d4d2cc' }}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Brief windows — circle sized by share, busiest highlighted */}
      {showWindows ? (
        <View className="mt-4 flex-row justify-between px-1">
          {windows.map((w) => {
            const hot = w.count === maxWindow && w.count > 0;
            const size = 30 + Math.round((w.count / maxWindow) * 16);
            return (
              <View key={w.label} className="items-center" style={{ width: 70 }}>
                <View
                  className={`items-center justify-center rounded-full border ${hot ? 'border-brand bg-[#fdefd4]' : 'border-border'}`}
                  style={{ width: size, height: size }}>
                  <Txt weight="bold" className="text-[13px]">
                    {w.count || ''}
                  </Txt>
                </View>
                <Txt mono className="mt-1 text-[8px] uppercase tracking-wide text-ink-3">
                  {w.label}
                </Txt>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* 24-hour stacked bars */}
      {showBars ? (
        <View className="mt-4">
          <View className="flex-row items-end" style={{ height: MAX_H }}>
            {Array.from({ length: 24 }, (_, h) => (
              <View key={h} className="flex-1 items-center justify-end" style={{ paddingHorizontal: 0.5 }}>
                {channels.map((c) => (
                  <View key={c} style={{ height: seg(day[c][h]), width: '100%', backgroundColor: CH[c] }} />
                ))}
              </View>
            ))}
          </View>
          <View className="mt-1 flex-row justify-between">
            {['12a', '6a', '12p', '6p', '11p'].map((t) => (
              <Txt key={t} className="text-[9px] text-ink-3">
                {t}
              </Txt>
            ))}
          </View>
        </View>
      ) : null}

      {/* Composed caption */}
      <Txt className="mt-3 text-[11px] leading-5 text-ink-3">
        <Txt weight="semibold" className="text-[11px] text-ink">
          {day.label}:
        </Txt>{' '}
        {peaks || 'no timed items'}.
        {best.total > 0 ? (
          <Txt className="text-[11px] text-ink-3">
            {' '}
            Busiest hour of the week:{' '}
            <Txt weight="semibold" className="text-[11px] text-ink">
              {best.label}, {formatHour(best.hour)}
            </Txt>{' '}
            ({best.total}).
          </Txt>
        ) : null}
        {day.print > 0 ? ` ${day.print} print ${day.print === 1 ? 'item' : 'items'} this day.` : ''}
        {leftOut.length ? ` ${leftOut.join(' and ')} have no publish time and are left out.` : ''}
      </Txt>
    </View>
  );
}
