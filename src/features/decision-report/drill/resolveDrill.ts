import { compactNum } from '../verdict';
import type {
  IDecisionEdition,
  IDecisionStory,
  IDecisionStoryDetail,
  IDrillChip,
  IDrillNode,
  IDrillRecord,
} from '@/types';

// The already-loaded data a node resolves over (web: resolveDrill's IDrillContext).
export interface DrillData {
  edition: IDecisionEdition;
  story: IDecisionStory;
  detail?: IDecisionStoryDetail;
}

type Tone = 'positive' | 'neutral' | 'negative';
const toneOf = (net: number): Tone => (net < -5 ? 'negative' : net > 5 ? 'positive' : 'neutral');
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

// The four "What is it to you" metrics, ranked over the whole edition.
const METRICS: Record<
  string,
  { label: string; dir: 'desc' | 'asc'; value: (s: IDecisionStory) => string; key: (s: IDecisionStory) => number }
> = {
  sv: { label: 'Story value points', dir: 'desc', value: (s) => s.storyValuePoints.toFixed(1), key: (s) => s.storyValuePoints },
  eng: { label: 'Engagement', dir: 'desc', value: (s) => compactNum(s.weightedEngagement), key: (s) => s.weightedEngagement },
  net: { label: 'Net favorability', dir: 'asc', value: (s) => `${s.net > 0 ? '+' : ''}${s.net}`, key: (s) => s.net },
  nemo: { label: 'Negative emotion', dir: 'desc', value: (s) => `${s.negativeEmotionPct}%`, key: (s) => s.negativeEmotionPct },
};

const coverageRecord = (
  c: { rank: number; title: string; outlet: string; medium: string; date: string; storyValue: number },
  tone: Tone,
  withOutlet = true,
): IDrillRecord => ({
  id: `cov-${c.rank}`,
  kind: 'coverage',
  title: c.title,
  meta: `${withOutlet ? `${c.outlet} · ` : ''}${c.medium} · ${c.date}`,
  value: c.storyValue.toFixed(2),
  tone,
  spec: `coverage:${c.rank}`,
});

// Resolve a drill spec to a node over the already-loaded edition + story detail. Pure; no
// I/O (web: resolveDrill). Returns null for an unknown/unresolvable spec.
export function resolveDrill(spec: string, data: DrillData): IDrillNode | null {
  const { edition, story, detail } = data;
  const [kind, ...rest] = spec.split(':');
  const arg = rest.join(':');
  const tone = toneOf(story.net);

  const node = (n: Partial<IDrillNode> & Pick<IDrillNode, 'title'>): IDrillNode => ({
    spec,
    count: null,
    unit: 'item',
    reading: null,
    glance: [],
    records: [],
    chips: [],
    ...n,
  });

  switch (kind) {
    case 'metric': {
      const m = METRICS[arg];
      if (!m) return null;
      const sorted = [...edition.stories].sort((a, b) =>
        m.dir === 'asc' ? m.key(a) - m.key(b) : m.key(b) - m.key(a),
      );
      const rank = sorted.findIndex((s) => s.id === story.id) + 1;
      const records: IDrillRecord[] = sorted.map((s) => ({
        id: s.id,
        kind: 'story',
        title: s.title,
        meta: `${s.verdict.toUpperCase()} · priority ${s.priority}`,
        value: m.value(s),
        storyId: s.id,
      }));
      return node({
        title: m.label,
        count: edition.stories.length,
        unit: 'story',
        reading: `${m.label} ranks the week's ${edition.stories.length} stories. “${story.title}” is #${rank}.`,
        records,
      });
    }

    case 'outlet': {
      const outlet = detail?.outlets.find((o) => o.name === arg);
      const cov = detail?.topCoverage.filter((c) => c.outlet === arg) ?? [];
      const mediums = Array.from(new Set(cov.map((c) => c.medium)));
      const chips: IDrillChip[] = mediums.map((md) => ({
        spec: `medium:${md}`,
        label: md,
        count: cov.filter((c) => c.medium === md).length,
      }));
      if (cov.length) chips.push({ spec: `tone:${tone}`, label: `${cap(tone)} tone`, count: cov.length });
      return node({
        title: arg,
        count: outlet?.items ?? cov.length,
        unit: 'article',
        reading: outlet
          ? `${arg} ran ${outlet.items} ${outlet.items === 1 ? 'item' : 'items'} on this story, carrying story value ${outlet.storyValue.toFixed(2)}.`
          : null,
        readingSource: outlet ? 'From the outlets by story value.' : undefined,
        glance: outlet
          ? [
              { label: 'Medium', value: outlet.medium },
              { label: 'Items', value: String(outlet.items) },
              { label: 'Story value', value: outlet.storyValue.toFixed(2) },
            ]
          : [],
        records: cov.map((c) => coverageRecord(c, tone, false)),
        chips,
        empty: 'No cited coverage for this outlet.',
      });
    }

    case 'voice': {
      const v = detail?.voices.find((x) => x.name === arg);
      if (!v) return null;
      return node({
        title: v.name,
        count: null,
        unit: 'voice',
        reading: `${v.name} is a ${v.keyVoice ? 'key ' : ''}voice on ${v.platform}, with a voice score of ${v.voiceScore}.`,
        glance: [
          { label: 'Likes', value: v.likes.toLocaleString() },
          { label: 'Comments', value: v.comments.toLocaleString() },
          { label: 'Shares', value: String(v.shares) },
          { label: 'Views', value: compactNum(v.views) },
          { label: 'Engagement', value: `${v.engagementPct}%` },
          { label: 'Negative', value: `${v.negativePct}%` },
        ],
        records: [
          {
            id: `voice-${v.name}`,
            kind: 'voice',
            title: v.name,
            meta: `${v.platform} · comments under it ${v.negativePct}% negative · ${v.status}`,
            tone: v.negativePct >= 50 ? 'negative' : 'neutral',
          },
        ],
        chips: [
          {
            spec: `platform:${v.platform}`,
            label: `${v.platform} voices`,
            count: detail?.voices.filter((x) => x.platform === v.platform).length,
          },
        ],
      });
    }

    case 'coverage': {
      const c = detail?.topCoverage.find((x) => String(x.rank) === arg);
      if (!c) return null;
      return node({
        title: c.title,
        count: 1,
        unit: 'article',
        reading: `${c.outlet} · ${c.medium} · ${c.date}.`,
        readingSource: 'From the top coverage of this story.',
        glance: [
          { label: 'Story value', value: c.storyValue.toFixed(2) },
          { label: 'Tone', value: cap(tone) },
        ],
        chips: [
          { spec: `outlet:${c.outlet}`, label: c.outlet },
          { spec: `medium:${c.medium}`, label: c.medium },
          { spec: `tone:${tone}`, label: `${cap(tone)} tone` },
        ],
      });
    }

    case 'kw': {
      const hit = story.keywordHits.find((h) => h.term === arg);
      const cov = detail?.topCoverage ?? [];
      return node({
        title: arg,
        count: hit?.count ?? null,
        unit: 'mention',
        reading: `“${arg}” appears ${hit ? `${hit.count} times ` : ''}across this story's coverage.`,
        records: cov.map((c) => coverageRecord(c, tone)),
      });
    }

    case 'window': {
      const w = detail?.briefWindows.find((x) => x.label === arg);
      if (!w) return null;
      return node({
        title: `${arg} window`,
        count: w.count,
        unit: 'item',
        reading: `The ${arg} window carried ${w.count} ${w.count === 1 ? 'item' : 'items'} (${w.severity}).`,
        glance: [
          { label: 'Severity', value: cap(w.severity) },
          { label: 'Items', value: String(w.count) },
        ],
        empty: 'No items in this window.',
      });
    }

    case 'medium': {
      const cov = (detail?.topCoverage ?? []).filter((c) => c.medium === arg);
      const outlets = Array.from(new Set(cov.map((c) => c.outlet)));
      return node({
        title: arg,
        count: cov.length,
        unit: 'article',
        reading: `${cov.length} ${arg} ${cov.length === 1 ? 'article' : 'articles'} on this story.`,
        records: cov.map((c) => coverageRecord(c, tone)),
        chips: outlets.map((o) => ({ spec: `outlet:${o}`, label: o, count: cov.filter((c) => c.outlet === o).length })),
        empty: `No ${arg} coverage.`,
      });
    }

    case 'tone': {
      const cov = detail?.topCoverage ?? [];
      return node({
        title: `${cap(arg)} tone`,
        count: cov.length,
        unit: 'article',
        reading: `Coverage of this story reads ${arg} overall.`,
        records: cov.map((c) => coverageRecord(c, tone)),
      });
    }

    case 'platform': {
      const vs = (detail?.voices ?? []).filter((v) => v.platform === arg);
      return node({
        title: `${arg} voices`,
        count: vs.length,
        unit: 'voice',
        reading: `${vs.length} ${arg} ${vs.length === 1 ? 'voice' : 'voices'} in this story's reactions.`,
        records: vs.map((v) => ({
          id: `voice-${v.name}`,
          kind: 'voice',
          title: v.name,
          meta: `voice score ${v.voiceScore} · ${v.engagementPct}% of engagement`,
          spec: `voice:${v.name}`,
        })),
      });
    }

    default:
      return null;
  }
}
