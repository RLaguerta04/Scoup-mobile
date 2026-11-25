import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { LensToggle } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { colors, emotionColor } from '@/theme/tokens';

// The story emotion radar — the eight tracked emotions (Plutchik) plotted as a polygon,
// filled in the dominant emotion's colour, with each spoke labelled and a legend of the
// measured shares. A Chart/Table toggle (web parity) swaps the radar for a ranked share table.
// Mirrors the web's EmotionChart. Pure react-native-svg.

type EmotionDatum = { label: string; pct: number };
type EmotionView = 'chart' | 'table';

// Wider than tall so the side labels ("Anticipation", "Fear") don't clip.
const W = 268;
const H = 224;
const CX = W / 2;
const CY = H / 2;
const RADIUS = H / 2 - 30; // data area
const LABEL_RADIUS = H / 2 - 16; // spoke labels sit just outside the ring
const RINGS = [0.25, 0.5, 0.75, 1];

// Angle for spoke i, starting at the top and going clockwise.
const angleFor = (i: number, n: number): number =>
  (-90 + (360 / n) * i) * (Math.PI / 180);

const pointAt = (i: number, n: number, r: number): [number, number] => [
  CX + r * Math.cos(angleFor(i, n)),
  CY + r * Math.sin(angleFor(i, n)),
];

const ceilingFor = (max: number): number =>
  max <= 40 ? 40 : max <= 60 ? 60 : max <= 80 ? 80 : 100;

const toPoints = (coords: Array<[number, number]>): string =>
  coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export function EmotionRadar({ items }: { items: EmotionDatum[] }) {
  const [view, setView] = useState<EmotionView>('chart');
  const n = items.length;
  const max = Math.max(1, ...items.map((e) => e.pct));
  const ceiling = ceilingFor(max);
  const domIndex = items.reduce((best, e, i) => (e.pct > items[best].pct ? i : best), 0);
  const domColor = emotionColor[items[domIndex]?.label] ?? colors.ink;

  const dataCoords = items.map((e, i) => pointAt(i, n, RADIUS * (e.pct / ceiling)));
  const ranked = [...items].sort((a, b) => b.pct - a.pct);

  return (
    <View className="mt-1">
      {/* Chart / Table toggle (web parity). */}
      <View className="mb-1 flex-row justify-end">
        <LensToggle
          options={[
            { value: 'chart', label: 'Chart' },
            { value: 'table', label: 'Table' },
          ]}
          value={view}
          onChange={setView}
        />
      </View>

      {view === 'table' ? (
        <View>
          {ranked.map((e, i) => (
            <View
              key={e.label}
              className={`flex-row items-center py-2 ${i > 0 ? 'border-t border-border' : ''}`}>
              <View
                className="mr-2 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: emotionColor[e.label] ?? colors.ink3 }}
              />
              <Txt className="flex-1 text-[13px] text-ink">{e.label}</Txt>
              {i === 0 ? (
                <Txt mono className="mr-3 text-[10px] uppercase tracking-wide text-ink-3">
                  strongest
                </Txt>
              ) : null}
              <Txt weight="bold" className="text-[13px] text-ink" style={{ width: 44, textAlign: 'right' }}>
                {e.pct}%
              </Txt>
            </View>
          ))}
        </View>
      ) : (
        <>
          <View className="items-center">
            <Svg width={W} height={H}>
          {/* Grid rings */}
          {RINGS.map((frac) => (
            <Polygon
              key={frac}
              points={toPoints(items.map((_, i) => pointAt(i, n, RADIUS * frac)))}
              fill="none"
              stroke={colors.border}
              strokeWidth={1}
            />
          ))}
          {/* Spokes */}
          {items.map((_, i) => {
            const [x, y] = pointAt(i, n, RADIUS);
            return <Line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={colors.border} strokeWidth={1} />;
          })}
          {/* Spoke labels */}
          {items.map((e, i) => {
            const [x, y] = pointAt(i, n, LABEL_RADIUS);
            const dx = x - CX;
            const anchor = dx > 8 ? 'start' : dx < -8 ? 'end' : 'middle';
            return (
              <SvgText key={`lbl-${i}`} x={x} y={y + 3} fontSize={9} fill={colors.ink3} textAnchor={anchor}>
                {e.label}
              </SvgText>
            );
          })}
          {/* Data polygon */}
          <Polygon points={toPoints(dataCoords)} fill={domColor} fillOpacity={0.22} stroke={domColor} strokeWidth={2} />
          {/* Vertices, coloured per emotion */}
          {dataCoords.map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={3.5} fill={emotionColor[items[i].label] ?? colors.ink3} />
          ))}
        </Svg>
      </View>

      {/* Legend — each emotion with its colour dot and share. */}
      <View className="mt-2 flex-row flex-wrap justify-center gap-x-4 gap-y-1.5">
        {items.map((e) => (
          <View key={e.label} className="flex-row items-center" style={{ minWidth: 92 }}>
            <View
              className="mr-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: emotionColor[e.label] ?? colors.ink3 }}
            />
            <Txt className="text-[12px] text-ink-2">{e.label} </Txt>
            <Txt weight="semibold" className="text-[12px] text-ink">
              {e.pct}%
            </Txt>
          </View>
        ))}
          </View>
        </>
      )}
    </View>
  );
}
