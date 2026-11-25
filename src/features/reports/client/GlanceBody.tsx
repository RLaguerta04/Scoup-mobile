import { View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { IReportGlance } from '@/types';

// The "At a glance" tab body (web: GlanceTab) — lead, a dark verdict card with a headline-stage
// shift grid, before/now figure tiles, and the analyst "key findings".

function MiniFigure({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-[31.5%] rounded-xl border border-border bg-surface p-2.5">
      <Txt mono numberOfLines={2} className="text-[8.5px] uppercase tracking-wide text-ink-3">{label}</Txt>
      <Txt weight="bold" className="mt-1 text-[15px]">{value}</Txt>
    </View>
  );
}

export function GlanceBody({ glance }: { glance: IReportGlance }) {
  return (
    <View>
      <Txt className="text-[14px] leading-[20px] text-ink-2">{glance.lead}</Txt>

      {glance.verdict ? (
        <View className="mt-4 rounded-xl p-4" style={{ backgroundColor: colors.ink }}>
          <Txt mono weight="medium" className="text-[10px] uppercase tracking-wide" style={{ color: '#9aa0a6' }}>
            {glance.verdict.ask}
          </Txt>
          <Txt weight="bold" className="mt-1 text-[16px] leading-[21px] text-white">{glance.verdict.title}</Txt>
          <Txt className="mt-1.5 text-[13px] leading-[19px]" style={{ color: '#d4d2cc' }}>{glance.verdict.text}</Txt>
          {glance.verdict.grid?.length ? (
            <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
              {glance.verdict.grid.map((g) => (
                <View key={g.stage} className="rounded-lg px-2.5 py-1.5" style={{ backgroundColor: '#2b2b2b' }}>
                  <Txt mono className="text-[8.5px] uppercase tracking-wide" style={{ color: '#9aa0a6' }}>{g.stage}</Txt>
                  <Txt mono weight="bold" className="text-[12px] text-white">{g.shift}</Txt>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Txt mono weight="medium" className="mt-5 text-[11px] uppercase tracking-wider text-ink-3">{glance.beforeTitle}</Txt>
      <View className="mt-2 flex-row flex-wrap justify-between">
        {glance.before.map((t) => (
          <MiniFigure key={t.label} label={t.label} value={t.value} />
        ))}
      </View>

      <Txt mono weight="medium" className="mt-4 text-[11px] uppercase tracking-wider text-ink-3">{glance.nowTitle}</Txt>
      <View className="mt-2 flex-row flex-wrap justify-between">
        {glance.now.map((t) => (
          <MiniFigure key={t.label} label={t.label} value={t.value} />
        ))}
      </View>

      <Txt mono weight="medium" className="mt-5 text-[11px] uppercase tracking-wider text-ink-3">
        Key findings · analyst write-up
      </Txt>
      <View className="mt-2" style={{ gap: 10 }}>
        {glance.findings.map((f) => (
          <View key={f.title} className="rounded-xl border border-border bg-surface p-3">
            <Txt weight="bold" className="text-[14px]">{f.title}</Txt>
            <Txt className="mt-1 text-[13px] leading-[19px] text-ink-2">{f.body}</Txt>
          </View>
        ))}
      </View>
    </View>
  );
}
