import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Chip, LensToggle } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { colors, sentiment } from '@/theme/tokens';
import { BlockLabel, TabLead, WriteUpCard, WriteUpList } from './TabParts';
import {
  ChartCard,
  CompareBox,
  DataTable,
  DotTimeline,
  RankedBars,
  ReportColumnChart,
  ReportLineChart,
  ReportStackedColumn,
  ReportStackedRows,
  Sparkline,
} from './ReportCharts';
import type { DrillPayload } from './ClientReportDrillSheet';
import type { IEdcom2TabData, IReportIssue } from '@/types';

const TONE = { pos: sentiment.positive, neu: colors.ink3, neg: sentiment.negative };
const TONE_BG = { pos: '#e9f7f0', neu: colors.surface3, neg: '#fde7e5' };
const TONE_LABEL = { pos: 'Positive', neu: 'Neutral', neg: 'Negative' };
const CHANNEL_SERIES = [
  { label: 'Online', color: '#1e4fa8' },
  { label: 'Print', color: '#eda100' },
  { label: 'Broadcast', color: '#7c3aed' },
];
const STAGE_COLORS = ['#1e4fa8', '#eb6834', '#7c3aed', '#159d72'];
const SHORT_STAGE = ['Diag', 'Press', 'Legis', 'Impl'];
const TONE_SERIES = [
  { label: 'Positive', color: sentiment.positive },
  { label: 'Neutral', color: colors.ink3 },
  { label: 'Negative', color: sentiment.negative },
];

function ToneTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="mb-2 w-[48%] rounded-xl border border-border bg-surface p-3">
      <Txt mono className="text-[9px] uppercase tracking-wide text-ink-3">{label}</Txt>
      <Txt weight="bold" className="mt-0.5 text-[17px]">{value}</Txt>
      {sub ? <Txt className="mt-0.5 text-[10px] text-ink-3">{sub}</Txt> : null}
    </View>
  );
}
const READ: Record<IReportIssue['read'], { label: string; bg: string; fg: string }> = {
  above: { label: 'Above usual', bg: '#e9f7f0', fg: '#0f7a52' },
  within: { label: 'Within', bg: colors.surface3, fg: colors.ink3 },
  below: { label: 'Below usual', bg: '#fde7e5', fg: '#c0492f' },
  few: { label: 'Too few', bg: colors.surface3, fg: colors.ink3 },
};
const fmtChange = (p: number) => (Math.abs(p) < 0.5 ? '—' : `${p > 0 ? '▲' : '▼'}${Math.abs(Math.round(p))}%`);
const changeColor = (p: number) => (Math.abs(p) < 0.5 ? colors.ink3 : p > 0 ? '#0f7a52' : '#c0492f');
const fmtPhp = (n: number) => `PHP ${(n / 1e6).toFixed(1)}M`;

function SubHead({ children }: { children: string }) {
  return <Txt className="mb-3 text-[13px] leading-[19px] text-ink-3">{children}</Txt>;
}

export function Edcom2Tabs({
  data,
  tab,
  onDrill,
}: {
  data: IEdcom2TabData;
  tab: string;
  onDrill: (p: DrillPayload) => void;
}) {
  const [issueIdx, setIssueIdx] = useState(0);
  const [toneMode, setToneMode] = useState<'objective' | 'persona'>('objective');

  if (tab === 'yoy') {
    const yoy = data.yoy;
    return (
      <View style={{ gap: 14 }}>
        <TabLead lead={yoy.lead} sub={yoy.sub} />
        {yoy.writeup ? <WriteUpCard writeup={yoy.writeup} /> : null}
        <ChartCard
          title="Articles by month, 2025 against 2026"
          chart={<ReportLineChart rows={yoy.rows} />}
          table={
            <DataTable
              columns={['Month', '2025', '2026', 'Change']}
              rows={yoy.rows.map((r) => [r.month, r.earlier, r.later, fmtChange(r.changePct)])}
            />
          }
        />
        <View style={{ gap: 10 }}>
          {yoy.compare.map((c) => (
            <CompareBox key={c.title} card={c} />
          ))}
        </View>
        <ChartCard
          title="Month by month"
          initialView="table"
          chart={<Txt className="text-[12px] text-ink-3">Switch to Table for the full month-by-month figures.</Txt>}
          table={
            <DataTable
              columns={['Month', 'Articles', 'AVE', 'AVE/art', 'Outlets', 'Bcast %', 'Main focus', 'Neg tone', 'Impr.', 'Biggest story']}
              rows={yoy.monthTable.map((m) => [
                m.month,
                m.articles,
                m.ave,
                m.avePerArticle,
                m.outlets,
                m.broadcastShare,
                m.mainFocus,
                m.negTone,
                m.impressions,
                m.biggestStory,
              ])}
            />
          }
        />
      </View>
    );
  }

  if (tab === 'issues') {
    const sel = data.issueSeries[issueIdx] ?? data.issueSeries[0];
    return (
      <View style={{ gap: 14 }}>
        <TabLead lead={data.issuesLead} sub={data.issuesSub} />

        {/* Ranked issue list — read band, 20-month sparkline, prev→now, change, share, tone split */}
        <View style={{ gap: 13 }}>
          {data.issues.map((iss) => {
            const read = READ[iss.read];
            return (
              <Pressable
                key={iss.key}
                onPress={() => onDrill({ title: iss.label, sub: `${iss.count} articles · usual ${iss.lo}–${iss.hi}`, stories: data.stories })}
                accessibilityRole="button"
                className="active:opacity-70">
                <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                  <Txt weight="medium" className="flex-1 text-[13px]" numberOfLines={1}>{iss.label}</Txt>
                  <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: read.bg }}>
                    <Txt weight="semibold" className="text-[9.5px]" style={{ color: read.fg }}>{read.label}</Txt>
                  </View>
                  <Txt mono weight="bold" className="w-8 text-right text-[12px] text-ink">{iss.count}</Txt>
                </View>
                <View className="mt-1 flex-row items-center" style={{ gap: 8 }}>
                  <Sparkline series={iss.series} prevYear={iss.prevYear} />
                  <Txt mono className="text-[11px] text-ink-3">{iss.prevYear} → {iss.count}</Txt>
                  <Txt mono weight="semibold" className="text-[11px]" style={{ color: changeColor(iss.change) }}>{fmtChange(iss.change)}</Txt>
                  <Txt className="text-[11px] text-ink-3">· {iss.share}%</Txt>
                </View>
                <View className="mt-1.5 h-1.5 flex-row overflow-hidden rounded-full">
                  <View style={{ flex: Math.max(iss.tone.pos, 0.01), backgroundColor: sentiment.positive }} />
                  <View style={{ flex: Math.max(iss.tone.neu, 0.01), backgroundColor: colors.ink3 }} />
                  <View style={{ flex: Math.max(iss.tone.neg, 0.01), backgroundColor: sentiment.negative }} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Single-issue deep chart with an issue picker */}
        {sel ? (
          <ChartCard
            title={`${sel.label} — articles by month`}
            chart={
              <View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0 }}
                  contentContainerStyle={{ gap: 8, paddingBottom: 10, alignItems: 'center' }}>
                  {data.issueSeries.map((s, i) => (
                    <Chip key={s.key} label={s.label} active={i === issueIdx} onPress={() => setIssueIdx(i)} />
                  ))}
                </ScrollView>
                <ReportColumnChart months={sel.months} />
              </View>
            }
          />
        ) : null}

        <WriteUpList writeups={data.issuesWriteups} />
      </View>
    );
  }

  if (tab === 'stories') {
    const peakIdx = data.dayChannels.findIndex((c) => c.day === data.peakDay);
    const events = data.dayChannels.filter((c) => c.event);
    const ranked = [...data.stories].sort((a, b) => b.ave - a.ave);
    const maxAve = Math.max(...ranked.map((s) => s.ave), 1);
    return (
      <View style={{ gap: 14 }}>
        <TabLead lead={data.storiesLead} sub={data.storiesSub} />
        <WriteUpList writeups={data.storiesWriteups} />

        {/* Day × channel chart + event pills */}
        <ChartCard
          title={`Coverage peaked on ${data.peakDay}`}
          chart={
            <View>
              <ReportStackedColumn
                rows={data.dayChannels.map((c) => ({ label: c.day, parts: [c.online, c.print, c.broadcast] }))}
                series={CHANNEL_SERIES}
                peakIndex={peakIdx}
              />
              {events.length ? (
                <View className="mt-2 flex-row flex-wrap" style={{ gap: 6 }}>
                  {events.map((e) => (
                    <View key={e.day} className="rounded-full bg-surface3 px-2.5 py-1">
                      <Txt className="text-[11px] text-ink-2">{e.day} · {e.event}</Txt>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          }
          table={
            <DataTable
              columns={['Day', 'Online', 'Print', 'Bcast', 'AVE', 'Event']}
              rows={data.dayChannels.map((c) => [c.day.replace(/^\w+ /, ''), c.online, c.print, c.broadcast, c.ave, c.event ?? '—'])}
            />
          }
        />

        {/* Biggest stories — rank, title, why, value bar, outlets, pattern, tone, issue */}
        <View>
          <BlockLabel>Biggest stories</BlockLabel>
          <View style={{ gap: 12 }}>
            {ranked.map((s, i) => (
              <Pressable
                key={s.id}
                onPress={() => onDrill({ title: 'Top stories', stories: data.stories, focusId: s.id })}
                accessibilityRole="button"
                className="active:opacity-70">
                <View className="flex-row items-start" style={{ gap: 8 }}>
                  <Txt mono weight="bold" className="w-5 pt-0.5 text-[12px] text-ink-3">{i + 1}</Txt>
                  <View className="min-w-0 flex-1">
                    <Txt weight="semibold" numberOfLines={2} className="text-[13px] leading-[18px]">{s.title}</Txt>
                    {s.why ? <Txt className="mt-0.5 text-[11px] leading-[16px] text-ink-3">{s.why}</Txt> : null}
                    <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface3">
                      <View className="h-full rounded-full" style={{ width: `${(s.ave / maxAve) * 100}%`, backgroundColor: colors.link }} />
                    </View>
                    <View className="mt-1.5 flex-row flex-wrap items-center" style={{ gap: 6 }}>
                      <Txt mono weight="semibold" className="text-[11px] text-ink">{fmtPhp(s.ave)}</Txt>
                      <Txt className="text-[11px] text-ink-3">· {s.outlets} outlets</Txt>
                      {s.pattern ? (
                        <View className="rounded-full bg-surface3 px-2 py-0.5"><Txt className="text-[9.5px] text-ink-2">{s.pattern}</Txt></View>
                      ) : null}
                      <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: TONE_BG[s.tone] }}>
                        <Txt weight="semibold" className="text-[9.5px]" style={{ color: TONE[s.tone] }}>{TONE_LABEL[s.tone]}</Txt>
                      </View>
                      {s.issue ? <Txt className="text-[11px] text-ink-3">· {s.issue}</Txt> : null}
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* When each story ran — dot-timeline */}
        <View>
          <BlockLabel>When each story ran</BlockLabel>
          <View className="rounded-xl border border-border bg-surface p-3">
            <DotTimeline days={data.dayChannels.map((c) => c.day)} stories={data.stories} />
          </View>
        </View>

        {/* Which stories moved each issue */}
        <ChartCard
          title="Which stories moved each issue"
          initialView="table"
          chart={<Txt className="text-[12px] text-ink-3">Switch to Table for the issue-by-issue drivers.</Txt>}
          table={
            <DataTable
              columns={['Issue', 'Count', 'Change', 'Biggest now', 'A year earlier', 'What moved it']}
              rows={data.movedIssues.map((m) => [m.issue, m.count, fmtChange(m.change), m.biggestNow, m.biggestBefore, m.moved])}
            />
          }
        />
      </View>
    );
  }

  if (tab === 'stage') {
    const st = data.stage;
    return (
      <View style={{ gap: 14 }}>
        <TabLead lead={st.lead} sub={st.sub} />
        <ChartCard
          title="Stage of each month’s headlines"
          note={st.note}
          chart={<ReportStackedRows rows={st.rows} series={st.stageNames.map((n, i) => ({ label: n, color: STAGE_COLORS[i] }))} />}
          table={
            <DataTable
              columns={['Month', ...SHORT_STAGE]}
              rows={st.rows.map((r) => [r.label, ...r.parts.map((p) => `${p}%`)])}
            />
          }
        />
        {st.writeup ? <WriteUpCard writeup={st.writeup} /> : null}
      </View>
    );
  }

  if (tab === 'credit') {
    const cr = data.credit;
    return (
      <View style={{ gap: 14 }}>
        <TabLead lead={cr.lead} sub={cr.sub} />
        <ChartCard
          title="Who is in the headline — EDCOM 2 against DepEd"
          chart={<ReportLineChart rows={cr.line} labels={{ earlier: 'DepEd', later: 'EDCOM 2' }} />}
          table={<DataTable columns={['Month', 'DepEd', 'EDCOM 2']} rows={cr.line.map((r) => [r.month, `${r.earlier}%`, `${r.later}%`])} />}
        />
        <ChartCard
          title="Main subject against mention, by month"
          chart={
            <ReportStackedRows
              rows={cr.focus}
              series={[
                { label: 'Main focus', color: colors.link },
                { label: 'Mention', color: '#c7d4ea' },
              ]}
            />
          }
          table={<DataTable columns={['Month', 'Main focus', 'Mention']} rows={cr.focus.map((r) => [r.label, `${r.parts[0]}%`, `${r.parts[1]}%`])} />}
        />
        <WriteUpList writeups={cr.writeups} />
      </View>
    );
  }

  if (tab === 'voices') {
    const v = data.voices;
    const voiceTable = (items: typeof v.individuals) =>
      items.map((it) => [it.label, it.prev ?? '—', it.tick ?? '—', it.value]);
    return (
      <View style={{ gap: 14 }}>
        <TabLead lead={v.lead} sub={v.sub} />
        <ChartCard
          title="Individuals"
          chart={<RankedBars items={v.individuals} legend />}
          table={<DataTable columns={['Name', 'A yr ago', '12-mo avg', 'This mo']} rows={voiceTable(v.individuals)} />}
        />
        <ChartCard
          title="Groups and institutions"
          chart={<RankedBars items={v.institutions} legend />}
          table={<DataTable columns={['Name', 'A yr ago', '12-mo avg', 'This mo']} rows={voiceTable(v.institutions)} />}
        />
        {v.writeup ? <WriteUpCard writeup={v.writeup} /> : null}
      </View>
    );
  }

  if (tab === 'channels') {
    const ch = data.channels;
    return (
      <View style={{ gap: 14 }}>
        <TabLead lead={ch.lead} sub={ch.sub} />
        <ChartCard
          title="Channel mix — this month against last year"
          chart={<ReportStackedRows rows={ch.mix} series={CHANNEL_SERIES} />}
          table={
            <DataTable
              columns={['Measure', 'Online', 'Print', 'Bcast']}
              rows={ch.mix.map((r) => [r.label, r.parts[0], r.parts[1], r.parts[2]])}
            />
          }
        />
        <View>
          <BlockLabel>What each channel carried</BlockLabel>
          <View style={{ gap: 12 }}>
            {ch.byChannel.map((c) => {
              const max = Math.max(...c.items.map((it) => it.value), 1);
              return (
                <View key={c.channel}>
                  <Txt weight="semibold" className="text-[12px] text-ink-2">{c.channel}</Txt>
                  <View className="mt-1.5" style={{ gap: 7 }}>
                    {c.items.map((it) => (
                      <View key={it.label}>
                        <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                          <Txt numberOfLines={1} className="flex-1 text-[12px] text-ink">{it.label}</Txt>
                          <Txt mono weight="semibold" className="text-[11px] text-ink">{it.value}</Txt>
                        </View>
                        <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface3">
                          <View className="h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, backgroundColor: colors.link }} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        <ChartCard
          title="Articles by channel, month by month"
          chart={<ReportStackedColumn rows={ch.months} series={CHANNEL_SERIES} />}
          table={
            <DataTable
              columns={['Month', 'Online', 'Print', 'Bcast']}
              rows={ch.months.map((r) => [r.label, r.parts[0], r.parts[1], r.parts[2]])}
            />
          }
        />
        {ch.writeup ? <WriteUpCard writeup={ch.writeup} /> : null}
      </View>
    );
  }

  if (tab === 'tone') {
    const tt = data.toneTab;
    const cur = toneMode === 'persona' ? tt.persona : tt.objective;
    const total = cur.pos + cur.neu + cur.neg || 1;
    const net = Math.round(((cur.pos - cur.neg) / total) * 100);
    const negShare = Math.round((cur.neg / total) * 100);
    const verdict = net > 5 ? 'Mostly positive' : net < -5 ? 'Mostly negative' : 'Mixed';
    const negStories = data.stories.filter((s) => s.tone === 'neg');
    return (
      <View style={{ gap: 14 }}>
        <TabLead lead={toneMode === 'persona' ? tt.personaLead : tt.objectiveLead} sub={tt.sub} />
        <View style={{ width: 230 }}>
          <LensToggle
            options={[
              { value: 'objective' as const, label: 'Objective' },
              { value: 'persona' as const, label: 'Persona aligned' },
            ]}
            value={toneMode}
            onChange={setToneMode}
          />
        </View>

        <View className="flex-row flex-wrap justify-between">
          <ToneTile label="Verdict" value={verdict} />
          <ToneTile label="Net tone" value={`${net >= 0 ? '+' : ''}${net}`} sub={`was ${tt.prevNet >= 0 ? '+' : ''}${tt.prevNet} a year ago`} />
          <ToneTile label="Negative share" value={`${negShare}%`} sub={`${negShare - tt.prevNegShare >= 0 ? '+' : ''}${negShare - tt.prevNegShare} pts on last year`} />
          <ToneTile label={toneMode === 'persona' ? 'Toward EDCOM 2' : 'Tonality'} value={`${cur.pos} / ${cur.neu} / ${cur.neg}`} sub="pos / neu / neg" />
        </View>

        <ChartCard
          title="Tone by month"
          chart={<ReportStackedRows rows={tt.byMonth} series={TONE_SERIES} />}
          table={<DataTable columns={['Month', 'Pos', 'Neu', 'Neg']} rows={tt.byMonth.map((r) => [r.label, r.parts[0], r.parts[1], r.parts[2]])} />}
        />
        <ChartCard
          title="Tone by issue"
          chart={<ReportStackedRows rows={tt.byIssue} series={TONE_SERIES} />}
          table={<DataTable columns={['Issue', 'Pos', 'Neu', 'Neg']} rows={tt.byIssue.map((r) => [r.label, r.parts[0], r.parts[1], r.parts[2]])} />}
        />

        {negStories.length > 0 ? (
          <Pressable
            onPress={() => onDrill({ title: 'Negative coverage', sub: `${negStories.length} negative stories`, stories: negStories })}
            accessibilityRole="button"
            className="flex-row items-center justify-between rounded-xl border border-border bg-surface2 px-3 py-2.5 active:opacity-70">
            <Txt weight="medium" className="text-[13px] text-ink-2">See what’s driving the negative share</Txt>
            <Txt weight="bold" className="text-[13px]" style={{ color: sentiment.negative }}>{negStories.length} ›</Txt>
          </Pressable>
        ) : null}

        {tt.writeup ? <WriteUpCard writeup={tt.writeup} /> : null}
      </View>
    );
  }

  return null;
}
