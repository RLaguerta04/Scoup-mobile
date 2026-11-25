// The rich Story-detail view-model. Builds on the feed card (so the stats on the
// detail reconcile with the list) and adds the per-story narrative, social and
// coverage content the web app's story page shows. Deterministic (seeded by id).
import type {
  IArticleItem,
  ICoverageAuthor,
  ICoverageClip,
  ICoverageKeyword,
  ICoverageWriteup,
  IEmotionShare,
  IKeyVoice,
  INewsletter,
  IOutletCount,
  IPeriodTone,
  IPostItem,
  ISocialPlatformTab,
  ISocialWriteup,
  IStoryAlignment,
  IStoryComment,
  IStoryDetail,
  IStoryFootnote,
  IStoryHourlyDay,
  IStoryNarrativeSection,
  IStorySentiment,
  ITrustRole,
  ITrustSummary,
  NewsletterTheme,
  ToneKey,
} from '@/types';
import { presetRange, TODAY } from '@/lib/dateRange';
import { AUTHORS, EMOTIONS, MEDIUMS, NEWSLETTERS, OUTLETS, SUBJECTS } from './entities';
import { getStories } from './generators';
import { intBetween, pick, rngFor, type Rand } from './util';

const nlById = (id: string): INewsletter =>
  NEWSLETTERS.find((n) => n.id === id) ?? NEWSLETTERS[0];

const THEME_LABEL: Record<NewsletterTheme, string> = {
  telco: 'telecommunications',
  banking: 'banking & finance',
  government: 'government',
  general: 'business',
};

const PERSONAS = [
  'Phillip, Media Analyst',
  'Marco, Comms Lead',
  'Dana, PR Strategist',
  'Reyes, Account Director',
];

const HANDLES = [
  'juan_delacruz', 'mariaclara_ph', 'newswatch_ph', 'inquirerdotnet',
  'gmanews', 'rapplerdotcom', 'konsumer_ph', 'tita_of_manila',
  'pinoy_analyst', 'balita_now', 'usapang_ph', 'ka_totoy',
];

const POST_TEXTS = [
  'Good to finally see movement on this. Sana tuloy-tuloy.',
  'Reading the full report now — bigger than the headline makes it sound.',
  'Explained simply for those asking in the comments 👇',
  'Credit where due: the numbers back this up.',
  'Still not convinced ito ang buong kuwento. Antay follow-up.',
  'Thread: what this actually means for ordinary families. 🧵',
  'Nakakagulat na maganda ang balita for once. Sana tuloy.',
  'Shared sa family group — mukhang legit naman ang data.',
];

const COMMENT_TEXTS = [
  'Makes sense, salamat sa paliwanag.',
  'I will believe it when I see it on the ground.',
  'This is actually good news for a change.',
  'Hindi dapat one-time lang. Needs follow-through.',
  'Finally some clarity. Been waiting for this.',
  'Mukhang political timing lang, let us be honest.',
  'Helpful breakdown, sharing this.',
  'Context matters — glad someone spelled it out.',
];

// Platform order mirrors the web: Facebook, X, Reddit, YouTube (then Instagram, unavailable).
const SOCIAL = [
  { code: 'FACEBOOK', name: 'Facebook' },
  { code: 'TWITTER', name: 'X' },
  { code: 'REDDIT', name: 'Reddit' },
  { code: 'YOUTUBE', name: 'YouTube' },
] as const;

const ONLINE_OUTLETS = OUTLETS.filter((o) => o.medium === 'ONLINE_NEWS');

const fmtDate = (hoursBack: number): string => {
  const d = new Date(`${TODAY}T12:00:00Z`);
  d.setUTCHours(d.getUTCHours() - hoursBack);
  const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${mon} ${d.getUTCDate()} ${hh}:${mm}`;
};

const share = (count: number, total: number) => ({
  count,
  pct: total > 0 ? Math.round((count / total) * 100) : 0,
});

// Objective comment sentiment from a sampled total, with a lean.
const makeTone = (
  rand: Rand,
  total: number,
  lean: ToneKey,
): IPeriodTone => {
  const base = { positive: 0.3, neutral: 0.34, negative: 0.36 };
  const weights =
    lean === 'negative'
      ? { positive: 0.1, neutral: 0.2, negative: 0.7 }
      : lean === 'positive'
        ? { positive: 0.62, neutral: 0.26, negative: 0.12 }
        : base;
  const jitter = (w: number) => w * (0.85 + rand() * 0.3);
  const wp = jitter(weights.positive);
  const wn = jitter(weights.neutral);
  const wg = jitter(weights.negative);
  const sum = wp + wn + wg;
  const neg = Math.round((wg / sum) * total);
  const neu = Math.round((wn / sum) * total);
  const pos = Math.max(0, total - neg - neu);
  return {
    total,
    positive: share(pos, total),
    neutral: share(neu, total),
    negative: share(neg, total),
  };
};

const toneRead = (t: IPeriodTone): string => {
  const sides: { key: ToneKey; pct: number }[] = [
    { key: 'negative', pct: t.negative.pct },
    { key: 'neutral', pct: t.neutral.pct },
    { key: 'positive', pct: t.positive.pct },
  ];
  const lead = sides.reduce((a, b) => (b.pct > a.pct ? b : a));
  const strength = lead.pct >= 70 ? 'Overwhelmingly' : lead.pct >= 50 ? 'Mostly' : 'Leans';
  return `${strength} ${lead.key}. ${lead.pct}% of ${t.total} sampled comments, objective reading.`;
};

// Shares for all eight tracked emotions (Plutchik), in EMOTIONS order so the radar
// spokes stay fixed; the lead emotion gets a boost. Normalised to total 100.
const makeEmotions = (rand: Rand, lead: string): IEmotionShare[] => {
  const weights = EMOTIONS.map((label) => (label === lead ? 3 : 1) * (0.4 + rand()));
  const sum = weights.reduce((a, b) => a + b, 0);
  const shares = weights.map((w) => Math.round((w / sum) * 100));
  const leadIdx = Math.max(0, EMOTIONS.indexOf(lead));
  shares[leadIdx] += 100 - shares.reduce((a, b) => a + b, 0); // absorb rounding drift
  return EMOTIONS.map((label, i) => ({ label, pct: Math.max(0, shares[i]) }));
};

const makeAlignment = (rand: Rand, total: number): IStoryAlignment => {
  const placed = Math.max(6, Math.round(total * (0.3 + rand() * 0.2)));
  const withN = intBetween(rand, Math.round(placed * 0.2), Math.round(placed * 0.5));
  const againstN = intBetween(rand, Math.round(placed * 0.2), Math.round(placed * 0.45));
  const splitN = Math.max(0, placed - withN - againstN);
  const pct = (n: number) => Math.round((n / placed) * 100);
  const sides: { side: IStoryAlignment['lead']; n: number }[] = [
    { side: 'with', n: withN },
    { side: 'split', n: splitN },
    { side: 'against', n: againstN },
  ];
  const lead = sides.reduce((a, b) => (b.n > a.n ? b : a)).side;
  const withPct = pct(withN);
  const ACTIONS: Record<IStoryAlignment['lead'], { type: string; text: string }> = {
    with: { type: 'Reinforce', text: 'Keep reinforcing the explanatory frame; it is landing.' },
    split: { type: 'Clarify', text: 'A clear second-day data point would settle the undecided middle.' },
    against: { type: 'Address', text: 'Get ahead of the main objection before it hardens.' },
  };
  const act = ACTIONS[lead];
  // Split each stance by conviction for the quadrant; the middle (split) sits with the
  // hedged cells as conditional support / lingering doubt.
  const strongWith = Math.round(withN * (0.35 + rand() * 0.2));
  const strongAgainst = Math.round(againstN * (0.35 + rand() * 0.2));
  return {
    withPct,
    splitPct: pct(splitN),
    againstPct: pct(againstN),
    lead,
    leadPct: pct(sides.find((s) => s.side === lead)!.n),
    placed,
    total,
    read: `${withPct}% align with the story — ${placed} of ${total} comments took a position.`,
    card: `About ${withPct}% of scored comments read as aligned with the story.`,
    action: act.text,
    actionType: act.type,
    detail: `The "with" camp accepts the framing, while the "against" camp pushes back on timing and scope. Most of the split is conditional support waiting on follow-through.`,
    quadrants: {
      backedConditions: withN - strongWith + Math.round(splitN * 0.6),
      backedMeant: strongWith,
      pushedDoubt: againstN - strongAgainst + Math.round(splitN * 0.4),
      pushedMeant: strongAgainst,
    },
    platforms: ['Facebook', 'X', 'Reddit', 'YouTube'].map((name) => ({
      name,
      pct: rand() < 0.3 ? null : intBetween(rand, 38, 88),
    })),
  };
};

const TRUST_ROLES = ['Journalists', 'Economists', 'Officials', 'Ordinary consumers'];

const makeTrust = (rand: Rand): ITrustRole[] =>
  TRUST_ROLES.map((role) => {
    const trust = intBetween(rand, 42, 88);
    return { role, pct: intBetween(rand, 12, 34), trust, distrust: 100 - trust };
  }).sort((a, b) => b.trust - a.trust);

// The cited sources behind the `[^n]` markers sprinkled through the prose below.
const storyFootnotes = (s0: string, s1: string, themeLabel: string): IStoryFootnote[] => [
  {
    n: 1,
    label: 'Online · Rappler',
    source: 'Rappler',
    title: `${s0} leads ${themeLabel} rollout, report says`,
    preview: `Rappler framed the move as a measured, explanatory step rather than a competitive flashpoint, quoting official figures throughout.`,
    url: 'https://www.rappler.com/',
  },
  {
    n: 2,
    label: 'Online · Inquirer',
    source: 'Inquirer.net',
    title: `What the ${themeLabel} push means for subscribers`,
    preview: `Inquirer.net led with the practical impact on households and the sector's near-term plans, keeping the tone explanatory.`,
    url: 'https://newsinfo.inquirer.net/',
  },
  {
    n: 3,
    label: 'Broadsheet · Philippine Star',
    source: 'The Philippine Star',
    title: `Analysts weigh ${s0}'s positioning`,
    preview: `The Star added analyst reaction and context, staying close to official numbers and avoiding speculation.`,
    url: 'https://www.philstar.com/',
  },
  {
    n: 4,
    label: 'TV · GMA-7',
    source: 'GMA-7',
    title: `${s0} featured in the evening segment`,
    preview: `GMA-7 recapped the key figures in a short, neutral segment aired in the early evening, with ${s1} mentioned in passing.`,
    url: 'https://www.gmanetwork.com/news/',
  },
  {
    n: 5,
    label: 'Online · ABS-CBN News',
    source: 'ABS-CBN News',
    title: `${s0} update draws steady online interest`,
    preview: `ABS-CBN's online desk tracked the story through the day, noting sustained rather than spiking traffic.`,
    url: 'https://news.abs-cbn.com/',
  },
  {
    n: 6,
    label: 'Broadsheet · Manila Bulletin',
    source: 'Manila Bulletin',
    title: `${themeLabel} rollout: what comes next`,
    preview: `The Bulletin placed the announcement in the sector's longer arc and flagged the likely second-day angles.`,
    url: 'https://mb.com.ph/',
  },
  {
    n: 7,
    label: 'Online · GMA News Online',
    source: 'GMA News Online',
    title: `Explainer: ${s0}'s announcement in plain terms`,
    preview: `GMA News Online broke the news down into household terms — pricing, coverage areas and timelines.`,
    url: 'https://www.gmanetwork.com/news/',
  },
  {
    n: 8,
    label: 'Radio · DZBB',
    source: 'DZBB',
    title: `${s0} discussed on the morning program`,
    preview: `DZBB's morning program walked listeners through the announcement and took reaction calls.`,
    url: 'https://www.gmanetwork.com/news/dzbb/',
  },
  {
    n: 9,
    label: 'Social · Facebook',
    source: 'Consumer page (Facebook)',
    title: `"So ano'ng mangyayari sa bill namin?"`,
    preview: `A widely-shared consumer-page post asked what the change means for everyday subscribers; replies were mostly practical.`,
    url: 'https://www.facebook.com/',
  },
  {
    n: 10,
    label: 'Social · X',
    source: '@tech_analyst_ph',
    title: `Thread: reading the ${s0} vs ${s1} move`,
    preview: `An analyst thread compared the two players head to head, though it stayed a minority read in the wider conversation.`,
    url: 'https://x.com/',
  },
  {
    n: 11,
    label: 'Online · BusinessWorld',
    source: 'BusinessWorld',
    title: `${s0} milestone seen as incremental progress`,
    preview: `BusinessWorld treated the announcement as a milestone in an ongoing rollout rather than a one-off event.`,
    url: 'https://www.bworldonline.com/',
  },
  {
    n: 12,
    label: 'TV · TV5',
    source: 'TV5',
    title: `${s0} in the late bulletin`,
    preview: `TV5's late bulletin carried a brief recap, keeping to the announced figures.`,
    url: 'https://www.tv5.com.ph/',
  },
];

const execSummary = (title: string, s0: string, s1: string, themeLabel: string) => ({
  summary: `${title} was one of the week's most-tracked ${themeLabel} stories, with press coverage and online conversation building together[^1]. ${s0} sits at the centre of the reporting, and the early framing leans explanatory rather than adversarial[^2].`,
  whyItMatters: `Where the ${themeLabel} narrative settles this week shapes how audiences and stakeholders read every follow-on story. A clear read now avoids correcting the record later.`,
  whatsNext: `Expect broadsheet follow-ups and a second wave of explainer threads over the next few days. Watch whether ${s1} enters the frame and shifts the tone.`,
  whatHappened: `${s0} is at the centre of the story; reporting stayed close to the facts and official figures.`,
  impact: `Sets the ${themeLabel} narrative for the week and frames how follow-on stories are read.`,
  who: `${s0}, ${s1}`,
});

// The narrative lens — the five sections the web story page shows, in order. (Generic
// mock prose; the real app fills these from BE-authored content.)
const narrativeSections = (
  title: string,
  s0: string,
  s1: string,
  themeLabel: string,
): IStoryNarrativeSection[] => [
  {
    key: 'the_story',
    label: 'The story',
    paras: [
      `Online outlets opened the story and set the initial frame, with ${s0} named as the primary actor[^1]. Broadsheets followed within a day, adding context and reaction from analysts, and broadcast segments recapped the key figures through the week[^4].`,
      `Across social, the conversation tracked the headlines closely. Most posts relayed the news straight, while a smaller cluster questioned what it means on the ground — one popular reply just asked ==“ano'ng mababago sa amin?”==[^9]. ${s1} surfaced in replies but never took over the thread[^5].`,
    ],
    themes: [
      {
        title: 'Explain-first framing',
        text: `Reporters led with what changed and why, not with blame — a sign the story is being read as information rather than controversy[^2].`,
      },
      {
        title: 'Steady, not spiking',
        text: `Volume rose gradually rather than in a single burst, pointing to sustained interest instead of a one-day flare[^5].`,
      },
    ],
  },
  {
    key: 'key_cross_channel_themes',
    label: 'Cross-channel themes',
    paras: [
      `The same handful of threads ran across press, broadcast and social, each carried by a different mix of outlets and accounts[^3].`,
    ],
    themes: [
      {
        title: 'Coverage on the merits',
        text: `Press and online coverage stayed close to the announced figures, with ${s0} framed as delivering rather than reacting[^1][^6].`,
      },
      {
        title: 'Consumer impact',
        text: `Explainer posts translated the news into household terms — pricing, rollout areas and timelines — which drove most of the shares[^7][^9].`,
      },
      {
        title: 'Competitive read',
        text: `A quieter thread compared ${s0} and ${s1} head to head, though no single post set the tone for it[^10].`,
      },
    ],
  },
  {
    key: 'key_voices_communities',
    label: 'Key voices and communities',
    paras: [
      `Three communities shaped the conversation, each reading the story through its own lens[^8].`,
    ],
    themes: [
      {
        title: '1. Consumer advocates',
        text: `**Primary Narrative**\nOrdinary subscribers and consumer pages led the volume, weighing the announcement against day-to-day service and asking what changes on the ground[^9].\n\n**Notable Content**\nA widely-shared page post asked ==“So ano'ng mangyayari sa bill namin?”==, and most replies stayed practical rather than political[^5].\n\n**Relevance**\nThis is the community whose read decides whether the rollout lands as good news on the ground.`,
      },
      {
        title: '2. Industry watchers',
        text: `**Primary Narrative**\nAnalysts and tech reporters placed the move in the sector's longer arc, treating it as a milestone rather than a one-off[^11].\n\n**Notable Content**\nAn analyst thread read it as ==a competitive signal more than a consumer win==, a sharp but minority take[^10].\n\n**Relevance**\nTheir framing shapes how the trade press and investors read the next update.`,
      },
      {
        title: '3. Official channels',
        text: `**Primary Narrative**\n${s0}'s own pages and partner accounts amplified the story with straight, on-message posts that set the baseline framing[^1].\n\n**Notable Content**\nThe official posts set the figures most explainer content then reused, keeping the numbers consistent across channels.\n\n**Relevance**\nThey are the source of record, so their wording anchors the rest of the conversation.`,
      },
    ],
  },
  {
    key: 'strategic_relevance_recommendations',
    label: 'Strategic relevance and recommendations',
    paras: [
      `Where the ${themeLabel} narrative settles this week shapes how audiences and stakeholders read every follow-on story. The current read is favourable and broad-based, which is the moment to reinforce rather than defend[^3].`,
      `The main risk is drift: without a clear second-day angle, coverage could fragment and the positive framing could soften. A single concrete data point or spokesperson keeps the story anchored[^6].`,
    ],
    recommendations: [
      `Lead the next update with one concrete, verifiable figure so the explanatory framing holds and reporters have a clean line to quote[^2].`,
      `Offer a named spokesperson for the consumer-impact angle, where most of the sharing is happening, before the thread fragments[^9].`,
      `Monitor the ${s1} comparison thread and keep context ready, but do not elevate it while it stays a minority read[^10].`,
    ],
  },
  {
    key: 'contextual_landscape',
    label: 'Contextual landscape',
    paras: [
      `This announcement lands in a week of steady ${themeLabel} news rather than a crisis cycle, so it reads as part of an ongoing rollout story instead of a standalone event[^11].`,
      `${s0} has carried similar coverage before, and the audience is primed to read these updates as incremental progress. ${s1} remains the natural point of comparison, and broadsheet follow-ups over the next few days will likely revisit both[^4][^12].`,
    ],
  },
];

// Narrative sections that carry the emotion/top-accounts footer row.
const SUPPORT_SECTION_KEYS = new Set([
  'the_story',
  'key_cross_channel_themes',
  'key_voices_communities',
]);

const COVERAGE_MEDIA: { label: string; code: string; verb: string; missing: number }[] = [
  { label: 'Online news', code: 'ONLINE_NEWS', verb: 'carried the story early and framed it around', missing: 2 },
  { label: 'Broadsheet', code: 'BROADSHEET', verb: 'added analysis and official reaction around', missing: 1 },
  { label: 'TV', code: 'TV', verb: 'recapped the key figures in segments on', missing: 3 },
];

const coverageWriteups = (
  s0: string,
  s1: string,
  themeLabel: string,
): ICoverageWriteup[] =>
  COVERAGE_MEDIA.map(({ label, code, verb, missing }) => {
    const cited = OUTLETS.filter((o) => o.medium === code).slice(0, 2);
    const mediumShort = label === 'Online news' ? 'Online' : label;
    return {
      label,
      summary: `${label} ${verb} ${s0}, with straight reporting and measured headlines.`,
      relevance: `Keeps ${s0} associated with a credible, non-adversarial ${themeLabel} story — useful for the week's positioning[^3].`,
      watch: [
        `Whether ${s1} is pulled into the ${label.toLowerCase()} coverage.`,
        `Any shift from explanatory to critical framing in the ${themeLabel} follow-ups.`,
      ],
      analysis: `${label} outlets stayed close to the facts, quoting official figures and avoiding speculation[^4]. Tone read as neutral-to-positive across the sampled items.`,
      clippings: cited.map((o) => `${mediumShort} · ${o.name}`),
      clippingsMissing: missing,
    };
  });

const socialWriteup = (name: string, s0: string, themeLabel: string): ISocialWriteup => ({
  summary: `On ${name}, the story spread through news pages and explainer posts. Reaction was mostly supportive, with a sceptical minority questioning the timing.`,
  why: `${name} is where the general audience forms its first impression of this story, so the tone here carries into later ${themeLabel} coverage.`,
  next: `Expect a second wave of reaction once the broadsheet follow-ups land; watch the reply threads for emerging doubts about ${s0}.`,
  story: `${name} users engaged by sharing the headline and tagging others, with the busiest threads forming each evening.`,
  analysis: `${name} comments lean supportive, welcoming the development while asking for it to hold over time.`,
  engagementMix: `Likes dominate the mix on ${name}, with comments concentrated in a few high-reach threads.`,
});

const makeArticles = (
  rand: Rand,
  id: string,
  title: string,
  s0: string,
  themeLabel: string,
  count: number,
): IArticleItem[] =>
  Array.from({ length: count }, (_, i) => {
    const outlet = ONLINE_OUTLETS[i % ONLINE_OUTLETS.length];
    return {
      id: `${id}-art-${i}`,
      title: i % 3 === 0 ? title : `${title}: ${s0} weighs in`,
      publication: outlet.name,
      medium: outlet.mediumLabel,
      date: fmtDate(i * 8 + intBetween(rand, 0, 5)),
      ave: intBetween(rand, 40_000, 900_000),
      searchVisits: intBetween(rand, 300, 48_000),
      sentiment: pick(rand, SENTIMENTS),
    };
  });

const PROGRAMS = [
  'Prime-time News', 'Morning Show', 'Business Hour', 'Headline Block',
  'Public Affairs', 'News Desk', 'Op-Ed',
];

// "Where it ran" — outlets across mediums, busiest first.
const makeCoverageOutlets = (rand: Rand, count: number): IOutletCount[] =>
  OUTLETS.slice(0, Math.min(8, Math.max(3, count)))
    .map((o) => ({ name: o.name, count: intBetween(rand, 1, 6) }))
    .sort((a, b) => b.count - a.count);

// "Voices in the press" — anchors/authors and where they ran.
const makeCoverageAuthors = (rand: Rand, count: number): ICoverageAuthor[] =>
  AUTHORS.slice(0, Math.min(5, Math.max(1, Math.ceil(count / 2))))
    .map((name, i) => ({
      name,
      outlet: OUTLETS[i % OUTLETS.length].name,
      program: pick(rand, PROGRAMS),
      articles: intBetween(rand, 1, 5),
    }))
    .sort((a, b) => b.articles - a.articles);

// "Articles by medium" — counts per medium, online-heavy.
const MEDIUM_SHARE = [0.5, 0.2, 0.12, 0.1, 0.08];
const makeByMedium = (rand: Rand, articles: number): { medium: string; count: number }[] =>
  MEDIUMS.map(({ label }, i) => ({
    medium: label,
    count: Math.max(1, Math.round(articles * MEDIUM_SHARE[i] + rand() * 2)),
  })).sort((a, b) => b.count - a.count);

const makeCoverageKeywords = (rand: Rand, s0: string, s1: string): ICoverageKeyword[] =>
  [s0, s1, 'subscribers', 'rollout', 'regulator', 'coverage']
    .map((keyword) => ({ keyword, count: intBetween(rand, 4, 90) }))
    .sort((a, b) => b.count - a.count);

const BROADCAST_OUTLETS = OUTLETS.filter((o) =>
  ['TV', 'RADIO', 'BROADSHEET', 'TABLOID'].includes(o.medium),
);

// Broadcast/print "Clippings".
const makeClippings = (rand: Rand, id: string, count: number): ICoverageClip[] =>
  Array.from({ length: Math.min(6, Math.max(0, count)) }, (_, i) => {
    const o = BROADCAST_OUTLETS[i % BROADCAST_OUTLETS.length];
    return {
      id: `${id}-clip-${i}`,
      outlet: o.name,
      medium: o.mediumLabel,
      program: pick(rand, PROGRAMS),
      date: fmtDate(i * 10 + intBetween(rand, 0, 6)),
    };
  });

const makePosts = (
  rand: Rand,
  id: string,
  title: string,
): IPostItem[] =>
  SOCIAL.flatMap(({ code }, p) =>
    Array.from({ length: p < 2 ? 3 : 2 }, (_, i) => {
      const likes = intBetween(rand, 80, 14_000);
      return {
        id: `${id}-post-${code}-${i}`,
        platform: code,
        author: `@${pick(rand, HANDLES)}`,
        text:
          code === 'YOUTUBE' || code === 'REDDIT'
            ? `${title} — explained. ${pick(rand, POST_TEXTS)}`
            : pick(rand, POST_TEXTS),
        date: fmtDate(i * 5 + p + intBetween(rand, 0, 3)),
        likes,
        comments: intBetween(rand, 4, 900),
        shares: intBetween(rand, 0, 1_500),
        views: likes * intBetween(rand, 8, 24),
      };
    }),
  ).sort((a, b) => b.likes - a.likes);

const SENTIMENTS: ToneKey[] = ['positive', 'neutral', 'positive', 'neutral', 'negative', 'positive'];

const makeComments = (rand: Rand, id: string, posts: IPostItem[]): IStoryComment[] =>
  Array.from({ length: 10 }, (_, i) => {
    const platform = pick(rand, SOCIAL);
    const post = posts.length ? pick(rand, posts) : null;
    return {
      id: `${id}-cmt-${i}`,
      author: `@${pick(rand, HANDLES)}`,
      text: pick(rand, COMMENT_TEXTS),
      platform: platform.name,
      likes: intBetween(rand, 0, 560),
      replies: intBetween(rand, 0, 60),
      shares: intBetween(rand, 0, 40),
      sentiment: pick(rand, SENTIMENTS),
      emotion: pick(rand, EMOTIONS),
      postTitle: post ? post.text.slice(0, 90) : card_title_unavailable(id),
    };
  }).sort((a, b) => b.likes - a.likes);

// Fallback source-post label when a story has no posts.
const card_title_unavailable = (id: string): string => `Story ${id}`;

// ── Hour by hour (article/post counts by channel) ────────────────────────────
const HOUR_WEIGHTS = [2, 1, 1, 1, 1, 2, 4, 7, 11, 14, 15, 14, 13, 12, 12, 13, 14, 15, 13, 10, 8, 6, 4, 3];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const hourlyChannel = (rand: Rand, total: number): number[] => {
  const jit = HOUR_WEIGHTS.map((w) => w * (0.6 + rand() * 0.8));
  const sum = jit.reduce((a, b) => a + b, 0) || 1;
  return jit.map((w) => Math.round((w / sum) * total));
};

const makeHourly = (rand: Rand): IStoryHourlyDay[] =>
  [2, 1, 0].map((back) => {
    const d = new Date(`${TODAY}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - back);
    return {
      date: d.toISOString().slice(0, 10),
      label: `${DOW[d.getUTCDay()]} ${d.getUTCDate()}`,
      broadcast: hourlyChannel(rand, intBetween(rand, 2, 10)),
      online: hourlyChannel(rand, intBetween(rand, 8, 30)),
      social: hourlyChannel(rand, intBetween(rand, 20, 90)),
      print: intBetween(rand, 1, 6),
    };
  });

const makeKeyVoices = (rand: Rand): IKeyVoice[] =>
  SOCIAL.map(({ name }) => ({
    handle: `@${pick(rand, HANDLES)}`,
    platform: name,
    comments: intBetween(rand, 20, 120),
    interactions: intBetween(rand, 600, 42_000),
    leadEmotion: pick(rand, EMOTIONS),
    leadPct: intBetween(rand, 30, 55),
    neg: intBetween(rand, 0, 55),
    pos: intBetween(rand, 20, 60),
  })).sort((a, b) => b.interactions - a.interactions);

export const getStoryDetail = (id: string): IStoryDetail | null => {
  // id shape: story-<newsletterId>-<index>
  const match = /^story-(.+)-(\d+)$/.exec(id);
  if (!match) return null;
  const newsletterId = match[1];
  const card = getStories(newsletterId, presetRange('7d')).find((s) => s.id === id);
  if (!card) return null;

  const n = nlById(newsletterId);
  const themeLabel = THEME_LABEL[n.theme];
  const subjects = SUBJECTS[n.theme];
  const [s0, s1] = subjects;
  const rand = rngFor(`detail:${id}`);

  // Sentiment leans with the card's emotion so the narrative and chart agree.
  const negativeEmotions = ['Fear', 'Sadness', 'Disgust', 'Anger'];
  const lean: ToneKey = card.emotion && negativeEmotions.includes(card.emotion)
    ? 'negative'
    : 'positive';
  const sampled = Math.max(20, Math.min(card.comments, intBetween(rand, 120, 200)));
  const tone = makeTone(rand, sampled, lean);
  const sentiment: IStorySentiment = {
    tone,
    // Persona-aligned reads a touch more favourable than the objective tone.
    personaTone: makeTone(rand, sampled, lean === 'negative' ? 'neutral' : 'positive'),
    read: toneRead(tone),
    reactionsAnalysis: `Across platforms the reaction is ${
      lean === 'positive' ? 'more supportive than not' : 'more critical than supportive'
    }, with ${(card.emotion ?? 'concern').toLowerCase()} the dominant note. Doubt is present but confined to a vocal minority.`,
    emotions: makeEmotions(rand, card.emotion ?? pick(rand, EMOTIONS)),
    emotionNote: `${card.emotion ?? 'Mixed'} leads the emotional read across ${sampled} classified comments.`,
  };

  const alignment = makeAlignment(rand, sampled);
  const postShares = [0.46, 0.3, 0.14, 0.1];
  const platforms: ISocialPlatformTab[] = [
    ...SOCIAL.map((p, i) => ({
      name: p.name,
      postCount: Math.max(1, Math.round(card.posts * postShares[i])),
      available: true,
    })),
    { name: 'Instagram', postCount: 0, available: false },
  ];
  const writeups: Record<string, ISocialWriteup> = {};
  const sentimentByPlatform: Record<string, IPeriodTone> = {};
  const alignmentByPlatform: Record<string, string | null> = {};
  for (const { name } of SOCIAL) {
    writeups[name] = socialWriteup(name, s0, themeLabel);
    const t = makeTone(rand, intBetween(rand, 12, 40), lean);
    sentimentByPlatform[name] = t;
    alignmentByPlatform[name] =
      t.total >= 24
        ? `${intBetween(rand, 32, 60)}% of the ${Math.round(t.total * 0.4)} ${name} comments that took a position backed the story.`
        : null;
  }

  const trust = makeTrust(rand);
  const topRole = trust[0].role;
  const trustSummary: ITrustSummary = {
    card: `Commenters lean on ${topRole.toLowerCase()} and the press to judge this story.`,
    actionType: 'Engage the source',
    action: `Route the follow-up through a credible ${topRole.toLowerCase().replace(/s$/, '')} or official.`,
    trusted: [
      `${trust[0].role} — "the figures hold up on a closer read"`,
      `${trust[1].role} — "this squares with the official data"`,
    ],
    distrusted: [`${trust[trust.length - 1].role} — "convenient timing; I'll wait for proof"`],
  };
  const topOutlets: IOutletCount[] =
    card.articles > 0
      ? ONLINE_OUTLETS.slice(0, 3).map((o) => ({ name: o.name, count: intBetween(rand, 1, 4) }))
      : [];
  const posts = makePosts(rand, id, card.title);

  return {
    ...card,
    persona: pick(rand, PERSONAS),
    velocity: intBetween(rand, 40, 9_000),
    momentum: intBetween(rand, -220, 240),
    ave: card.articles > 0 ? intBetween(rand, 120_000, 4_200_000) : 0,
    outlets: card.articles > 0 ? Math.min(card.articles, intBetween(rand, 2, 9)) : 0,
    storyValue: card.articles > 0 ? intBetween(rand, 3, 10) : 0,
    mainFocus: card.articles > 0 ? Math.max(1, Math.round(card.articles * (0.5 + rand() * 0.4))) : 0,
    negativeTone: intBetween(rand, 8, 38),
    keywordHits: intBetween(rand, 40, 620),
    adValue: card.adValue, // legacy AVE lines, reconciled with the feed card
    prValue: card.prValue,
    hourly: makeHourly(rand),
    undatedArticles: intBetween(rand, 0, 900),
    undatedPosts: intBetween(rand, 0, 300),
    footnotes: storyFootnotes(s0, s1, themeLabel),
    exec: execSummary(card.title, s0, s1, themeLabel),
    narrative: narrativeSections(card.title, s0, s1, themeLabel).map((sec) => ({
      ...sec,
      // The emotion/accounts footer fits the audience-reaction sections, not the
      // advice (Strategic relevance) or background (Contextual landscape) ones.
      support: SUPPORT_SECTION_KEYS.has(sec.key)
        ? {
            emotion: pick(rand, EMOTIONS),
            emotionPct: intBetween(rand, 28, 52),
            tone: lean,
            tonePct: intBetween(rand, 42, 68),
            topAccounts: [`@${pick(rand, HANDLES)}`, `@${pick(rand, HANDLES)}`],
          }
        : undefined,
    })),
    sentiment,
    alignment,
    trust,
    trustSummary,
    topOutlets,
    coverage: {
      writeups: card.articles > 0 ? coverageWriteups(s0, s1, themeLabel) : [],
      outlets: card.articles > 0 ? makeCoverageOutlets(rand, card.articles) : [],
      articles: makeArticles(rand, id, card.title, s0, themeLabel, card.articles),
      authors: card.articles > 0 ? makeCoverageAuthors(rand, card.articles) : [],
      keywords: card.articles > 0 ? makeCoverageKeywords(rand, s0, s1) : [],
      clippings: card.articles > 0 ? makeClippings(rand, id, Math.round(card.articles * 0.5)) : [],
      byMedium: card.articles > 0 ? makeByMedium(rand, card.articles) : [],
    },
    social: {
      platforms,
      writeups,
      sentimentByPlatform,
      alignmentByPlatform,
      posts,
      comments: makeComments(rand, id, posts),
      keyVoices: makeKeyVoices(rand),
    },
  };
};
