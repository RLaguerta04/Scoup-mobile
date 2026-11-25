import { View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { IStoryAlignment } from '@/types';

// Audience alignment — mirrors the web block: a headline stat, a With/Split/Against share
// bar, a scatter quadrant (bubbles placed by stance ↕ × conviction ↔), a placed/neutral
// caption, and per-platform chips. Views only.

const WITH = { fg: '#0a7a52', bg: '#dcefe6', tint: '#eef6f1' };
const SPLIT = { fg: '#2a78d6', bg: '#dbe8f7' };
const AGAINST = { fg: '#b24a14', bg: '#fbe6dc', tint: '#fcf1ea' };

const PLOT_H = 240;

const clampX = (conv: number): number => 0.15 + Math.min(1, Math.max(0, conv)) * 0.7;
const bubbleD = (pct: number): number => Math.round(30 + (pct / 100) * 48);

function Legend({ color, label, pct, count }: { color: string; label: string; pct: number; count: number }) {
  return (
    <View className="flex-row items-center">
      <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Txt className="text-[12px] text-ink-2">{label} </Txt>
      <Txt weight="semibold" className="text-[12px] text-ink">
        {pct}%
      </Txt>
      <Txt className="ml-1 text-[11px] text-ink-3">({count})</Txt>
    </View>
  );
}

function Bubble({
  x,
  y,
  pct,
  fg,
  bg,
}: {
  x: number;
  y: number;
  pct: number;
  fg: string;
  bg: string;
}) {
  const d = bubbleD(pct);
  return (
    <View
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        marginLeft: -d / 2,
        marginTop: -d / 2,
        width: d,
        height: d,
        borderRadius: d / 2,
        backgroundColor: bg,
        borderWidth: 1.5,
        borderColor: fg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Txt weight="bold" className="text-[12px]" style={{ color: fg }}>
        {pct}%
      </Txt>
    </View>
  );
}

export function AlignmentQuadrant({ alignment: a }: { alignment: IStoryAlignment }) {
  const { withPct, splitPct, againstPct, placed, total, quadrants: q } = a;
  const withN = Math.round((withPct / 100) * placed);
  const splitN = Math.round((splitPct / 100) * placed);
  const againstN = Math.max(0, placed - withN - splitN);

  const withConv = q.backedMeant + q.backedConditions > 0 ? q.backedMeant / (q.backedMeant + q.backedConditions) : 0.6;
  const againstConv =
    q.pushedMeant + q.pushedDoubt > 0 ? q.pushedMeant / (q.pushedMeant + q.pushedDoubt) : 0.6;

  return (
    <View className="mt-1">
      {/* Headline */}
      <View className="flex-row items-baseline">
        <Txt weight="extrabold" className="text-[28px] leading-tight">
          {withPct}%
        </Txt>
        <Txt className="ml-2 flex-1 text-[12px] leading-snug text-ink-3">
          with the story · {placed} of {total} comments took a position
        </Txt>
      </View>

      {/* Share bar */}
      <View className="mt-3 h-2 flex-row overflow-hidden rounded-full">
        <View style={{ flex: Math.max(withPct, 0.01), backgroundColor: WITH.fg }} />
        <View style={{ flex: Math.max(splitPct, 0.01), backgroundColor: SPLIT.fg }} />
        <View style={{ flex: Math.max(againstPct, 0.01), backgroundColor: AGAINST.fg }} />
      </View>
      <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
        <Legend color={WITH.fg} label="With" pct={withPct} count={withN} />
        <Legend color={SPLIT.fg} label="Split" pct={splitPct} count={splitN} />
        <Legend color={AGAINST.fg} label="Against" pct={againstPct} count={againstN} />
      </View>

      {/* Scatter quadrant */}
      <Txt mono className="mt-4 text-center text-[9px] uppercase tracking-wide text-ink-3">
        With the story ↑
      </Txt>
      <View className="my-1 overflow-hidden rounded-xl border border-border" style={{ height: PLOT_H }}>
        {/* Row tints */}
        <View className="absolute left-0 right-0 top-0" style={{ height: '50%', backgroundColor: WITH.tint }} />
        <View className="absolute bottom-0 left-0 right-0" style={{ height: '50%', backgroundColor: AGAINST.tint }} />
        {/* Centre cross */}
        <View className="absolute left-0 right-0 top-1/2 h-px bg-border" />
        <View className="absolute bottom-0 left-1/2 top-0 w-px bg-border" />
        {/* Corner labels */}
        <Txt className="absolute left-2 top-1.5 text-[9px] text-ink-3">Backed,{'\n'}with conditions</Txt>
        <Txt className="absolute right-2 top-1.5 text-right text-[9px] text-ink-3">Backed,{'\n'}and meant</Txt>
        <Txt className="absolute bottom-1.5 left-2 text-[9px] text-ink-3">Pushed back,{'\n'}with doubt</Txt>
        <Txt className="absolute bottom-1.5 right-2 text-right text-[9px] text-ink-3">Pushed back,{'\n'}and meant</Txt>
        {/* Bubbles */}
        {withPct > 0 ? <Bubble x={clampX(withConv)} y={0.24} pct={withPct} fg={WITH.fg} bg={WITH.bg} /> : null}
        {splitPct > 0 ? <Bubble x={clampX(0.35)} y={0.5} pct={splitPct} fg={SPLIT.fg} bg={SPLIT.bg} /> : null}
        {againstPct > 0 ? (
          <Bubble x={clampX(againstConv)} y={0.76} pct={againstPct} fg={AGAINST.fg} bg={AGAINST.bg} />
        ) : null}
      </View>
      <Txt mono className="text-center text-[9px] uppercase tracking-wide text-ink-3">
        ↓ Against the story
      </Txt>
      <View className="mt-1 flex-row justify-between px-1">
        <Txt className="text-[10px] text-ink-3">← Hedged</Txt>
        <Txt className="text-[10px] text-ink-3">60% = strong</Txt>
        <Txt className="text-[10px] text-ink-3">Stated plainly →</Txt>
      </View>

      {/* Caption */}
      <Txt className="mt-3 text-[11px] leading-5 text-ink-3">
        {placed} comments placed · {Math.max(0, total - placed)} neutral, not placed.
      </Txt>

      {/* Per-platform chips */}
      <View className="mt-2 flex-row flex-wrap gap-2">
        {a.platforms.map((p) => (
          <View key={p.name} className="rounded-full border border-border bg-surface px-3 py-1.5">
            <Txt className="text-[11px] text-ink-2">
              <Txt weight="medium" className="text-[11px] text-ink">
                {p.name}
              </Txt>{' '}
              {p.pct == null ? 'too few' : `${p.pct}% with`}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}
