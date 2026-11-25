import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { ToneBar } from '@/components/charts/ToneBar';
import { SegmentedControl } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import { BlockLabel, TabLead, WriteUpList } from './TabParts';
import type { DrillPayload } from './ClientReportDrillSheet';
import type { IReportBreakdownItem, IReportSection, IReportStory, ReportMeasure } from '@/types';

const ORIGIN_LABEL: Record<string, string> = { mm: 'Media Meter', sc: 'Scoup', rp: 'Report' };
function OriginChip({ origin }: { origin: string }) {
  return (
    <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: colors.surface3 }}>
      <Txt mono weight="medium" className="text-[8px] uppercase tracking-wide text-ink-3">
        {ORIGIN_LABEL[origin] ?? origin}
      </Txt>
    </View>
  );
}

const MEASURE_OPTS = [
  { value: 'n' as const, label: 'Articles' },
  { value: 'ave' as const, label: 'AVE' },
  { value: 'imp' as const, label: 'Impressions' },
];
const fmtCount = (n: number) => Math.round(n).toLocaleString('en-US');
const fmtPhp = (n: number) => (n >= 1e9 ? `PHP ${(n / 1e9).toFixed(1)}B` : `PHP ${(n / 1e6).toFixed(1)}M`);
const fmtCompact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(Math.round(n)));
const valueOf = (it: IReportBreakdownItem, m: ReportMeasure) => (m === 'ave' ? it.ave : m === 'imp' ? it.imp : it.n);
const fmtMeasure = (v: number, m: ReportMeasure) => (m === 'ave' ? fmtPhp(v) : m === 'imp' ? fmtCompact(v) : fmtCount(v));
const measureWord = (m: ReportMeasure) => (m === 'ave' ? 'AVE' : m === 'imp' ? 'impressions' : 'articles');

function Intro({ children }: { children: string }) {
  return <Txt className="mb-3 text-[13px] leading-[19px] text-ink-3">{children}</Txt>;
}

// Renders any long-tail report tab from its seeded section (web: the per-tab components). One
// component covers breakdown / timeline / tone-and-issues / actions / summary / how-to-read.
export function ReportSectionView({
  section,
  measure,
  onMeasureChange,
  stories,
  onDrill,
}: {
  section: IReportSection;
  measure: ReportMeasure;
  onMeasureChange: (m: ReportMeasure) => void;
  stories: IReportStory[];
  onDrill: (p: DrillPayload) => void;
}) {
  const items = section.items ?? [];
  // Breakdown re-ranks by the chosen measure; timeline stays chronological.
  const ranked = useMemo(() => {
    if (!section.measurable || section.kind === 'timeline') return items;
    return [...items].sort((a, b) => valueOf(b, measure) - valueOf(a, measure));
  }, [items, measure, section.measurable, section.kind]);
  const effMeasure: ReportMeasure = section.measurable ? measure : 'n';
  const max = Math.max(...ranked.map((it) => valueOf(it, effMeasure)), 1);

  if (section.kind === 'actions' || section.kind === 'summary' || section.kind === 'howToRead') {
    return (
      <View>
        {section.lead || section.readMore ? (
          <TabLead lead={section.lead} sub={section.readMore} />
        ) : (
          <Intro>{section.intro}</Intro>
        )}

        {/* Structured recommendation cards (Actions) */}
        {section.actionCards?.length ? (
          <View style={{ gap: 10 }}>
            {section.actionCards.map((a, i) => (
              <View key={i} className="rounded-xl border border-border bg-surface p-3.5">
                <Txt mono weight="medium" className="text-[9.5px] uppercase tracking-wide text-ink-3">
                  {i + 1} · Analyst write-up · {a.source}
                </Txt>
                <Txt weight="bold" className="mt-1 text-[14px] leading-[19px]">{a.title}</Txt>
                <View className="mt-2.5" style={{ gap: 7 }}>
                  {a.rows.map((r) => (
                    <View key={r.term}>
                      <Txt mono weight="medium" className="text-[9px] uppercase tracking-wide text-ink-3">{r.term}</Txt>
                      <Txt className="mt-0.5 text-[13px] leading-[18px] text-ink-2">{r.detail}</Txt>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* How to read: source term → Scoup metric */}
        {section.termMap?.length ? (
          <View>
            <BlockLabel>Source report term → Scoup metric</BlockLabel>
            <View className="rounded-xl border border-border bg-surface">
            {section.termMap.map((t, i) => (
              <View key={t.term} className={`px-3.5 py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}>
                <View className="flex-row flex-wrap items-center" style={{ gap: 6 }}>
                  <Txt weight="semibold" className="text-[13px] text-ink">{t.term}</Txt>
                  <Txt className="text-[13px] text-ink-3">→</Txt>
                  <Txt weight="semibold" className="text-[13px]" style={{ color: colors.link }}>{t.metric}</Txt>
                  <OriginChip origin={t.origin} />
                </View>
                <Txt className="mt-0.5 text-[12px] leading-[17px] text-ink-3">{t.rule}</Txt>
              </View>
            ))}
            </View>
          </View>
        ) : null}

        {section.glossary?.length ? (
          <View className="mt-5">
            <BlockLabel>Glossary from the source report</BlockLabel>
            <View className="rounded-xl border border-border bg-surface">
              {section.glossary.map((g, i) => (
                <View key={g.term} className={`px-3.5 py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}>
                  <Txt weight="semibold" className="text-[13px]">{g.term}</Txt>
                  <Txt className="mt-0.5 text-[12px] leading-[17px] text-ink-3">{g.meaning}</Txt>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {section.method?.length ? (
          <View className="mt-5">
            <BlockLabel>How the source review was built</BlockLabel>
            <View style={{ gap: 10 }}>
              {section.method.map((m) => (
                <View key={m.title} className="rounded-xl border border-border bg-surface p-3.5">
                  <Txt weight="bold" className="text-[14px]">{m.title}</Txt>
                  {m.paras.map((p, i) => (
                    <Txt key={i} className="mt-1 text-[13px] leading-[19px] text-ink-2">{p}</Txt>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Legacy simple bullets (e.g. PH-auto summary) */}
        {!section.actionCards && !section.termMap && section.bullets?.length ? (
          <View style={{ gap: 10 }}>
            {section.bullets.map((b) => (
              <View key={b.title} className="rounded-xl border border-border bg-surface p-3.5">
                <View className="flex-row items-center" style={{ gap: 7 }}>
                  <View className="size-1.5 rounded-full" style={{ backgroundColor: colors.link }} />
                  <Txt weight="semibold" className="text-[14px]">{b.title}</Txt>
                </View>
                <Txt className="mt-1 text-[13px] leading-[19px] text-ink-2">{b.body}</Txt>
              </View>
            ))}
          </View>
        ) : null}

        {section.writeups?.length ? (
          <View className="mt-4">
            <WriteUpList writeups={section.writeups} />
          </View>
        ) : null}
      </View>
    );
  }

  const Bars = (
    <View style={{ gap: 11 }}>
      {ranked.map((it) => {
        const v = valueOf(it, effMeasure);
        const row = (
          <>
            <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
              <Txt weight="medium" className="flex-1 text-[13px]" numberOfLines={1}>{it.label}</Txt>
              <Txt mono weight="bold" className="text-[12px] text-ink">{fmtMeasure(v, effMeasure)}</Txt>
            </View>
            <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface3">
              <View className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, backgroundColor: it.color ?? colors.link }} />
            </View>
          </>
        );
        return section.kind === 'timeline' ? (
          <View key={it.label}>{row}</View>
        ) : (
          <Pressable
            key={it.label}
            onPress={() => onDrill({ title: it.label, sub: `${fmtMeasure(v, effMeasure)} ${measureWord(effMeasure)}`, stories })}
            accessibilityRole="button"
            className="active:opacity-70">
            {row}
          </Pressable>
        );
      })}
    </View>
  );

  if (section.kind === 'toneIssues') {
    const t = section.tone ?? { pos: 0, neu: 0, neg: 0 };
    const total = t.pos + t.neu + t.neg || 1;
    const share = (n: number) => ({ pct: Math.round((n / total) * 100), count: n });
    const net = Math.round(((t.pos - t.neg) / total) * 100);
    return (
      <View>
        <Intro>{section.intro}</Intro>
        <ToneBar positive={share(t.pos)} neutral={share(t.neu)} negative={share(t.neg)} />
        <View className="my-4 rounded-xl border border-border bg-surface p-3">
          <Txt weight="semibold" className="text-[13px]">Net tone {net >= 0 ? '+' : ''}{net}</Txt>
          <Txt className="mt-0.5 text-[12px] text-ink-3">{total} tagged articles · {Math.round((t.neg / total) * 100)}% negative</Txt>
        </View>
        <Txt mono weight="medium" className="mb-2 text-[11px] uppercase tracking-wide text-ink-3">By issue</Txt>
        {Bars}
      </View>
    );
  }

  // breakdown / timeline
  return (
    <View>
      <Intro>{section.intro}</Intro>
      {section.measurable && (
        <View className="mb-4">
          <SegmentedControl options={MEASURE_OPTS} value={measure} onChange={onMeasureChange} />
        </View>
      )}
      {Bars}
    </View>
  );
}
