// Client Reports mock — the Media Meter → Reports client-report viewer (web:
// src/features/media-meter/reports + utils/clientReports). Two reports: EDCOM 2 (year-on-year,
// 8 reported months) and PH automotive (market report). Deterministic, read-only; the heavy
// desktop figure generators are collapsed to seeded values that match the prototype's shell.
import type {
  ClientReportId,
  IClientReportCard,
  IClientReportDetail,
  IReportFigure,
  IReportPill,
  IReportTabDef,
} from '@/types';

// ─── Formatting (web: utils/clientReports/metrics) ─────────────────────────────
const fmtCount = (n: number) => Math.round(n).toLocaleString('en-US');
const fmtPhp = (n: number) => {
  const m = n / 1e6;
  return m >= 1000 ? `PHP ${(m / 1000).toFixed(1)}B` : `PHP ${m.toFixed(1)}M`;
};
const fmtCompact = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(Math.round(n));
const pctChange = (now: number, then: number) => (then ? ((now - then) / then) * 100 : 0);
const fmtChange = (pct: number): string => {
  if (Math.abs(pct) < 0.5) return '—';
  return `${pct > 0 ? '▲' : '▼'}${Math.abs(Math.round(pct))}%`;
};
const changeTone = (pct: number): 'up' | 'down' | 'flat' => (Math.abs(pct) < 0.5 ? 'flat' : pct > 0 ? 'up' : 'down');
const toneVerdict = ([pos, neu, neg]: [number, number, number]) => {
  const total = pos + neu + neg || 1;
  const net = ((pos - neg) / total) * 100;
  return { verdict: net > 5 ? 'Mostly positive' : net < -5 ? 'Mostly negative' : 'Mixed', net, negShare: (neg / total) * 100 };
};
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sd = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(mean(a.map((v) => (v - m) ** 2)));
};

// ─── EDCOM 2 ───────────────────────────────────────────────────────────────────
const EDCOM2_TABS: IReportTabDef[] = [
  { key: 'glance', label: 'At a glance' },
  { key: 'yoy', label: 'Year on year' },
  { key: 'issues', label: 'Issues' },
  { key: 'stories', label: 'Stories' },
  { key: 'stage', label: 'Headline stage' },
  { key: 'credit', label: 'Credit' },
  { key: 'voices', label: 'Voices' },
  { key: 'channels', label: 'Channels' },
  { key: 'tone', label: 'Tone' },
  { key: 'actions', label: 'Actions' },
  { key: 'read', label: 'How to read this' },
];

type Edcom2Row = {
  key: string;
  label: string;
  art: number;
  ly: number; // same month, a year earlier
  ave: number; // in millions of pesos
  impr: number;
  outlets: number;
  focus: number; // main-focus share, %
  tone: [number, number, number];
};
// Oldest → newest; August pinned to the prototype's headline (490 articles, +46%, ₱805.8M).
const EDCOM2_ROWS: Edcom2Row[] = [
  { key: '2026-01', label: 'January 2026', art: 212, ly: 168, ave: 398.4, impr: 3_900_000, outlets: 54, focus: 58, tone: [34, 150, 28] },
  { key: '2026-02', label: 'February 2026', art: 248, ly: 196, ave: 441.0, impr: 4_300_000, outlets: 61, focus: 60, tone: [41, 176, 31] },
  { key: '2026-03', label: 'March 2026', art: 301, ly: 233, ave: 512.7, impr: 5_100_000, outlets: 68, focus: 62, tone: [52, 208, 41] },
  { key: '2026-04', label: 'April 2026', art: 276, ly: 241, ave: 489.3, impr: 4_800_000, outlets: 64, focus: 59, tone: [44, 196, 36] },
  { key: '2026-05', label: 'May 2026', art: 333, ly: 252, ave: 566.1, impr: 5_600_000, outlets: 72, focus: 63, tone: [58, 228, 47] },
  { key: '2026-06', label: 'June 2026', art: 358, ly: 289, ave: 612.4, impr: 6_000_000, outlets: 76, focus: 64, tone: [61, 244, 53] },
  { key: '2026-07', label: 'July 2026', art: 421, ly: 305, ave: 704.9, impr: 6_900_000, outlets: 81, focus: 66, tone: [72, 286, 63] },
  { key: '2026-08', label: 'August 2026', art: 490, ly: 336, ave: 805.8, impr: 7_800_000, outlets: 88, focus: 68, tone: [86, 330, 74] },
];
const EDCOM2_MONTHS = EDCOM2_ROWS.map((r) => ({ key: r.key, label: r.label }));

// The full 20-month timeline behind the year-on-year framing (Jan 2025 → Aug 2026). The first
// eight 2025 values are the reported months' year-earlier counts; Sep–Dec 2025 extend the trend.
// Used only for the "of N months" denominators + ranking (not shown as selectable months).
const TIMELINE_2025 = [168, 196, 233, 241, 252, 289, 305, 336, 355, 361, 377, 392]; // Jan–Dec 2025
const TIMELINE_ART = [...TIMELINE_2025, ...EDCOM2_ROWS.map((r) => r.art)]; // 20 months, oldest-first
const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
];
const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

// EDCOM 2's education issue tags (web: data.issues) — a base share of the month's articles.
const ISSUE_POOL = [
  { key: 'learning', label: 'Learning poverty', share: 0.2 },
  { key: 'teachers', label: 'Teacher welfare', share: 0.17 },
  { key: 'budget', label: 'Budget & funding', share: 0.15 },
  { key: 'matatag', label: 'MATATAG curriculum', share: 0.13 },
  { key: 'infra', label: 'School infrastructure', share: 0.11 },
  { key: 'ched', label: 'Higher ed (CHED)', share: 0.1 },
  { key: 'tesda', label: 'TVET (TESDA)', share: 0.08 },
  { key: 'governance', label: 'Governance', share: 0.06 },
];
// Sample headlines behind the figures (web: edcom2Drills). Tone + outlet are fixed per story.
const STORY_POOL: Array<{ title: string; outlet: string; tone: 'pos' | 'neu' | 'neg'; snippet: string }> = [
  { title: 'EDCOM 2 flags deepening learning poverty in new report', outlet: 'Philippine Daily Inquirer', tone: 'neg', snippet: 'The commission warned that reading and numeracy gaps have widened, urging faster remediation across public schools.' },
  { title: 'Lawmakers push bigger education budget for 2027', outlet: 'Philippine Star', tone: 'pos', snippet: 'Legislators backed EDCOM 2’s call to front-load spending on teachers and classrooms in next year’s outlay.' },
  { title: 'Teacher groups renew call for higher base pay', outlet: 'Rappler', tone: 'neu', snippet: 'Unions cited workload and inflation; DepEd said a review of the salary schedule is underway.' },
  { title: 'MATATAG rollout reaches more regions, DepEd says', outlet: 'GMA News Online', tone: 'pos', snippet: 'Officials reported broader adoption of the streamlined curriculum, with teacher training scaled up.' },
  { title: 'Classroom shortage persists ahead of school opening', outlet: 'ABS-CBN News', tone: 'neg', snippet: 'Backlogs in construction and procurement left several divisions short of rooms for the incoming term.' },
  { title: 'CHED reviews higher-education quality standards', outlet: 'BusinessWorld', tone: 'neu', snippet: 'The review follows EDCOM 2 recommendations on program accreditation and outcomes tracking.' },
  { title: 'TESDA expands tech-voc scholarships nationwide', outlet: 'Manila Bulletin', tone: 'pos', snippet: 'New slots target in-demand trades, part of the push to align skills with industry needs.' },
  { title: 'EDCOM 2 urges faster action on reform roadmap', outlet: 'Philippine Daily Inquirer', tone: 'neu', snippet: 'The commission pressed agencies to hit milestones on the decade-long education reform agenda.' },
];

// Per-story extras (outlets / coverage pattern / issue / "why it travelled"), parallel to STORY_POOL.
const STORY_META = [
  { outlets: 16, pattern: 'Spike', issue: 'Learning poverty', why: 'A single report landed across online and broadsheet within hours.' },
  { outlets: 14, pattern: 'Recurring', issue: 'Budget & funding', why: 'Tracked the budget calendar, resurfacing on each committee hearing.' },
  { outlets: 9, pattern: 'Steady', issue: 'Teacher welfare', why: 'Union statements kept it running at a low, steady level all month.' },
  { outlets: 11, pattern: 'Steady', issue: 'MATATAG curriculum', why: 'DepEd field updates gave it a steady stream of regional pickups.' },
  { outlets: 13, pattern: 'Spike', issue: 'School infrastructure', why: 'Peaked around the school-opening cycle, then faded.' },
  { outlets: 7, pattern: 'Steady', issue: 'Higher ed (CHED)', why: 'A policy-process story with modest but sustained online interest.' },
  { outlets: 10, pattern: 'Spike', issue: 'TVET (TESDA)', why: 'A scholarship announcement drove a one-day spike across outlets.' },
];

const VOICE_PEOPLE = [
  { name: 'Sen. Sonny Angara', base: 64 },
  { name: 'DepEd Secretary', base: 58 },
  { name: 'EDCOM 2 co-chair', base: 49 },
  { name: 'Rep. Roman Romulo', base: 41 },
  { name: 'CHED chairperson', base: 33 },
];
const VOICE_INST = [
  { name: 'EDCOM 2', base: 210 },
  { name: 'DepEd', base: 158 },
  { name: 'CHED', base: 86 },
  { name: 'Congress', base: 74 },
  { name: 'Teacher groups', base: 52 },
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const edcom2TabData = (idx: number): import('@/types').IEdcom2TabData => {
  const row = EDCOM2_ROWS[idx];
  const short = MONTH_SHORT[idx];
  const lyLabel = row.label.replace('2026', '2025');
  const tIndex = 12 + idx; // position in the 20-month timeline

  // Issues — 2 above, 5 within, 1 below usual range + 20-month history, prev-year, change, share, tone.
  const issues = ISSUE_POOL.map((iss, i) => {
    const count = Math.max(1, Math.round(row.art * iss.share));
    const read = (i < 2 ? 'above' : i < 7 ? 'within' : 'below') as 'above' | 'within' | 'below';
    const [lo, hi] =
      read === 'above'
        ? [Math.round(count * 0.6), Math.round(count * 0.85)]
        : read === 'below'
          ? [Math.round(count * 1.15), Math.round(count * 1.4)]
          : [Math.round(count * 0.85), Math.round(count * 1.15)];
    const series = TIMELINE_ART.slice(0, tIndex + 1).map((a, mi) =>
      Math.max(0, Math.round(a * iss.share * (0.82 + ((mi * 7 + i * 13) % 11) / 30))),
    );
    const prevYear = Math.max(1, Math.round(row.ly * iss.share));
    const tot = row.tone[0] + row.tone[1] + row.tone[2];
    const tiltNeg = read === 'above' ? 1.25 : 1;
    return {
      key: iss.key,
      label: iss.label,
      count,
      read,
      lo,
      hi,
      series,
      prevYear,
      change: pctChange(count, prevYear),
      share: Math.round((count / row.art) * 100),
      tone: {
        pos: Math.round((count * row.tone[0]) / tot),
        neu: Math.round((count * row.tone[1]) / tot),
        neg: Math.round(((count * row.tone[2]) / tot) * tiltNeg),
      },
    };
  });

  // Day-by-day coverage split by channel (for the "coverage peaked on …" chart).
  const DAY_NUMS = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28];
  const perDay = row.art / DAY_NUMS.length;
  const dayChannels = DAY_NUMS.map((d, i) => {
    const peak = i === 4;
    const total = Math.max(1, Math.round(perDay * (peak ? 2.1 : 0.7 + ((i * 3) % 5) / 6)));
    const online = Math.round(total * 0.72);
    const print = Math.round(total * 0.16);
    const broadcast = Math.max(0, total - online - print);
    return {
      day: `${short} ${d}`,
      online,
      print,
      broadcast,
      ave: fmtPhp(total * 1_600_000),
      event: peak ? 'EDCOM 2 hearing' : i === 1 ? 'Report release' : undefined,
    };
  });
  const dayTotal = (c: (typeof dayChannels)[number]) => c.online + c.print + c.broadcast;
  const peakDay = dayChannels.reduce((b, c) => (dayTotal(c) > dayTotal(b) ? c : b), dayChannels[0]).day;
  const dayLabels = dayChannels.map((c) => c.day);

  const stories = STORY_POOL.slice(0, 7).map((s, i) => {
    const meta = STORY_META[i];
    const days =
      meta.pattern === 'Spike'
        ? dayLabels.slice(i % 6, (i % 6) + 2)
        : meta.pattern === 'Steady'
          ? dayLabels.filter((_, di) => di % 2 === i % 2)
          : dayLabels.filter((_, di) => di % 3 === i % 3);
    return {
      id: `edcom2-${row.key}-${i}`,
      title: s.title,
      outlet: s.outlet,
      date: `${short} ${3 + i * 4}`,
      tone: s.tone,
      ave: Math.round(row.ave * 1e6 * (0.16 - i * 0.015)),
      snippet: s.snippet,
      outlets: meta.outlets,
      pattern: meta.pattern,
      issue: meta.issue,
      why: meta.why,
      days,
    };
  });
  const movedIssues = issues.slice(0, 4).map((iss, i) => ({
    issue: iss.label,
    count: iss.count,
    change: iss.change,
    biggestNow: STORY_POOL[i % STORY_POOL.length].title,
    biggestBefore: STORY_POOL[(i + 3) % STORY_POOL.length].title,
    moved:
      i === 0
        ? 'A new report reset the baseline.'
        : i === 1
          ? 'The budget calendar pulled it up.'
          : 'Steady institutional statements.',
  }));

  // Year on year — every reported month vs its 2025 counterpart + a usual-range band.
  const yoyRows = EDCOM2_ROWS.map((r, i) => {
    const before4 = TIMELINE_ART.slice(Math.max(0, 12 + i - 4), 12 + i);
    const m = mean(before4);
    const s = sd(before4);
    return {
      month: MONTH_SHORT[i],
      earlier: r.ly,
      later: r.art,
      changePct: pctChange(r.art, r.ly),
      lo: Math.max(0, Math.round(m - 2 * s)),
      hi: Math.round(m + 2 * s),
    };
  });
  const sum2025 = TIMELINE_2025.slice(0, idx + 1).reduce((a, b) => a + b, 0);
  const sum2026 = EDCOM2_ROWS.slice(0, idx + 1).reduce((a, r) => a + r.art, 0);
  const tl = TIMELINE_ART.slice(0, tIndex + 1);
  const avg12 = Math.round(mean(tl.slice(Math.max(0, tIndex - 12), tIndex)));
  const avg2 = Math.round(mean(tl.slice(Math.max(0, tIndex - 2), tIndex)));
  const yoy = {
    rows: yoyRows,
    changeOnYear: pctChange(row.art, row.ly),
    measureLabel: 'Articles',
    lead: `${row.label} had ${fmtCount(row.art)} articles, ${fmtChange(pctChange(row.art, row.ly))} on ${lyLabel}.`,
    sub: 'Three comparisons: the same month a year earlier, the year so far, and recent momentum. The line is read against its usual range.',
    writeup: {
      claim: 'Coverage is running well above last year.',
      body: `${row.label}'s ${fmtCount(row.art)} articles are ${fmtChange(pctChange(row.art, row.ly))} on ${lyLabel} and above the usual range for the month, with the year-on-year gap widening since mid-year.`,
    },
    compare: [
      {
        title: 'Main comparison · Year on year',
        question: `${row.label} against ${lyLabel}.`,
        bars: [
          { label: lyLabel, value: row.ly, display: fmtCount(row.ly) },
          { label: row.label, value: row.art, display: fmtCount(row.art) },
        ],
        answer: `${fmtChange(pctChange(row.art, row.ly))} · ${fmtCount(row.art)} vs ${fmtCount(row.ly)} articles`,
        answerTone: changeTone(pctChange(row.art, row.ly)),
      },
      {
        title: 'The year so far · Same months',
        question: `January–${short} this year against last.`,
        bars: [
          { label: `Jan–${short} 2025`, value: sum2025, display: fmtCount(sum2025) },
          { label: `Jan–${short} 2026`, value: sum2026, display: fmtCount(sum2026) },
        ],
        answer: `${fmtChange(pctChange(sum2026, sum2025))} · ${fmtCount(sum2026)} vs ${fmtCount(sum2025)}`,
        answerTone: changeTone(pctChange(sum2026, sum2025)),
      },
      {
        title: 'Momentum · Recent months',
        question: 'The 12-month average, the last two months, and this month.',
        bars: [
          { label: '12-mo avg', value: avg12, display: fmtCount(avg12) },
          { label: 'Last 2 mo', value: avg2, display: fmtCount(avg2) },
          { label: row.label, value: row.art, display: fmtCount(row.art) },
        ],
        answer: `${fmtChange(pctChange(row.art, avg2))} on the last two months · ${fmtChange(pctChange(row.art, avg12))} on the 12-month average`,
        answerTone: changeTone(pctChange(row.art, avg2)),
      },
    ],
    monthTable: EDCOM2_ROWS.slice(0, idx + 1)
      .map((r, i) => {
        const tot = r.tone[0] + r.tone[1] + r.tone[2];
        return {
          month: MONTH_SHORT[i],
          articles: r.art,
          ave: fmtPhp(r.ave * 1e6),
          avePerArticle: fmtPhp((r.ave * 1e6) / r.art),
          outlets: r.outlets,
          broadcastShare: `${10 + (i % 5)}%`,
          mainFocus: `${r.focus}%`,
          negTone: `${Math.round((r.tone[2] / tot) * 100)}%`,
          impressions: fmtCompact(r.impr),
          biggestStory: STORY_POOL[i % STORY_POOL.length].title,
          isCurrent: i === idx,
        };
      })
      .reverse(),
  };

  const issueSeries = ISSUE_POOL.slice(0, 6).map((iss) => ({
    key: iss.key,
    label: iss.label,
    months: EDCOM2_ROWS.slice(0, idx + 1).map((r, i) => {
      const tot = r.tone[0] + r.tone[1] + r.tone[2];
      return {
        label: MONTH_SHORT[i],
        n: Math.max(0, Math.round(r.art * iss.share * (0.85 + ((i * 5) % 7) / 20))),
        negTone: Math.round((r.tone[2] / tot) * 100),
      };
    }),
  }));

  // Headline stage — each 2026 month's 4-stage mix (diagnosis falls, implementation rises).
  const STAGE_NAMES = ['Diagnosis', 'Pressure', 'Legislation', 'Implementation'];
  const stageRows = EDCOM2_ROWS.slice(0, idx + 1)
    .map((r, i) => {
      const t = i / Math.max(1, idx);
      const diag = Math.round(38 - t * 14);
      const pres = Math.round(27 - t * 5);
      const leg = Math.round(18 + t * 6);
      return { label: MONTH_SHORT[i], parts: [diag, pres, leg, Math.max(0, 100 - diag - pres - leg)], isCurrent: i === idx };
    })
    .reverse();
  const curStage = stageRows.find((s) => s.isCurrent) ?? stageRows[0];
  const leadStageIdx = curStage.parts.indexOf(Math.max(...curStage.parts));
  const implNow = curStage.parts[3];
  const stage = {
    lead: `${STAGE_NAMES[leadStageIdx]} led ${row.label}'s headlines, at ${curStage.parts[leadStageIdx]}%; implementation was ${implNow}% against ${Math.round(implNow * 0.7)}% a year earlier.`,
    sub: 'Each headline is tested for four stage words in a fixed order; headlines carrying none are dropped.',
    note: 'Diagnosis: naming the problem · Pressure: demands for action · Legislation: bills and budgets · Implementation: roll-out and results.',
    stageNames: STAGE_NAMES,
    rows: stageRows,
    writeup: {
      claim: 'The conversation is maturing toward implementation.',
      body: 'Diagnosis still leads, but its share has fallen as implementation coverage climbed through the year — the reform story is moving from problem-naming to roll-out.',
    },
  };

  // Credit — EDCOM 2 vs DepEd share of headlines per month + the main-focus split.
  const creditLine = EDCOM2_ROWS.slice(0, idx + 1).map((r, i) => {
    const t = i / Math.max(1, idx);
    return { month: MONTH_SHORT[i], earlier: Math.round(34 - t * 4), later: Math.round(28 + t * 10), changePct: 0 };
  });
  const credit = {
    lead: `EDCOM 2 was in ${creditLine[creditLine.length - 1].later}% of ${row.label} headlines and the main subject of ${row.focus}% of its articles; DepEd was in ${creditLine[creditLine.length - 1].earlier}%.`,
    sub: "Two readings of credit: being named in the headline, and being the article's main subject rather than a passing mention.",
    line: creditLine,
    focus: EDCOM2_ROWS.slice(0, idx + 1)
      .map((r, i) => ({ label: MONTH_SHORT[i], parts: [r.focus, 100 - r.focus], isCurrent: i === idx }))
      .reverse(),
    writeups: [
      {
        claim: 'EDCOM 2 is gaining on DepEd in the headline.',
        body: "EDCOM 2's share of headlines has risen through the year while DepEd's has eased, so the commission is increasingly the named driver of the reform story.",
      },
      {
        claim: 'And it is usually the main subject, not a mention.',
        body: `Main focus held at ${row.focus}%, so when EDCOM 2 appears it is typically the story, not a passing reference.`,
      },
    ],
  };

  // Voices — individuals + institutions, each with a previous-year ghost + 12-month-average tick.
  const vf = row.art / 490;
  const mkVoice = (b: { name: string; base: number }) => {
    const value = Math.max(1, Math.round(b.base * vf));
    const prev = Math.max(1, Math.round(value * 0.8));
    return { label: b.name, value, prev, tick: Math.round(value * 0.9), change: fmtChange(pctChange(value, prev)), changeTone: changeTone(pctChange(value, prev)) };
  };
  const voices = {
    lead: `${VOICE_PEOPLE[0].name} is named most in ${row.label}, ${Math.round(VOICE_PEOPLE[0].base * vf)} times; ${VOICE_INST[0].name} leads the institutions with ${Math.round(VOICE_INST[0].base * vf)}.`,
    sub: "A naming counts each time a person or institution is quoted or referenced in the month's coverage.",
    individuals: VOICE_PEOPLE.map(mkVoice),
    institutions: VOICE_INST.map(mkVoice),
    writeup: {
      claim: 'The same handful of voices carry the story.',
      body: 'Coverage leans on a small set of named officials and institutions; the commission itself is the most-referenced body, ahead of DepEd.',
    },
  };

  // Channels — channel mix by measure (this month vs last year) + per-channel stories + month×channel.
  const CH_SHARE = { n: [0.72, 0.16, 0.12], ave: [0.45, 0.25, 0.3], imp: [0.8, 0.08, 0.12] };
  const mkMix = (label: string, total: number, shares: number[], isCurrent?: boolean) => ({
    label,
    parts: shares.map((s) => Math.round(total * s)),
    isCurrent,
  });
  const channels = {
    lead: `Online carried ${Math.round(CH_SHARE.n[0] * 100)}% of ${row.label} articles; broadcast carried ${Math.round(CH_SHARE.ave[2] * 100)}% of its AVE.`,
    sub: 'AVE is weighted by channel, so broadcast carries more value per item than its article count suggests.',
    mix: [
      mkMix('Articles', row.art, CH_SHARE.n, true),
      mkMix('AVE', Math.round(row.ave), CH_SHARE.ave),
      mkMix('Impr.', Math.round(row.impr / 1000), CH_SHARE.imp),
      mkMix('Articles ’25', row.ly, CH_SHARE.n),
      mkMix('AVE ’25', Math.round((row.ave * row.ly) / row.art), CH_SHARE.ave),
      mkMix('Impr. ’25', Math.round((row.impr * 0.7) / 1000), CH_SHARE.imp),
    ],
    byChannel: [
      { channel: 'Online', items: STORY_POOL.slice(0, 3).map((s, i) => ({ label: s.title, value: Math.max(1, Math.round(row.art * 0.72 * (0.25 - i * 0.05))) })) },
      { channel: 'Print', items: STORY_POOL.slice(2, 5).map((s, i) => ({ label: s.title, value: Math.max(1, Math.round(row.art * 0.16 * (0.3 - i * 0.06))) })) },
      { channel: 'Broadcast', items: STORY_POOL.slice(1, 4).map((s, i) => ({ label: s.title, value: Math.max(1, Math.round(row.art * 0.12 * (0.3 - i * 0.06))) })) },
    ],
    months: EDCOM2_ROWS.slice(0, idx + 1)
      .map((r, i) => ({ label: MONTH_SHORT[i], parts: [Math.round(r.art * 0.72), Math.round(r.art * 0.16), Math.round(r.art * 0.12)], isCurrent: i === idx }))
      .reverse(),
    writeup: {
      claim: 'Online drives volume; broadcast drives value.',
      body: "Online carried most of the month's articles, but broadcast and print punched above their weight on AVE — a few high-value segments and broadsheet features.",
    },
  };

  // Tone — Objective vs Persona-aligned split, plus tone by month and by issue.
  const tv = toneVerdict(row.tone);
  const toneObj = { pos: row.tone[0], neu: row.tone[1], neg: row.tone[2] };
  const toneTot = toneObj.pos + toneObj.neu + toneObj.neg || 1;
  const toneNet = Math.round(((toneObj.pos - toneObj.neg) / toneTot) * 100);
  const toneNegShare = Math.round((toneObj.neg / toneTot) * 100);
  const toneTab = {
    objectiveLead: `Coverage tone in ${row.label} was ${tv.verdict.toLowerCase()}: net tone ${toneNet >= 0 ? '+' : ''}${toneNet}, ${toneNegShare}% negative.`,
    personaLead: `Read toward EDCOM 2, ${row.label} was more supportive — the reform framing drew approval more often than criticism.`,
    sub: "Objective uses Media Meter tags; Persona aligned reads tone toward EDCOM 2's interests.",
    objective: toneObj,
    persona: { pos: Math.round(toneObj.pos * 1.3), neu: toneObj.neu, neg: Math.round(toneObj.neg * 0.7) },
    prevNet: Math.round(toneNet * 0.85),
    prevNegShare: toneNegShare + 2,
    byMonth: EDCOM2_ROWS.slice(0, idx + 1)
      .map((r, i) => ({ label: MONTH_SHORT[i], parts: [r.tone[0], r.tone[1], r.tone[2]], isCurrent: i === idx }))
      .reverse(),
    byIssue: issues.map((iss) => ({ label: iss.label, parts: [iss.tone.pos, iss.tone.neu, iss.tone.neg] })),
    writeup: {
      claim: 'Criticism is targeted, not general.',
      body: `Negative coverage clustered on specific gaps — classrooms, teacher pay — rather than the reform as a whole, so the overall read stays ${tv.verdict.toLowerCase()}.`,
    },
  };

  const above = issues.filter((i) => i.read === 'above');
  const below = issues.filter((i) => i.read === 'below');
  return {
    yoy,
    issues,
    issuesLead: above.length
      ? `${numberWord(above.length)} ${above.length === 1 ? 'issue is' : 'issues are'} above their usual range in ${row.label}: ${above.map((i) => i.label.toLowerCase()).join(', ')}.`
      : `No issue is above its usual range in ${row.label}.`,
    issuesSub: `Each issue is read against its own recent band.${below.length ? ` Below range: ${below.map((i) => i.label.toLowerCase()).join(', ')}.` : ''} Tap an issue for its articles.`,
    issuesWriteups: [
      {
        kicker: 'How the lead issue changed shape',
        claim: `${issues[0].label} led the month and is still climbing.`,
        body: `${issues[0].label} drew ${issues[0].count} articles (${fmtChange(issues[0].change)} on a year earlier), above its usual ${issues[0].lo}–${issues[0].hi}. Coverage moved from diagnosis toward calls for action.`,
      },
      {
        kicker: 'Twenty-month deep dive',
        claim: 'The issue mix is broadening, not narrowing.',
        body: 'Across the full timeline no single issue has owned more than a quarter of coverage, and the spread across budget, teachers and curriculum has widened as the reform agenda advances.',
      },
    ],
    issueSeries,
    stories,
    storiesLead: `${stories[0].title} drew the most AVE in ${row.label}: ${fmtPhp(stories[0].ave)} across ${stories[0].outlets} outlets.`,
    storiesSub: 'Stories are Media Meter clusters — articles grouped around the same event. Tap a story for its headlines and links.',
    storiesWriteups: [
      {
        kicker: 'How the month’s stories travelled',
        claim: 'Coverage was event-driven, not steady.',
        body: `The month's volume clustered around ${peakDay} and the report release, with a long tail of smaller policy-process stories in between.`,
      },
      {
        kicker: 'Which stories moved each issue',
        claim: 'The lead story reset the issue baseline.',
        body: `${issues[0].label} was carried mostly by one report, while budget coverage tracked the committee calendar rather than any single story.`,
      },
    ],
    dayChannels,
    peakDay,
    movedIssues,
    stage,
    credit,
    voices,
    channels,
    toneTab,
    tone: { pos: row.tone[0], neu: row.tone[1], neg: row.tone[2] },
  };
};

// Breakdown item with all three measures (articles / AVE / impressions). aveW tilts AVE-per-article
// up or down so rankings can shift across measures (premium outlets vs high-reach ones).
const bd = (
  label: string,
  n: number,
  aveW = 1,
  extra: { color?: string; sub?: string } = {},
): import('@/types').IReportBreakdownItem => ({
  label,
  n,
  ave: Math.round(n * 900_000 * aveW),
  imp: Math.round(n * 12_000 * (2 - aveW)),
  ...extra,
});

const edcom2Sections = (factor: number, monthLabel: string): Record<string, import('@/types').IReportSection> => {
  const S = (n: number) => Math.max(1, Math.round(n * factor));
  return {
    stage: {
      kind: 'breakdown',
      measurable: true,
      intro: 'Where the month’s coverage sat in the policy lifecycle — from findings to roll-out.',
      items: [
        bd('Diagnosis', S(142), 1.0, { color: '#1e4fa8' }),
        bd('Pressure', S(118), 0.9, { color: '#eb6834' }),
        bd('Legislation', S(96), 1.2, { color: '#7c3aed' }),
        bd('Implementation', S(84), 1.05, { color: '#159d72' }),
      ],
    },
    credit: {
      kind: 'breakdown',
      measurable: true,
      intro: 'Who coverage credited for driving the reform agenda.',
      items: [bd('EDCOM 2', S(210), 1.1), bd('DepEd', S(158), 0.95), bd('CHED', S(86), 1.05), bd('Congress', S(74), 1.0), bd('Others', S(52), 0.9)],
    },
    voices: {
      kind: 'breakdown',
      measurable: true,
      intro: 'The most-quoted voices in the month’s coverage.',
      items: [bd('Sen. Sonny Angara', S(64), 1.1), bd('DepEd Secretary', S(58), 1.0), bd('EDCOM 2 co-chair', S(49), 1.05), bd('Teacher groups', S(41), 0.85), bd('CHED chairperson', S(33), 1.0)],
    },
    channels: {
      kind: 'breakdown',
      measurable: true,
      intro: 'How the coverage split across media channels.',
      items: [bd('Online', S(352), 0.85, { color: '#1e4fa8' }), bd('Print', S(84), 1.3, { color: '#eda100' }), bd('Broadcast', S(54), 1.5, { color: '#7c3aed' })],
    },
    actions: {
      kind: 'actions',
      intro: 'What the commission and agencies were urged to do this month.',
      lead: `Four recommendations for ${monthLabel}, each tied to a finding in the month’s coverage.`,
      readMore: 'Written for the latest reported month. Each card names the source finding and the metric to watch.',
      actionCards: [
        {
          source: 'from EDCOM 2',
          title: 'Front-load teacher hiring before the next school opening',
          rows: [
            { term: 'Finding', detail: 'Teacher welfare sat above its usual range, driven by renewed calls on base pay and workload.' },
            { term: 'Do', detail: 'Fill standing vacancies early to ease the pupil-to-teacher ratio before classes resume.' },
            { term: 'Metric to watch', detail: 'Teacher-welfare article share and net tone, month on month.' },
          ],
        },
        {
          source: 'from Congress',
          title: 'Protect the 2027 education budget as fiscal space tightens',
          rows: [
            { term: 'Finding', detail: 'Budget & funding ran near the top of the issue list in the run-up to the outlay.' },
            { term: 'Do', detail: 'Shield priority programs from cuts and make the trade-offs public early.' },
            { term: 'Metric to watch', detail: 'Budget-issue coverage and the share framed around cuts.' },
          ],
        },
        {
          source: 'from DepEd',
          title: 'Scale MATATAG support alongside the rollout',
          rows: [
            { term: 'Finding', detail: 'MATATAG coverage stayed within its usual range but leaned on teacher-readiness questions.' },
            { term: 'Do', detail: 'Pair the streamlined curriculum with sustained teacher training and materials.' },
            { term: 'Metric to watch', detail: 'MATATAG net tone and the mix of readiness vs results framing.' },
          ],
        },
        {
          source: 'from EDCOM 2',
          title: 'Stand up the missing learning-assessment system',
          rows: [
            { term: 'Finding', detail: 'Learning poverty led the issues; coverage repeatedly flagged the data gap.' },
            { term: 'Do', detail: 'Launch the assessment system EDCOM 2 named as missing, with a public timeline.' },
            { term: 'Metric to watch', detail: 'Learning-poverty coverage and whether “data gap” framing softens.' },
          ],
        },
      ],
    },
    read: {
      kind: 'howToRead',
      intro: 'How this review uses Scoup’s metrics.',
      lead: 'Every figure in this report is a Scoup metric; this tab maps the source review’s terms to them.',
      readMore:
        'Origin tags: Media Meter (exported figures), Scoup (Scoup-computed), Report (defined by the source review).',
      termMap: [
        { term: 'Pickups', metric: 'Articles', origin: 'mm', rule: 'Articles, print stories and broadcast segments, each counted once.' },
        { term: 'Ad value', metric: 'AVE', origin: 'mm', rule: 'Advertising value equivalent — the Media Meter pr_value, summed in pesos.' },
        { term: 'Reach', metric: 'Impressions', origin: 'mm', rule: 'The sum of each item’s outlet reach (sampled).' },
        { term: 'Lead subject', metric: 'Main focus', origin: 'mm', rule: 'Share of articles where EDCOM 2 is the main subject, not a passing mention.' },
        { term: 'Tonality', metric: 'Tone · Objective', origin: 'mm', rule: 'Automated article tone from Media Meter tags.' },
        { term: 'Sentiment', metric: 'Tone · Persona aligned', origin: 'sc', rule: 'Tone read toward EDCOM 2’s interests.' },
        { term: 'Positive / negative %', metric: 'Net tone & verdict', origin: 'sc', rule: '(positive − negative) ÷ rated × 100; the verdict bands the result.' },
        { term: 'Building / Cooling / Fading', metric: 'Above / Within / Below usual range', origin: 'sc', rule: 'Each figure is read against its own band — mean ± 2 SD of the four prior months.' },
        { term: 'Headline stage', metric: 'Headline stage', origin: 'rp', rule: 'Share of headlines carrying a stage word, tested in a fixed order.' },
        { term: 'In the headline', metric: 'Credit', origin: 'rp', rule: 'Share of headlines that name EDCOM 2, vs the main-subject share.' },
        { term: 'Named voices', metric: 'Voices', origin: 'rp', rule: 'Count of times a person or institution is named in coverage.' },
        { term: 'Change', metric: 'Year-on-year change', origin: 'sc', rule: 'This month against the same month a year earlier.' },
      ],
      glossary: [
        { term: 'Usual range', meaning: 'A figure’s own recent band — mean ± 2 SD of the four months before it.' },
        { term: 'Main focus', meaning: 'The article is mainly about EDCOM 2, not a passing mention.' },
        { term: 'Net tone', meaning: '(positive − negative) as a share of rated articles.' },
        { term: 'Headline stage', meaning: 'Where a headline sits in the policy lifecycle: diagnosis, pressure, legislation or implementation.' },
      ],
      method: [
        { title: 'What it counts', paras: ['The review covers EDCOM2-bucket coverage across online, print and broadcast — Media Meter’s capture for the month.'] },
        { title: 'How it reads change', paras: ['Each figure is compared to the same month a year earlier and to its own usual range, so a rise is read against both history and seasonality.'] },
      ],
    },
  };
};

const autoSections = (): Record<string, import('@/types').IReportSection> => ({
  bodies: {
    kind: 'breakdown',
    measurable: true,
    intro: 'Coverage by body type across all brands.',
    items: [bd('SUV', 980, 1.1), bd('Sedan', 720, 0.95), bd('Pickup', 560, 1.05), bd('MPV', 520, 0.9), bd('Hatchback', 410, 0.85), bd('EV crossover', 390, 1.25)],
  },
  pws: {
    kind: 'breakdown',
    measurable: true,
    intro: 'Coverage by powertrain. EV and hybrid keep gaining on gas.',
    items: [bd('Gas (ICE)', 1980, 0.9, { color: '#73726c' }), bd('Hybrid', 640, 1.1, { color: '#eda100' }), bd('Electric (EV)', 720, 1.3, { color: '#159d72' }), bd('Diesel', 520, 1.0, { color: '#1e4fa8' })],
  },
  themes: {
    kind: 'breakdown',
    measurable: true,
    intro: 'What the month’s automotive coverage was about.',
    items: [bd('New launches', 820, 1.15), bd('Pricing & promos', 610, 0.9), bd('EV policy', 540, 1.2), bd('Sales performance', 480, 1.0), bd('Recalls & safety', 190, 0.8)],
  },
  timeline: {
    kind: 'timeline',
    measurable: true,
    intro: 'Coverage week by week through September.',
    items: [bd('Sep 1–7', 820, 1.0), bd('Sep 8–14', 910, 1.0), bd('Sep 15–21', 940, 1.0), bd('Sep 22–30', 910, 1.0)],
  },
  tone: {
    kind: 'toneIssues',
    intro: 'Overall tone, and the issue tags driving it.',
    tone: { pos: 980, neu: 2180, neg: 420 },
    items: [bd('Product news', 1120, 1.0), bd('Pricing', 760, 0.9), bd('EV & policy', 640, 1.15), bd('Service & ownership', 430, 0.95), bd('Safety & recalls', 230, 0.85)],
  },
  summary: {
    kind: 'summary',
    intro: 'The month in three lines.',
    bullets: [
      { title: 'Toyota holds the lead', body: '490 articles and 13.7% share of voice keep it #1, driven by the Vios and Fortuner.' },
      { title: 'BYD is the story of the month', body: '236 articles and the best net tone (+25) as it expands its EV lineup and dealer network.' },
      { title: 'EVs reshape the field', body: 'Policy support and new launches lifted EV and hybrid coverage against gas models.' },
    ],
  },
  read: {
    kind: 'howToRead',
    intro: 'How these figures are built, and what each one counts.',
    bullets: [
      { title: 'Articles', body: 'An article counts once per brand and once per nameplate it names (Media Meter).' },
      { title: 'Share of voice', body: 'A brand’s articles as a share of all tagged brand articles.' },
      { title: 'AVE', body: 'Advertising value equivalent — the Media Meter pr_value, summed in pesos.' },
      { title: 'Impressions', body: 'The sum of each item’s outlet reach.' },
    ],
  },
});

const edcom2Card = (): IClientReportCard => {
  const last = EDCOM2_ROWS[EDCOM2_ROWS.length - 1];
  return {
    id: 'edcom2',
    group: 'Year-on-year reviews',
    railTag: 'E2',
    railLabel: 'EDCOM 2',
    title: 'EDCOM 2 · Year-on-year review',
    meta: 'Second Congressional Commission on Education · monthly · twenty months',
    lede: `${last.label}: ${fmtCount(last.art)} articles, ${fmtChange(pctChange(last.art, last.ly))} on ${last.label.replace('2026', '2025')}; ${fmtPhp(last.ave * 1e6)} AVE.`,
    tags: [{ label: 'Monthly' }, { label: 'News: online, print, broadcast' }, { label: `${EDCOM2_ROWS.length} reported months`, isLine: true }],
    months: [...EDCOM2_MONTHS].reverse(),
    tabs: EDCOM2_TABS,
  };
};

const edcom2Detail = (monthKey: string | null): IClientReportDetail => {
  const found = EDCOM2_ROWS.findIndex((r) => r.key === monthKey);
  const idx = found < 0 ? EDCOM2_ROWS.length - 1 : found; // unknown/no month → latest
  const row = EDCOM2_ROWS[idx];
  const lyLabel = row.label.replace('2026', '2025');
  // Position + rank over the full 20-month timeline (Jan 2025 → this month), web parity.
  const tIndex = 12 + idx; // 0-based index in the 20-month timeline
  const tCount = tIndex + 1; // "N months of coverage"
  const upToTimeline = TIMELINE_ART.slice(0, tCount);
  const rank = upToTimeline.filter((a) => a >= row.art).length;
  const aveLy = row.ave * (row.ly / row.art);
  const tv = toneVerdict(row.tone);
  const artPct = pctChange(row.art, row.ly);
  const figures: IReportFigure[] = [
    { label: 'Articles', origin: 'mm', value: fmtCount(row.art), change: fmtChange(artPct), changeTone: changeTone(artPct), sub: `vs ${lyLabel} · #${rank} of ${tCount} months` },
    { label: 'AVE', origin: 'mm', value: fmtPhp(row.ave * 1e6), change: fmtChange(pctChange(row.ave, aveLy)), changeTone: changeTone(pctChange(row.ave, aveLy)), sub: `vs ${lyLabel}` },
    { label: 'Impressions', origin: 'mm', value: fmtCompact(row.impr), sub: `vs ${lyLabel}`, tip: 'Sum of each item’s outlet reach.' },
    { label: 'Outlets', origin: 'mm', value: fmtCount(row.outlets), sub: `vs ${lyLabel}` },
    { label: 'Main focus', origin: 'mm', value: `${Math.round(row.focus)}%`, change: '▲2 pts', changeTone: 'up', sub: `vs ${lyLabel}`, tip: 'Share of articles where EDCOM 2 is the main subject, not a passing mention.' },
    { label: 'Top tonality', origin: 'mm', value: tv.verdict, isVerdict: true, sub: `Net tone ${tv.net >= 0 ? '+' : ''}${Math.round(tv.net)} · ${Math.round(tv.negShare)}% negative` },
  ];
  const pills: IReportPill[] = [
    { label: '2 above usual range', tone: 'up' },
    { label: '5 within', tone: 'plain' },
    { label: 'Articles above usual range', tone: 'up' },
  ];
  const glance: import('@/types').IReportGlance = {
    lead: `${row.label} ${idx === EDCOM2_ROWS.length - 1 ? 'is the strongest month in the series so far' : 'kept the reform story in steady coverage'} — ${fmtCount(row.art)} articles, ${fmtChange(artPct)} on ${lyLabel}, with main focus at ${Math.round(row.focus)}% and tone net-positive.`,
    verdict: {
      ask: 'Is the reform narrative still landing?',
      title: artPct > 0 ? 'Yes — and louder than a year ago.' : 'Holding, but quieter than a year ago.',
      text: `Coverage reached ${fmtCount(row.art)} articles (${fmtChange(artPct)} on ${lyLabel}), carried by online and broadsheet reporting. Main focus held at ${Math.round(row.focus)}%, so EDCOM 2 stayed the subject rather than a passing mention, and tonality read ${tv.verdict.toLowerCase()}.`,
      grid: [
        { stage: 'Diagnosis', shift: '−6 pts' },
        { stage: 'Pressure', shift: '−3 pts' },
        { stage: 'Legislation', shift: '+2 pts' },
        { stage: 'Implementation', shift: '+7 pts' },
      ],
    },
    beforeTitle: `Before — ${lyLabel} and the run-up`,
    before: [
      { label: 'Jan–Jul 2025, a month', value: fmtCount(Math.round(mean(TIMELINE_2025.slice(0, 7)))) },
      { label: `Same month, ${lyLabel}`, value: fmtCount(row.ly) },
      { label: 'Months between, a month', value: fmtCount(Math.round(mean(TIMELINE_ART.slice(8, Math.max(9, 12 + idx))))) },
    ],
    nowTitle: `Now — ${row.label}`,
    now: [
      { label: 'Peak so far', value: fmtCount(Math.max(...EDCOM2_ROWS.slice(0, idx + 1).map((r) => r.art))) },
      { label: row.label, value: fmtCount(row.art) },
      {
        label: 'Usual range',
        value: (() => {
          const b4 = TIMELINE_ART.slice(Math.max(0, 12 + idx - 4), 12 + idx);
          return `${Math.max(0, Math.round(mean(b4) - 2 * sd(b4)))}–${Math.round(mean(b4) + 2 * sd(b4))}`;
        })(),
      },
    ],
    findings: [
      { title: 'Online drove the volume', body: 'Online outlets carried most of the month’s coverage, with broadsheets adding analysis and official reaction within a day and broadcast recapping the key figures.' },
      { title: 'Tone stayed net-positive', body: `Net tone read ${tv.net >= 0 ? '+' : ''}${Math.round(tv.net)} with ${Math.round(tv.negShare)}% negative — criticism was present but tied to specific issues, not the reform as a whole.` },
      { title: 'Budget and teachers led the issues', body: 'Budget & funding and teacher welfare sat above their usual range, reflecting the run-up to the 2027 education outlay.' },
    ],
  };
  return {
    id: 'edcom2',
    kicker: 'EDCOM 2 · Year-on-year review',
    title: row.label,
    sub: `Against ${lyLabel} · ${numberWord(tCount)} months of coverage, January 2025 to ${row.label} · Media Meter, EDCOM2 bucket`,
    pills,
    figures,
    glance,
    tabs: EDCOM2_TABS,
    months: [...EDCOM2_MONTHS].reverse(),
    activeMonth: row.key,
    edcom2Tabs: edcom2TabData(idx),
    sections: edcom2Sections(row.art / 490, row.label),
  };
};

// ─── PH automotive ─────────────────────────────────────────────────────────────
const AUTO_TABS: IReportTabDef[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'nameplates', label: 'Nameplates' },
  { key: 'brands', label: 'Brands' },
  { key: 'bodies', label: 'Body types' },
  { key: 'pws', label: 'Powertrain' },
  { key: 'themes', label: 'Themes' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'stories', label: 'Stories' },
  { key: 'tone', label: 'Tone and issues' },
  { key: 'h2h', label: 'Head-to-head' },
  { key: 'summary', label: 'Summary' },
  { key: 'read', label: 'How to read this' },
];

// PH-auto brands/nameplates/stories (web: autoIndex). Seeded to the prototype's headline
// (Toyota #1 490/13.7%, BYD 236/6.6%).
const AUTO_BRANDS: Array<{ name: string; n: number; share: number; ave: number; tone: [number, number, number] }> = [
  { name: 'Toyota', n: 490, share: 13.7, ave: 420_000_000, tone: [120, 300, 70] },
  { name: 'BYD', n: 236, share: 6.6, ave: 198_000_000, tone: [78, 138, 20] },
  { name: 'Mitsubishi', n: 198, share: 5.5, ave: 162_000_000, tone: [44, 132, 22] },
  { name: 'Nissan', n: 176, share: 4.9, ave: 141_000_000, tone: [38, 118, 20] },
  { name: 'Ford', n: 165, share: 4.6, ave: 134_000_000, tone: [40, 108, 17] },
  { name: 'Honda', n: 152, share: 4.3, ave: 121_000_000, tone: [33, 104, 15] },
  { name: 'Hyundai', n: 141, share: 3.9, ave: 112_000_000, tone: [30, 98, 13] },
  { name: 'Suzuki', n: 128, share: 3.6, ave: 99_000_000, tone: [27, 90, 11] },
  { name: 'GAC', n: 112, share: 3.1, ave: 84_000_000, tone: [24, 80, 8] },
  { name: 'Geely', n: 98, share: 2.7, ave: 72_000_000, tone: [21, 70, 7] },
];
const AUTO_NAMEPLATES = [
  { name: 'Vios', brand: 'Toyota', n: 92 },
  { name: 'Fortuner', brand: 'Toyota', n: 78 },
  { name: 'Seal', brand: 'BYD', n: 64 },
  { name: 'Raize', brand: 'Toyota', n: 58 },
  { name: 'Dolphin', brand: 'BYD', n: 49 },
  { name: 'Montero Sport', brand: 'Mitsubishi', n: 44 },
  { name: 'Navara', brand: 'Nissan', n: 38 },
  { name: 'Ranger', brand: 'Ford', n: 35 },
  { name: 'City', brand: 'Honda', n: 31 },
  { name: 'Hilux', brand: 'Toyota', n: 29 },
];
const AUTO_STORY_POOL: Array<{ title: string; outlet: string; tone: 'pos' | 'neu' | 'neg'; snippet: string }> = [
  { title: 'Toyota keeps top spot as PH vehicle sales climb', outlet: 'BusinessWorld', tone: 'pos', snippet: 'Strong demand for the Vios and Fortuner kept Toyota ahead, with the brand citing steady supply and new variants.' },
  { title: 'BYD expands EV lineup, opens new PH dealerships', outlet: 'Philippine Star', tone: 'pos', snippet: 'The fast-growing challenger added showrooms and teased more models, pushing its share of voice higher.' },
  { title: 'EV incentives draw more brands to the Philippines', outlet: 'Rappler', tone: 'neu', snippet: 'Policy support and lower tariffs are reshaping the field as Chinese and legacy makers vie for buyers.' },
  { title: 'Pickup segment heats up as Ranger, Hilux face new rivals', outlet: 'Top Gear Philippines', tone: 'neu', snippet: 'A wave of new one-tonners intensified competition in the country’s most contested segment.' },
  { title: 'Recall notice issued for select Nissan units', outlet: 'ABS-CBN News', tone: 'neg', snippet: 'The advisory covered a limited build range; the brand said affected owners would be contacted.' },
  { title: 'Mitsubishi bets on Montero Sport refresh', outlet: 'AutoIndustriya', tone: 'pos', snippet: 'An updated flagship SUV aims to defend the brand’s share against newer entrants.' },
  { title: 'Chinese brands pressure legacy makers on price', outlet: 'Manila Bulletin', tone: 'neu', snippet: 'Aggressive pricing and feature-rich models are forcing incumbents to respond.' },
];

const autoTabData = (): import('@/types').IAutoTabData => {
  const brands = AUTO_BRANDS.map((b) => ({ name: b.name, n: b.n, share: b.share, ave: b.ave, tone: { pos: b.tone[0], neu: b.tone[1], neg: b.tone[2] } }));
  const stories = AUTO_STORY_POOL.map((s, i) => ({
    id: `auto-sep-${i}`,
    title: s.title,
    outlet: s.outlet,
    date: `Sep ${3 + i * 4}`,
    tone: s.tone,
    ave: Math.round(300_000_000 * (0.16 - i * 0.016)),
    snippet: s.snippet,
  }));
  const net = (t: [number, number, number]) => Math.round(((t[0] - t[2]) / (t[0] + t[1] + t[2])) * 100);
  const h2h = {
    a: 'Toyota',
    b: 'BYD',
    rows: [
      { label: 'Articles', a: '490', b: '236', leader: 'a' as const },
      { label: 'Share of voice', a: '13.7%', b: '6.6%', leader: 'a' as const },
      { label: 'AVE', a: fmtPhp(AUTO_BRANDS[0].ave), b: fmtPhp(AUTO_BRANDS[1].ave), leader: 'a' as const },
      { label: 'Net tone', a: `+${net(AUTO_BRANDS[0].tone)}`, b: `+${net(AUTO_BRANDS[1].tone)}`, leader: 'b' as const },
      { label: 'Top nameplate', a: 'Vios (92)', b: 'Seal (64)', leader: 'a' as const },
    ],
  };
  return { brands, nameplates: AUTO_NAMEPLATES, stories, h2h };
};

const autoCard = (): IClientReportCard => ({
  id: 'ph-auto',
  group: 'Market reports',
  railTag: 'PH',
  railLabel: 'Automotive · models',
  title: 'Philippine automotive · Model segmentation',
  meta: 'Toyota Motor Philippines · market report · 63 brands, 543 nameplates',
  lede: 'September 2026: Toyota #1 with 490 articles, 13.7% share of voice; BYD next with 236.',
  tags: [{ label: 'Monthly' }, { label: 'Competitive' }, { label: 'Any of 63 brands', isLine: true }],
  months: [],
  monthShort: 'Sep',
  tabs: AUTO_TABS,
});

const autoDetail = (): IClientReportDetail => {
  const tv = toneVerdict([980, 2180, 420]);
  const figures: IReportFigure[] = [
    { label: 'Articles', origin: 'mm', value: fmtCount(3580), change: '▲18%', changeTone: 'up', sub: 'across 63 brands · vs August' },
    { label: 'Share of voice', origin: 'mm', value: '13.7%', sub: 'Toyota, #1 · BYD 6.6%', isVerdict: false, tip: 'Brand articles as a share of all tagged brand articles.' },
    { label: 'AVE', origin: 'mm', value: fmtPhp(2_430_000_000), change: '▲12%', changeTone: 'up', sub: 'vs August' },
    { label: 'Impressions', origin: 'mm', value: fmtCompact(58_400_000), sub: 'vs August' },
    { label: 'Nameplates', origin: 'mm', value: fmtCount(543), sub: '217 with coverage this month' },
    { label: 'Top tonality', origin: 'mm', value: tv.verdict, isVerdict: true, sub: `Net tone ${tv.net >= 0 ? '+' : ''}${Math.round(tv.net)} · ${Math.round(tv.negShare)}% negative` },
  ];
  const pills: IReportPill[] = [
    { label: 'Toyota leads', tone: 'up' },
    { label: 'BYD rising', tone: 'up' },
    { label: '63 brands covered', tone: 'plain' },
  ];
  return {
    id: 'ph-auto',
    kicker: 'Philippine automotive · Model segmentation',
    title: 'September 2026',
    sub: 'Sep 1 – 30, 2026 · Toyota Motor Philippines · 63 brands, 543 nameplates · Media Meter',
    pills,
    figures,
    tabs: AUTO_TABS,
    months: [],
    activeMonth: null,
    autoTabs: autoTabData(),
    sections: autoSections(),
  };
};

// ─── Public API ────────────────────────────────────────────────────────────────
export const getClientReportCards = (): IClientReportCard[] => [edcom2Card(), autoCard()];

// The "pick a month" list (EDCOM 2), newest-first, each with a headline stat.
export const getClientReportMonths = (id: ClientReportId): import('@/types').IReportMonthSummary[] => {
  if (id !== 'edcom2') return [];
  return [...EDCOM2_ROWS].reverse().map((r) => {
    const pct = pctChange(r.art, r.ly);
    return {
      key: r.key,
      label: r.label,
      articles: fmtCount(r.art),
      change: fmtChange(pct),
      changeTone: changeTone(pct),
      ave: fmtPhp(r.ave * 1e6),
    };
  });
};

export const getClientReportDetail = (id: ClientReportId, monthKey?: string | null): IClientReportDetail =>
  id === 'edcom2' ? edcom2Detail(monthKey ?? null) : autoDetail();
