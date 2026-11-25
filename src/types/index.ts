// Mobile view-models. Screens consume these directly; the API service maps either
// mock data or (later) real backend responses onto them, so the UI never changes.

// ─── Newsletter tree ────────────────────────────────────────────────────────
export interface IBucket {
  id: number;
  name: string;
}
export interface INewsletter {
  id: string;
  name: string;
  theme: NewsletterTheme;
  buckets: IBucket[];
}
export type NewsletterTheme = 'telco' | 'banking' | 'government' | 'general';

// ─── Newsletter tree (switcher) ─────────────────────────────────────────────
// Newsletters with per-newsletter and per-bucket story counts, as the web's
// NewsletterTree shows. Maps to the real `GET /tree` later.
export interface INewsletterTreeBucket {
  id: number;
  name: string;
  storyCount: number;
}
export interface INewsletterTreeItem {
  id: string;
  name: string;
  storyCount: number;
  buckets: INewsletterTreeBucket[];
}

// ─── Reports (report modules per bucket) ────────────────────────────────────
// Mirrors the web's reports feature (scoup_ui_v2 src/features/reports). A bucket's
// report is a set of modules grouped into four tracks, each toggled on/off, plus
// optional "monthly writeup goal" requirements. Maps to the real
// `GET/PUT /api/v1/chat/reports/preference/:bucketId` later; the mock serves the
// same view-model so the UI never changes.
export type ReportTrack = 'shared' | 'rep' | 'crisis' | 'ci';

export interface IReportModule {
  id: string;
  track: ReportTrack;
  name: string;
  toggled: boolean;
  note: string;
  content: string;
}

/** When a preference is a bucket GROUP (several buckets combined into one monthly
 * writeup) rather than a solo bucket, this block carries the group identity and its
 * member buckets. Undefined for a solo bucket. Mirrors the web's grouped-bucket
 * preference (report_preferences row with bucket_ids.length > 1). */
export interface IReportGroupScope {
  groupId: string;
  name: string;
  members: { bucketId: number; name: string }[];
}

export interface IReportPreference {
  bucketId: number;
  bucketName: string;
  newsletterId: string;
  newsletterName: string;
  promptGoals: string[];
  modules: IReportModule[];
  /** Present iff this preference is a bucket group. */
  group?: IReportGroupScope;
}

/** A bucket row in the Reports scope list, with its optional (non-always-on)
 * active/total module counts — the "7/11" badge. */
export interface IReportScopeBucket {
  bucketId: number;
  name: string;
  activeModules: number;
  totalModules: number;
}

/** A bucket GROUP row in the scope list. Counts are the group's own optional
 * module selection (seeded from a union of its members on create, then edited
 * independently) — the "GROUP 9/11" card in the web sidebar. */
export interface IReportScopeGroup {
  groupId: string;
  name: string;
  memberIds: number[];
  memberNames: string[];
  activeModules: number;
  totalModules: number;
}

export interface IReportScopeNewsletter {
  newsletterId: string;
  name: string;
  /** Bucket groups in this newsletter, listed above the solo buckets. */
  groups: IReportScopeGroup[];
  buckets: IReportScopeBucket[];
}

/** Module sort order on the config screen (mirrors the web's Sort dropdown). */
export type ReportSort = 'default' | 'name-asc' | 'status-on' | 'recommended';

// ─── Publishers (managed news outlets) ──────────────────────────────────────
// Mirrors the web's IPublisher. Maps to `GET /api/v1/publishers/` later; the mock
// layer serves the same shape so the UI never changes.
export type IPublisherStatus =
  | 'DoesNotExist'
  | 'Done'
  | 'Error'
  | 'Failed'
  | 'Processing'
  | 'Queued'
  | null;

export interface IPublisher {
  id: string;
  publisher_name: string;
  website_url: string;
  region?: string;
  created_by?: string;
  publisher_logo_url?: string;
  created_at?: string;
  updated_at?: string;
  status?: IPublisherStatus;
}

/** Name sort for the Publishers list (matches the web's `sort_by`). */
export type IPublisherSort = 'name_asc' | 'name_desc' | null;

// ─── Channels (Social Media Channels — the web's "influencers") ──────────────
// Social pages/groups/accounts tracked across platforms. Structurally "Publishers
// for social": same ingestion-status pipeline (reuses IPublisherStatus), plus a
// platform and a follower count. Maps to `/api/v1/influencer/` later.
export type ChannelPlatform = 'FACEBOOK' | 'TWITTER' | 'YOUTUBE' | 'REDDIT' | 'INSTAGRAM';

export interface IChannel {
  id: string;
  /** Display handle — a username, or "r/<subreddit>" for Reddit. */
  handle: string;
  /** Source name (optional display; e.g. "ABS-CBN News"). */
  name: string;
  profile_url: string;
  followers: number;
  platform: ChannelPlatform;
  status?: IPublisherStatus; // shared ingestion-status enum
  /** Avatar/thumbnail — the parent org's logo (favicon of its website). */
  logoUrl?: string;
}

/** Followers sort for the Channels list (the web's follower_count sort). */
export type IChannelSort = 'followers_desc' | 'followers_asc' | null;

// ─── Feed filters ───────────────────────────────────────────────────────────
/** Content source filter (All / MediaWatch / SharedView). */
export type Lens = 'all' | 'mw' | 'sv';
/** Level 2 — content type. */
export type MentionsTab = 'stories' | 'articles' | 'posts';
export type RangePreset = 'today' | '7d' | '30d';

// ─── Mentions: sort + advanced filters (mirrors the web's Rank-by + Filters) ──
/** Rank-by field for the Stories feed. */
export type RankBy = 'engagement' | 'articles' | 'posts' | 'comments';
export type Emphasis = 'all' | 'focus';
export type ToneKey = 'negative' | 'neutral' | 'positive';
export type CommentSentiment = 'all' | 'neg' | 'neu' | 'pos';

export interface IMentionsFilters {
  mediums: string[]; // MEDIUMS codes
  emphasis: Emphasis;
  tones: ToneKey[];
  storyValueMin: number; // 0 = any
  platforms: string[]; // PLATFORMS codes
  commentSentiment: CommentSentiment;
  days: string[]; // yyyy-MM-dd within the reporting period
  outlets: string[]; // outlet names
}

// ─── Story card (Mentions → Stories) ────────────────────────────────────────
export interface IStoryCard {
  id: string;
  bucketId: number;
  bucketName: string;
  title: string;
  summary: string;
  /** Article image. Mock now; the real endpoint supplies this later (same field). */
  thumbnailUrl: string;
  articles: number;
  posts: number;
  comments: number;
  /** SharedView engagement score. */
  engScore: number;
  emotion: string | null;
  emotionPct: number | null;
  trend: 'up' | 'down' | 'flat';
  /** Legacy AVE lines (pesos); 0 → "Not known for this story". */
  adValue: number;
  prValue: number;
}

// ─── Story detail (Story page) ──────────────────────────────────────────────
// The rich, per-story view-model behind the Story page's Narrative / Social /
// Coverage tabs. Mirrors the depth of the web app's story page; maps to the real
// `GET /api/v2/topics/:id` (+ /references, /platform-breakdown, /resonance) later.
export interface IExecSummary {
  summary: string;
  whyItMatters: string;
  whatsNext: string;
  whatHappened: string;
  impact: string;
  who: string;
}
export interface IStoryTheme {
  title: string;
  text: string;
}
/** The footer row under a narrative section: leading emotion, tone and top accounts. */
export interface INarrativeSupport {
  emotion: string;
  emotionPct: number;
  tone: ToneKey;
  tonePct: number;
  topAccounts: string[];
}
export interface IStoryNarrativeSection {
  key: string;
  label: string;
  paras: string[];
  themes?: IStoryTheme[];
  /** "Strategic Recommendations" numbered list (strategic-relevance section only). */
  recommendations?: string[];
  support?: INarrativeSupport;
}
export interface IEmotionShare {
  label: string;
  pct: number;
}
/** Objective comment sentiment + the dominant emotions, as the web's charts show. */
export interface IStorySentiment {
  tone: IPeriodTone;
  /** The persona-aligned reading (the Objective/Persona toggle). */
  personaTone: IPeriodTone;
  read: string;
  /** The "Reactions and comments" write-up paragraph. */
  reactionsAnalysis: string;
  emotions: IEmotionShare[];
  emotionNote: string;
}
export type AlignmentSide = 'with' | 'split' | 'against';
export interface IStoryAlignment {
  withPct: number;
  splitPct: number;
  againstPct: number;
  lead: AlignmentSide;
  leadPct: number;
  placed: number;
  total: number;
  read: string;
  /** Headline sentence + a suggested action + the expandable "Where the positions sit" detail. */
  card: string;
  action: string;
  actionType: string;
  detail: string;
  /** Comments placed by stance × conviction, for the alignment quadrant. */
  quadrants: {
    backedConditions: number; // with the framing + hedged
    backedMeant: number; // with + stated plainly
    pushedDoubt: number; // against + hedged
    pushedMeant: number; // against + stated plainly
  };
  /** Per-platform "% with the story"; pct null = too few to read. */
  platforms: { name: string; pct: number | null }[];
}
export interface ITrustSummary {
  card: string;
  action: string;
  actionType: string;
  trusted: string[];
  distrusted: string[];
}
export interface IOutletCount {
  name: string;
  count: number;
}
export interface ITrustRole {
  role: string;
  pct: number;
  trust: number;
  distrust: number;
}
export interface ICoverageWriteup {
  label: string; // medium — "Online news", "Broadsheet", "TV"
  summary: string;
  relevance: string; // "Relevance to your priorities" callout
  watch: string[]; // "Things to watch" bullets
  analysis: string;
  clippings: string[]; // cited-clipping labels, e.g. "Online · Rappler"
  clippingsMissing: number; // cited clippings whose source isn't in this capture
}
/** "Voices in the press" row — an anchor/author with where they ran. */
export interface ICoverageAuthor {
  name: string;
  outlet: string;
  program: string; // program or section
  articles: number;
}
/** A broadcast/print clipping ("Clippings" section). */
export interface ICoverageClip {
  id: string;
  outlet: string;
  medium: string; // Broadsheet / TV / Radio ...
  program: string;
  date: string;
}
export interface ICoverageKeyword {
  keyword: string;
  count: number;
}
export interface ISocialWriteup {
  summary: string;
  why: string;
  next: string;
  story: string;
  analysis: string; // "Reaction and comment analysis"
  engagementMix: string; // "Engagement mix"
}
export interface ISocialPlatformTab {
  name: string; // display label — Facebook / X / YouTube / Reddit
  postCount: number;
  available: boolean;
}
export interface IStoryComment {
  id: string;
  author: string;
  text: string;
  platform: string;
  likes: number;
  replies: number;
  shares: number;
  sentiment: ToneKey;
  emotion: string;
  /** The post this comment sits under (its headline/text). */
  postTitle: string;
}

/** A day's hourly article/post counts by channel, for the "Hour by hour" chart. */
export interface IStoryHourlyDay {
  date: string; // yyyy-MM-dd
  label: string; // 'Wed 4'
  broadcast: number[]; // 24 values
  online: number[]; // 24 values
  social: number[]; // 24 values
  print: number;
}
export interface IKeyVoice {
  handle: string;
  platform: string;
  comments: number;
  interactions: number;
  /** Dominant emotion + its share, e.g. "Curiosity leads at 40%". */
  leadEmotion: string;
  leadPct: number;
  /** Comment sentiment split for the per-voice bar. */
  neg: number;
  pos: number;
}
/** A cited source behind a `[^n]` marker in the prose (web: the story's footnotes list). */
export interface IStoryFootnote {
  n: number; // the number shown in the inline chip
  label: string; // "Online · Rappler"
  source: string; // publication or @handle
  title: string; // headline / post title
  preview: string; // short content preview
  url: string; // external link opened on tap
}
export interface IStoryDetail extends IStoryCard {
  /** "Built for {persona}". */
  persona: string;
  /** SharedView velocity (engagements/hr) and momentum (shown as Acceleration). */
  velocity: number;
  momentum: number;
  /** MediaWatch key numbers (story page). */
  ave: number;
  outlets: number;
  storyValue: number; // 0–10 (0 = not measured)
  mainFocus: number; // articles where the story is the main focus
  negativeTone: number; // % of articles with negative tone
  keywordHits: number;
  adValue: number; // legacy AVE line (pesos); 0 → "Not known"
  prValue: number; // legacy PR value line (pesos); 0 → "Not known"
  // Narrative lens
  exec: IExecSummary;
  narrative: IStoryNarrativeSection[];
  sentiment: IStorySentiment;
  /** "Hour by hour" — article/post counts by channel across the recent days. */
  hourly: IStoryHourlyDay[];
  /** Online articles / social posts with no publish time, excluded from the hourly chart. */
  undatedArticles: number;
  undatedPosts: number;
  /** Cited sources behind the `[^n]` markers in the prose. */
  footnotes: IStoryFootnote[];
  alignment: IStoryAlignment;
  trust: ITrustRole[];
  trustSummary: ITrustSummary;
  /** Top outlets for the Across-both "Most coverage" line. */
  topOutlets: IOutletCount[];
  // Coverage lens
  coverage: {
    writeups: ICoverageWriteup[];
    outlets: IOutletCount[]; // "Where it ran"
    articles: IArticleItem[]; // "Online news"
    authors: ICoverageAuthor[]; // "Voices in the press"
    keywords: ICoverageKeyword[]; // "Keyword hits"
    clippings: ICoverageClip[]; // broadcast/print "Clippings"
    byMedium: { medium: string; count: number }[]; // "Articles by medium" chart
  };
  // Social lens
  social: {
    platforms: ISocialPlatformTab[];
    writeups: Record<string, ISocialWriteup>;
    sentimentByPlatform: Record<string, IPeriodTone>;
    /** Per-platform audience-alignment note, or null when there's no reading. */
    alignmentByPlatform: Record<string, string | null>;
    posts: IPostItem[];
    comments: IStoryComment[];
    keyVoices: IKeyVoice[];
  };
}

// ─── Live feed (Posts / Articles tabs) ──────────────────────────────────────
export interface IPostItem {
  id: string;
  platform: string; // FACEBOOK / TWITTER / ...
  author: string; // the account handle (@…), shown as "Account" in the feed
  text: string;
  date: string; // 'MMM D HH:mm'
  likes: number;
  comments: number;
  shares: number;
  views: number;
  // Feed only: the story this post is tied to (the web's "Story" column). Absent on
  // story-detail posts.
  storyId?: string;
  storyTitle?: string;
  // Feed only: some posts carry media; text-only posts have none.
  thumbnailUrl?: string;
}
export interface IArticleItem {
  id: string;
  title: string;
  publication: string;
  medium: string; // Broadsheet / Online news / ...
  date: string;
  ave: number | null;
  searchVisits: number | null; // Est. search visits (Ahrefs), online only
  sentiment: ToneKey; // article tone
  // Feed only (mirrors the web's Articles columns): Story value, Emphasis, and the story
  // this article belongs to. Absent on story-detail coverage articles.
  sv?: number | null;
  emphasis?: string | null;
  storyId?: string;
  storyTitle?: string;
  thumbnailUrl?: string;
}

// ─── This period (analytics panel) ──────────────────────────────────────────
export interface IToneShare {
  count: number;
  pct: number;
}
export interface IPeriodTone {
  total: number;
  positive: IToneShare;
  neutral: IToneShare;
  negative: IToneShare;
}
export interface IHeatDay {
  date: string; // yyyy-MM-dd
  label: string; // 'Thu 29'
  hours: number[]; // 24 values
  print: number;
  total: number;
}
export interface IMediumAve {
  medium: string;
  ave: number;
}
export interface IPlatformCount {
  platform: string; // display label
  count: number;
}
export interface IDeltaFigure {
  name: string;
  value: number;
  delta: number; // percent, signed
}
export interface IThisPeriod {
  from: string;
  to: string;
  results: number;
  resultsDelta: number;
  ave: number; // PHP
  pressBroadcast: number;
  topOutlet: IDeltaFigure;
  topAuthor: IDeltaFigure;
  tone: IPeriodTone;
  heat: IHeatDay[];
  byMedium: IMediumAve[];
  social: {
    posts: number;
    comments: number;
    byPlatform: IPlatformCount[];
  };
}

// ─── Local map ──────────────────────────────────────────────────────────────
export interface IMapArea {
  name: string; // city name matching the GeoJSON
  posts: number;
}
export interface ILocalMap {
  totalPosts: number;
  unplaced: number;
  areas: IMapArea[];
}
// ─── Dashboard story map (where the stories happened) ────────────────────────
export interface IStoryMapArea {
  code: string; // PSGC code (matches the GeoJSON)
  name: string; // display name ("Manila City")
  short: string; // native CITY_COORDS key (NCR only); '' otherwise
  region: string; // PSGC region code
  stories: number;
}
export interface IStoryMap {
  /** Story counts per place, keyed by PSGC code (what the web choropleth shades). */
  counts: Record<string, number>;
  areas: IStoryMapArea[];
  /** Total story-place incidences across all places. */
  total: number;
  placeCount: number;
  unplaced: number;
}

// ─── Dashboard charts (the web's MediaWatch chart stack) ─────────────────────
// Each field feeds one chart card; all scope to the selected place when one is picked.
export interface IDashLeader {
  name: string;
  count: number;
}
export interface IDashOverTime {
  days: { label: string; value: number }[];
  total: number;
  peak: { label: string; value: number };
  avgPerDay: number;
  busiestDay: string;
  lead: string; // the item leading the peak day (for the write-up)
}
export interface IDashKeyFigures {
  total: number;
  topPublisher: IDashLeader;
  topMedium: { label: string; count: number; pct: number };
  dominantSection: string;
  topAuthor: IDashLeader;
  busiestDay: { label: string; count: number };
  topTone: { label: string; pct: number };
  topEntity: IDashLeader;
}
export interface IDashMediumShare {
  medium: string;
  count: number;
  pct: number;
}
export interface IDashExposure {
  shares: IDashMediumShare[]; // sorted desc; mediums order used by byDay
  byDay: { label: string; values: number[] }[]; // values aligned to `shares`
}
export interface IDashTonality {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  byDay: { label: string; pos: number; neu: number; neg: number }[];
  peakNegDay: string;
}
export interface IDashPublisher {
  name: string;
  total: number;
  perDay: number[]; // aligned to IDashboardCharts.days
}
export type EntityType = 'Organisation' | 'Person' | 'Place';
export interface IDashEntity {
  name: string;
  count: number;
  type: EntityType;
}
export interface IDashboardCharts {
  days: string[]; // shared day labels, e.g. "Sat 17"
  overTime: IDashOverTime;
  keyFigures: IDashKeyFigures;
  exposure: IDashExposure;
  tonality: IDashTonality;
  topPublishers: IDashPublisher[]; // top 10 by total
  entities: IDashEntity[]; // top 10
}

// ─── Dashboard drill (tap a figure → its records + a short analysis) ─────────
// A single article behind a figure. Derived deterministically so a figure's records always
// sum back to the number shown (the web resolves these from the loaded stories; the mobile
// mock has only aggregates, so it synthesises a matching set).
export interface IDashRecord {
  id: string;
  title: string;
  outlet: string; // publisher / source name
  medium: string; // display label: 'TV' | 'Online news' | …
  date: string; // short day label, e.g. 'Nov 2'
  author: string;
  tone: ToneKey;
}
// One titled section of the Analysis tab — mirrors the web's AnalysisPanel PanelCard
// (bold title + sentence subtitle, an optional bold lede, bullets, then body paragraphs).
export interface IDashAnalysisSection {
  title: string; // "What the figure shows", "Behind the figure"
  subtitle?: string; // sentence-case descriptor under the title
  blurb?: string; // bold lede line (first section)
  bullets?: string[]; // short at-a-glance points
  paras: string[]; // body paragraphs
}
export interface IDashDrill {
  spec: string; // e.g. 'outlet:GMA-7', 'tone:Negative', 'day:Mon 2', 'total'
  title: string; // the figure's own label, e.g. 'GMA-7', 'TV', 'Negative'
  subtitle: string; // what kind of figure, e.g. 'Top publisher', 'Medium', 'Tonality'
  count: number;
  unit: string; // 'article'
  analysis: IDashAnalysisSection[]; // sectioned analysis (What the figure shows → Behind the figure)
  records: IDashRecord[];
  media: string[]; // distinct medium labels present (feeds the records filter)
}
export interface IFbPage {
  name: string;
  kind: 'page' | 'group';
  posts: number;
}
export interface IPlacePost {
  id: string;
  author: string;
  text: string;
  engagements: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}
export interface IRankedPlace {
  name: string;
  district: string;
  posts: number;
}
export interface IPlaceDetail {
  city: string;
  sentiment: { positive: number; neutral: number; negative: number } | null; // pct
  sentimentPostCount: number;
  mostPosts: IRankedPlace[];
  fbPages: IFbPage[];
  topPosts: IPlacePost[];
}

// ─── Map monitor ("Local" map tab) ───────────────────────────────────────────
// Mirrors the web app's Local map: a post-count choropleth of PH/NCR cities + four
// city-scoped panels (Sentiment, Most posts, Facebook pages & groups, Top posts) + a
// place-profile header. Tapping a city re-scopes every panel to it.
export interface IGeoMapArea {
  code: string; // PSGC code (matches the GeoJSON)
  name: string; // "Taguig City"
  short: string; // native CITY_COORDS key (NCR only); '' otherwise
  region: string; // PSGC region code
  district: string; // "NCR 4th District"
  posts: number;
}
export interface IGeoMap {
  counts: Record<string, number>; // posts per PSGC code (drives the choropleth + bubbles)
  areas: IGeoMapArea[];
  total: number; // all posts incl. unplaced
  placeCount: number;
  unplaced: number;
}

export type MapStance = 'ally' | 'neutral' | 'critic';
export type MapTone = 'pos' | 'neu' | 'neg';

export interface IMapSentiment {
  emotion: string; // dominant emotion, e.g. "Curiosity"
  positive: number; // %
  neutral: number; // %
  negative: number; // %
  comments: number; // comments read
  analysed: number; // posts those comments are on
}
export interface IMapRankedPlace {
  code: string;
  name: string;
  district: string;
  posts: number;
}
export interface IMapPage {
  id: string;
  name: string;
  kind: 'page' | 'group';
  followers: number;
  posts: number;
  comments: number;
  stance: MapStance;
  official: boolean;
}
export interface IMapPost {
  id: string;
  author: string;
  kind: 'page' | 'group';
  text: string;
  reactions: number;
  comments: number;
  shares: number;
  engagements: number;
  hoursAgo: number;
  tone: MapTone;
}
export interface IMapPlaceProfile {
  code: string;
  name: string;
  district: string;
  posts: number;
  engagements: number;
  reactions: number;
  comments: number;
  shares: number;
}
export interface IMapPlaceDetail {
  profile: IMapPlaceProfile;
  sentiment: IMapSentiment;
  mostPosts: IMapRankedPlace[];
  pages: IMapPage[];
  posts: IMapPost[];
}

// ─── Campaigns (the web app's "Evaluations") ─────────────────────────────────
// A campaign is evaluated against its brief, week by week. The list card view-model
// mirrors the web's ICampaignSummary (src/features/campaigns/types/campaigns.types.ts).
export type GoalStatus = 'good' | 'warn' | 'bad' | 'early';
export type CampaignPhaseKind = 'planning' | 'baseline' | 'live' | 'closed' | 'report';

export interface ICampaignPhase {
  phase: CampaignPhaseKind;
  big: string; // the status badge, e.g. "Day 27 of 31" / "No launch date"
  sub: string; // the sentence shown on the card when there are no figures yet
}
// One goal's health, as it reads on a card. Full figures live only on the detail screens.
export interface ICampaignGoalSummary {
  id: string;
  name: string;
  short: string; // the tiny label under the status square
  st: GoalStatus;
}
// ─── Campaign DETAIL (the Evaluation detail screens: Home / Goals / Report) ──
// A lean mock-backed view-model — the web composes these from feed/figures/sheets/
// readings payloads; mobile ships a reduced, hand-authored version per sample.
export type CampaignMoveDir = 'up' | 'down' | 'flat';

/** A "what changed since Monday" movement chip. */
export interface ICampaignMoveChip {
  text: string;
  dir: CampaignMoveDir;
}

/** One row of the "This week at a glance" table. */
export interface ICampaignGlanceRow {
  short: string;
  st: GoalStatus;
  now: string;
  since: string;
  forecast: string;
}

/** The Home / weekly-answer view-model. */
export interface ICampaignHome {
  decide: string; // "Decide this week" — what to do now
  since: ICampaignMoveChip[]; // what changed since Monday
  chain?: string; // the causal "why one moves the next" line
  story: string; // "The story so far"
  glance: ICampaignGlanceRow[];
}

/** One item behind a number (the evidence sheet's Items pane). */
export interface IEvidenceItem {
  headline: string;
  outlet: string;
  tone?: string; // free text, e.g. "Positive"
  summary?: string;
}

/** What opens when you tap a number — "every number opens its evidence". */
export interface ICampaignEvidence {
  title: string;
  story: string[]; // paragraphs explaining the number
  items: IEvidenceItem[];
}

/** A single bar in a goal's simple figure chart (View bars, not SVG). */
export interface ICampaignBar {
  label: string;
  value: number;
  mark?: number; // the brief target line
  highlight?: boolean; // the brand's own bar
}

/** A goal's full detail (the pushed goal page). */
export interface ICampaignGoalDetail {
  id: string;
  name: string;
  short: string;
  st: GoalStatus;
  big: string; // the headline number (opens its evidence)
  line: string; // one-line status
  reading: string; // the prose read
  target: string; // "To hit the target …"
  chanceMet: number; // forecast — chance of ending Met (0–100)
  forecastBand: string; // likely finish band, e.g. "36–41%"
  forecastNote: string;
  bars: ICampaignBar[];
  barMax: number; // the bars' axis max
  barUnit: string; // "%", "×", "" …
  evidence: ICampaignEvidence;
}

/** One section of the Report write-up. */
export interface ICampaignReportSection {
  heading: string;
  body: string;
}

export interface ICampaignReport {
  headline: string;
  sections: ICampaignReportSection[];
}

/** A goal row on the pre-launch brief read. */
export interface ICampaignBriefGoalRow {
  short: string;
  target: string;
}

/** The pre-launch Brief + Background read (shown when there are no figures yet). */
export interface ICampaignBriefRead {
  product: string;
  brand: string;
  competitor: string;
  launchLabel: string;
  windowLabel: string;
  locked: boolean;
  goals: ICampaignBriefGoalRow[];
  background: string;
}

export interface ICampaignDetail {
  id: string;
  name: string;
  brand: string;
  phase: ICampaignPhase;
  hasFigures: boolean; // live (Home/Goals/Report) vs pre-launch (Brief)
  onTrackCount: number;
  goalTotal: number;
  tooEarly: boolean;
  goalSummaries: ICampaignGoalSummary[]; // the Home status row
  home: ICampaignHome | null;
  goals: ICampaignGoalDetail[] | null;
  report: ICampaignReport | null;
  brief: ICampaignBriefRead | null;
}

/** The editable brief form for a draft evaluation (the lean "New evaluation" builder). */
export interface ICampaignDraftForm {
  id: string;
  product: string;
  brand: string;
  competitor: string;
  launch: string; // 'yyyy-MM-dd' or '' if not set
  goals: { short: string; target: string }[];
  locked: boolean;
}

/** Payload when saving/locking a draft brief. */
export interface ICampaignBriefInput {
  id: string;
  product: string;
  brand: string;
  competitor: string;
  launch: string;
  goals: { short: string; target: string }[];
}

// ─── Account usage (the web account menu's Usage panel) ──────────────────────
// Mirrors the web's user-usage response (prompt/completion/cache tokens + limit,
// buckets, stories). A null limit means "unlimited" (shown as "N used").
export interface IUserUsage {
  promptTokensUsed: number;
  completionTokensUsed: number;
  cacheTokensUsed: number;
  tokenLimit: number;
  bucketsUsed: number;
  bucketLimit: number | null;
  storiesUsed: number;
  storyLimit: number | null;
}

// ─── Usage & plan page (the full quota table, forecast-shaped) ───────────────
export type UsageGroup = 'tokens' | 'scrapes' | 'creation' | 'plan';
/** A token-composition share row (Write-ups / Chat / Analysis / Mail). */
export interface IUsageShare {
  key: string;
  label: string;
  share: number; // % of the token total
  color: string;
}
export interface IUsageQuotaMetric {
  group: UsageGroup;
  key: string;
  label: string;
  unit?: string;
  used: number;
  limit: number | null; // null = unlimited
  /** Present → the "unlimited with alert ticks" row variant (tokens/scrapes). */
  alertThresholds?: number[];
  /** Token composition sub-rows, shown under the total. */
  shares?: IUsageShare[];
}
export interface IUsageReport {
  resetDate: string | null;
  metrics: IUsageQuotaMetric[];
}

// ─── Release notes ───────────────────────────────────────────────────────────
export interface IReleaseNote {
  id: string;
  title: string;
  content: string; // markdown
  environment: 'dev' | 'staging' | 'production';
  created_at: string;
}

// ─── Account (the editable account-info profile) ─────────────────────────────
export interface IAccount {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ICampaignSummary {
  id: string;
  name: string;
  brand: string;
  launch: string; // '' when there is no launch date yet
  competitor: string;
  example: boolean; // a worked sample, not a real campaign
  updated_at: string;
  locked_at: string | null;
  phase: ICampaignPhase;
  goals: ICampaignGoalSummary[] | null; // null until launch — no figures before there is coverage
  left: number | null; // days left in the window, null before launch
}
// ─── Recipient Groups ────────────────────────────────────────────────────────
// Reusable email lists a newsletter's sendout goes to. Mirrors the web app's
// recipient-groups types (scoup_ui_v2 src/features/recipient-groups/types). A group
// is the same object on the list card and the detail screen — the card reads name +
// members.length + used_in; the detail reads members + description too.
export type ISendoutType = 'daily' | 'weekly' | 'alert';

export interface IRecipientGroupMember {
  id: string;
  email: string;
  role: string;
  sort_order: number;
}
// Member shape accepted by an edit — the mock assigns the `id`.
export interface IRecipientGroupMemberInput {
  email: string;
  role: string;
  sort_order: number;
}
// One newsletter sendout a group is wired into — drives the card's "Used in" strip.
export interface IRecipientGroupUsage {
  schedule_id: string;
  newsletter_name: string;
  subject: string;
  type: ISendoutType;
}
export interface IRecipientGroup {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  members: IRecipientGroupMember[];
  used_in: IRecipientGroupUsage[];
}

// ─── Decision Report (the "Nightwatch" weekly decision brief) ────────────────
// Mirrors the web's Decision Report (scoup_ui_v2 src/features/media-meter, route
// /media-meter/newsletters/:id/report). The desktop 3-column layout (ranked list ·
// story canvas · evidence dock) collapses on mobile to a scrolling brief whose
// "Decide this week" rows push a full-screen Story Canvas. These are the mobile
// view-models; the API layer maps mock-or-real `/api/v2/decision-report/*` onto them
// so the UI never changes. The full story shape is defined now (incl. canvas figures)
// so the Phase 2 Story Canvas is additive UI with no data change.
export type ReportVerdict = 'act' | 'watch' | 'skip';
export type ReportTrend = 'Rising' | 'Steady' | 'Fading';
export type ReportCadence = 'daily' | 'weekly' | 'monthly';

/** One KPI tile in the brief's counts strip (ARTICLES, NEGATIVE ARTICLES, …). */
export interface IDecisionCount {
  key: string;
  label: string;
  value: string;
  sub: string;
  /** Over an alert threshold — the value reads red (web: NEGATIVE_* thresholds). */
  alert?: boolean;
}

/** One keyword-hit chip on the story canvas, e.g. "telco 37". */
export interface IKeywordHit {
  term: string;
  count: number;
}

/** A ranked story in the "Decide this week" list and the Story Canvas. */
export interface IDecisionStory {
  id: string;
  rank: number;
  verdict: ReportVerdict;
  title: string;
  dek: string; // one-line "what is the story" (canvas)
  actionLine: string; // the rail note, e.g. "Steady, friendly coverage you can amplify."
  priority: number; // 0–100 (the ScoreBar + the "94")
  trend: ReportTrend;
  momentum: number; // 0–100, shown as "momentum 55"
  // ── Canvas figures (seeded now, rendered in Phase 2) ──
  weightedEngagement: number; // SharedView weighted engagement
  velocity: number; // posts/comments per hour
  articles: number;
  comments: number; // comments read
  negativeCommentsPct: number; // % of comments negative
  lateSharePct: number; // % of engagement arriving late
  net: number; // net favorability, signed
  keywordHits: IKeywordHit[];
  // ── Across all stories / How people felt / Rest of the week (Phase 3) ──
  storySize: number; // 0–100 (impact) — quadrant y + "Story size" column
  risk: number; // 0–100 — quadrant x + "Risk" column
  stance: { neg: number; neu: number; pos: number }; // comment-stance split %, "How people felt"
  positivePct: number; // favorable comment share, "Good news" ("58% positive")
  mentions: number; // period mentions, "The rest of the week" day sentiment
  dayStatus: DayStatus; // GREEN / AMBER / RED per-story flag
  trackerDay?: number; // if a crisis tracker is open on this story → a "Tracker · Day N" chip
  emotions: IEmotionShare[]; // per-story 8-emotion (Plutchik) share — "How people felt"
  storyValuePoints: number; // "What is it to you" Story-value metric (for the drill ranking)
  negativeEmotionPct: number; // "What is it to you" Negative-emotion metric %
  // ── Good news ──
  good: boolean; // appears under "Good news worth using"
  opportunity: number; // 0–100 opportunity score
  engagements: number; // total engagements (good-news line)
}

export type DayStatus = 'GREEN' | 'AMBER' | 'RED';

/** A cited comment in the "Most liked comments" list (How people felt). */
export interface IDecisionComment {
  id: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  emotion: string;
  likes: number;
  storyTitle: string;
}
/** One labelled figure in "The rest of the week" (label / value / sub-detail). */
export interface IDecisionFigure {
  label: string;
  value: string;
  sub: string;
}
/** Edition-level context for "The rest of the week" + the most-liked comments. */
export interface IDecisionContext {
  weekAgainstNormal: IDecisionFigure[]; // Articles / Negative / Main-focus / Posts / Comments
  reportFigures: IDecisionFigure[]; // Sentiment score / floor / alert status
  dayLabels: string[]; // Thu … Thu
  mostLiked: IDecisionComment[];
}

/** A full weekly/daily edition — the whole brief for one period. */
export interface IDecisionEdition {
  newsletterId: string;
  newsletterName: string;
  cadence: ReportCadence;
  date: string; // "Thursday 31 December"
  periodLabel: string; // "December 26 to 31, 2026"
  preparedTime: string; // "07:00"
  writtenAt: string; // "written Dec 31, 2026, 6:40 AM"
  persona: string; // "for Marco, Comms Lead"
  crisisOpen: number; // 0 → "No crisis tracker open"
  trackers: IDecisionTracker[]; // open crisis trackers (web: chain.open) — the "Crises open" panel
  leadLine: string; // "One issue needs a response this week: …"
  summary: string; // the paragraph revealed by "Read the summary"
  counts: IDecisionCount[];
  verdictCounts: Record<ReportVerdict, number>;
  stories: IDecisionStory[];
  context: IDecisionContext;
  alerts: IDecisionAlert[]; // Alerts (hour-by-hour) mode — the early-warning signals
  alertsSummary: string; // "6 alerts this week · the busiest hour was Thu 31, 2 AM, with 57 items."
  timeline: IStoryHourlyDay[]; // "Across all stories" → Timeline view (the week, hour by hour)
  press: IDecisionPress; // "The rest of the week" → the press-coverage charts
}

/** The press-coverage charts in "The rest of the week" (web: PressTiles). */
export interface IDecisionPress {
  byMedium: { label: string; value: number }[]; // Online / Broadcast / Social / Print article counts
  topOutlets: { label: string; value: number }[]; // outlet → items
  keywordHits: { label: string; value: number }[]; // term → total hits across the stories
}

// ─── Decision Report: Alerts mode (Phase B) ──────────────────────────────────
/** One early-warning alert in the Decision report's Alerts (hour-by-hour) mode. */
export type AlertKind = 'escalate' | 'push' | 'radar' | 'incident';
export interface IDecisionAlert {
  id: string;
  kind: AlertKind;
  time: string; // "Thu 31 · 9:40 am"
  storyId: string;
  storyTitle: string;
  text: string;
  metric?: string; // "2.3× a normal day" / "57 items in the hour"
}

// ─── Decision Report: Crisis trackers (Phase A) ──────────────────────────────
/** A crisis tracker's current reading (web: TrackerVerdict). */
export type TrackerVerdict = 'escalating' | 'stable' | 'containing';

/** One rule-check in "Why it reads …" (web: ITrackerCheck). */
export interface ITrackerCheckItem {
  label: string;
  ok: boolean;
  unmeasured?: boolean;
  detail?: string;
}

/** One response goal in "Is the response working?" (web: ITrackerGoal). */
export type TrackerGoalStatus = 'met' | 'ontrack' | 'behind' | 'missed' | 'unmeasured';
export interface ITrackerGoalItem {
  id: string; // "(a)", "(b)", …
  label: string;
  status: TrackerGoalStatus;
  value: string;
  detail?: string;
}

/** One entry in the response log (web: tracker.log). */
export interface ITrackerLogEntry {
  key: string;
  kind: string; // "Alert", "Escalate", "Statement", …
  tone: 'bad' | 'us' | 'alert' | 'plain';
  when: string; // "Day 1 · Thu 9:40 am"
  detail: string;
}

/** A driver outlet / account in "Who is driving it". */
export interface ITrackerOutlet {
  name: string;
  medium: string;
  items: number;
  unfavorable: number;
}
export interface ITrackerAccount {
  name: string;
  platform: string;
  posts: number;
  engagement: string; // compact, e.g. "3.5K"
}

/** An open crisis tracker — the "Crises open" panel card + its pushed detail screen. */
export interface IDecisionTracker {
  id: string; // == storyId
  storyId: string;
  storyTitle: string;
  verdict: TrackerVerdict;
  day: number; // "Day N"
  dateLabel: string; // "Thu 31"
  timesNormal: number; // 2.3 → "2.3× a normal day"
  decisionToday: string; // the "The decision today" action line
  move: string; // the trajectory/why line under the card
  // ── pushed detail ──
  peakX: number;
  peakDay: number;
  trend?: string; // "rising" / "easing"
  normalItems: number; // "a normal day (N items)"
  attention: number[]; // per-day attention multiples, Day 0..latest
  changed: {
    items: number;
    records: number;
    comments: number;
    newOutlets: string[];
    tierScore?: number;
    newClaim?: string;
  };
  nextStep?: string;
  goals: ITrackerGoalItem[];
  goalsAsOf: string;
  whyReading: string; // "Escalating — 2 of the escalation checks are met."
  escalation: ITrackerCheckItem[];
  containing: ITrackerCheckItem[];
  outlets: ITrackerOutlet[];
  accounts: ITrackerAccount[];
  log: ITrackerLogEntry[];
}

// ─── Decision Report: the Story Canvas (Phase 2) ─────────────────────────────
// The full single-story detail (web: ReportStoryCanvas). Fetched per story; the
// badge/title/dek/keywordHits/weightedEngagement/velocity/articles/comments/
// negativeCommentsPct/lateSharePct/net all come from the story's IDecisionStory, so
// this detail only carries the deeper sections. Composes existing story sub-types
// (IStoryHourlyDay, IPeriodTone, IEmotionShare) so the charts (HourByHour, ToneBar)
// can be reused as-is.
export type BriefSeverity = 'quiet' | 'elevated' | 'high' | 'critical';
export interface IBriefWindow {
  label: string; // Overnight / Morning / Midday / Evening
  count: number;
  severity: BriefSeverity;
}
/** A numbered moment on the unfold chart ("1 · Thu 9:00 am · Alert · first_broadsheet"). */
export interface IStoryMomentMarker {
  n: number;
  when: string; // "Thu 9:00 am"
  kind: string; // "Alert"
  label: string; // "first_broadsheet"
}
/** A "What is it to you" metric with its rank and the dot-strip positions (all stories). */
export interface ICanvasMetric {
  key: string;
  label: string; // STORY VALUE POINTS / ENGAGEMENT / NET FAVORABILITY / NEGATIVE EMOTION
  value: string; // "72.0" / "8.8K" / "-38" / "47%"
  sub: string; // "sum of its items' story value" / "1,040 posts" / …
  rank: number; // 1-based
  total: number; // of 6
  dots: number[]; // every story's position 0..1 on the strip
  self: number; // this story's position 0..1
  signed?: boolean; // net favorability — strip has a centre zero line
  tone?: 'positive' | 'negative' | 'neutral'; // colours the value (net < 0 → red)
}
export interface ICanvasOutlet {
  name: string;
  medium: string; // "Broadsheet"
  items: number;
  storyValue: number; // 84.00
}
export interface ICanvasVoice {
  name: string;
  platform: string; // X / Facebook / Instagram
  keyVoice: boolean;
  voiceScore: number; // 96
  likes: number;
  comments: number;
  shares: number;
  engagementPct: number; // 44 → "44% of engagement"
  views: number; // 117_600
  negativePct: number; // 100 → "100% negative"
  topRead: number; // 2 → "(2 read)"
  status: 'peaked' | 'emerging';
}
export interface IRankBar {
  label: string; // Story size / Risk / Momentum
  value: number; // 0–100
  tone: 'ink' | 'risk' | 'momentum';
}
export interface ICanvasCoverage {
  rank: number;
  title: string;
  outlet: string;
  medium: string;
  date: string; // "Nov 1, 4:00 PM"
  storyValue: number; // 88.00
}
export interface IDecisionStoryDetail {
  id: string;
  // when did it start
  startedText: string; // "It started Thu 9:00 am with Alert · first_broadsheet."
  busiestHourText: string; // "The busiest hour was Thu 31, 2 AM, with 57 items."
  // how did it unfold
  briefWindows: IBriefWindow[];
  hourly: IStoryHourlyDay[];
  unfoldNote: string; // "articles and posts per hour, Thu 24 to Thu 31 · …"
  unfoldNarrative: string;
  moments: IStoryMomentMarker[];
  // what is it to you
  metrics: ICanvasMetric[];
  // who is involved
  involvedNote: string;
  outlets: ICanvasOutlet[];
  voices: ICanvasVoice[];
  reactionsSummary: string; // "338.3K post views · 713 shares · 0 posts still rising, 3 peaked"
  // what do people feel
  feelNote: string; // "100 top comments read by Scoup · objective view"
  feelAnalysis: string; // "Rising fast and the tone is turning against the carriers."
  tone: IPeriodTone;
  personaTone: IPeriodTone;
  emotions: IEmotionShare[];
  trustText: string; // "No role named often enough to read."
  concentrationText: string; // "40% under one post"
  concentrationDetail: string; // "10 adverse comments; 4 sit under , 40% on"
  sampleComments: { text: string; sentiment: 'positive' | 'neutral' | 'negative' }[]; // representative quotes (web: SayingSection)
  // what should be done
  suggestedAction: string; // "Scoup suggested no action for this story."
  nextText: string;
  whyRanks: IRankBar[];
  whyRanksNote: string; // "Momentum and direction are each story's latest daily entry, not the whole week."
  // more on this story
  alertStatus: string; // "QUIET"
  alertText: string; // "No alert this period. The busiest hour, Thu 31, 2 AM, had 57 items."
  searchVisits: number; // 67_800
  postViews: number; // 338_300
  topCoverage: ICanvasCoverage[];
}

// ─── Decision Report: the evidence drill ("nodes") ───────────────────────────
// Tapping a drillable element (a figure, outlet/voice card, coverage row, keyword, brief
// window) resolves to an IDrillNode shown in a bottom sheet; its records/chips drill deeper,
// forming a breadcrumb chain. Pure/client-side — resolved over the already-loaded edition +
// story detail (web: resolveDrill), no endpoint.
export type DrillRecordKind = 'coverage' | 'story' | 'voice';
export interface IDrillRecord {
  id: string;
  kind: DrillRecordKind;
  title: string;
  meta: string; // "BusinessWorld · Broadsheet · Nov 4, 4:00 PM"
  value?: string; // "88.00" / "72.0" / "96"
  tone?: 'positive' | 'neutral' | 'negative';
  spec?: string; // a record that drills to a child node (undefined = leaf)
  storyId?: string; // a story record jumps the canvas to this story
}
export interface IDrillGlance {
  label: string;
  value: string;
}
export interface IDrillChip {
  spec: string;
  label: string;
  count?: number;
}
export interface IDrillNode {
  spec: string;
  title: string;
  count: number | null;
  unit: string; // "article" | "story" | "item" | "voice" | …
  reading: string | null; // "Scoup's reading"
  readingSource?: string; // "From Scoup's write-up of this story."
  glance: IDrillGlance[];
  records: IDrillRecord[];
  chips: IDrillChip[]; // "open the next node"
  empty?: string;
}

// ─── Newsletter Settings (the "Settings" sub-tab — BUCKETS tab) ───────────────
// A newsletter's bucket management: the bucket cards (keyword-group chips + source intake),
// the multi-bucket "Bucket groups", and the topics-page order. Mirrors the web's
// newsletter-edit page (src/features/newsletters/pages/Edit). Served by a mutable mock;
// maps to the real buckets / bucket-group-preference / source-restriction routes later.
export interface IKeywordGroupSummary {
  id: string;
  name: string; // the group's name ("Core terms")
  summary: string; // auto-generated blurb (web: bucket_summary); '' → "generated automatically" placeholder
  mainKeywords: string[]; // UPPERCASE, quote-free tokens ("NTC", "SPECTRUM AUCTION"); matches ANY
  additionalKeywords: string[]; // matches ANY (narrows alongside main)
  excludedKeywords: string[]; // excludes ANY
}
export interface IBucketSettings {
  id: number;
  name: string;
  description: string; // the bucket summary shown on the card (web: bucket_summary); '' if none
  keywordGroups: IKeywordGroupSummary[];
  sourceRestrict: boolean; // false → "All sources"; true → "Whitelisted"
  sourceCount: number; // whitelisted-source count (0 when !restrict)
  sourceIds: string[]; // when restricted: the source pool ids feeding the bucket ("pub:…"/"soc:…")
  createdAt: string; // "August 20, 2026"
}
export interface IBucketGroupSummary {
  id: string;
  name: string; // "Competitor Benchmark"
  bucketIds: number[];
  bucketNames: string[]; // for the member chips
}
export interface INewsletterSettings {
  newsletterId: string;
  newsletterName: string;
  buckets: IBucketSettings[];
  groups: IBucketGroupSummary[];
}

// ─── Email config (the Settings "Email" tab — web: EmailConfig/EmailTablePage) ──
// A newsletter's sendouts (schedules) + header branding. Newsletter-level, shared by
// the Settings → Email tab and the bucket detail's Email tab. Mutable mock.
// (Sendout cadence reuses ISendoutType, defined with the Recipient Groups types.)
export interface IEmailSendout {
  id: string;
  type: ISendoutType;
  days: string[]; // weekly: ['Mon','Thu']; daily/alert: [] (daily = every day)
  sendoutTime: string; // "08:00"; '' for alert (continuous)
  subject: string;
  bucketIds: number[]; // buckets fed into this sendout (not used by alert-less sweep)
  toGroupIds: string[];
  ccGroupIds: string[];
  bccGroupIds: string[];
  toEmails: string[];
  ccEmails: string[];
  bccEmails: string[];
  alertThreshold: number | null; // alert only: posts/hour spike floor
}
export interface IEmailConfig {
  newsletterId: string;
  header: string; // header text shown atop the email (plain on mobile; web: rich HTML)
  subject: string; // default newsletter subject
  logoUrl: string; // '' if none
  sendouts: IEmailSendout[];
}

// ─── Client Reports (Media Meter → Reports: the client-report viewer) ──────────
// Mirrors the web's src/features/media-meter/reports — monthly client reports built on the
// same figures as the Dashboard/Decision report. Two reports: EDCOM 2 (year-on-year, 8 months)
// and PH automotive (market report). Served by a mutable-less deterministic mock.
export type ClientReportId = 'edcom2' | 'ph-auto';
export interface IReportTag {
  label: string;
  isLine?: boolean; // outline badge vs filled/muted
}
export interface IReportMonth {
  key: string; // '2026-08'
  label: string; // 'August 2026'
}
// A row on the "pick a month" screen (EDCOM 2): the month + a headline stat.
export interface IReportMonthSummary {
  key: string; // '2026-08'
  label: string; // 'August 2026'
  articles: string; // '490'
  change: string; // '▲46%' (vs the same month a year earlier)
  changeTone: 'up' | 'down' | 'flat';
  ave: string; // 'PHP 805.8M'
}
export interface IReportTabDef {
  key: string;
  label: string;
}
// The landing card (web: edcom2Card/autoCard → IReportCard) + rail metadata.
export interface IClientReportCard {
  id: ClientReportId;
  group: string; // rail group header — 'Year-on-year reviews' / 'Market reports'
  railTag: string; // 'E2' / 'PH'
  railLabel: string; // 'EDCOM 2' / 'Automotive · models'
  title: string;
  meta: string;
  lede: string;
  tags: IReportTag[];
  months: IReportMonth[]; // newest-first; EDCOM 2 only (empty for single-month reports)
  monthShort?: string; // 'Sep' — the rail count for single-month reports
  tabs: IReportTabDef[];
}
export type ReportPillTone = 'up' | 'down' | 'plain' | 'line';
export interface IReportPill {
  label: string;
  tone: ReportPillTone;
}
export type FigureOrigin = 'mm' | 'dash' | 'decision'; // where the figure comes from
export interface IReportFigure {
  label: string;
  origin: FigureOrigin;
  value: string;
  change?: string | null; // '▲46%' etc.
  changeTone?: 'up' | 'down' | 'flat';
  sub?: string;
  isVerdict?: boolean;
  tip?: string;
}
// ── Deep-tab payloads (EDCOM 2 Phase 2) ──
export type ReportToneKey = 'pos' | 'neu' | 'neg';
export interface IReportStory {
  id: string;
  title: string;
  outlet: string;
  date: string; // 'Aug 14'
  tone: ReportToneKey;
  ave: number; // pesos
  snippet: string;
  outlets?: number; // how many outlets ran it
  pattern?: string; // 'Spike' | 'Steady' | 'Recurring'
  issue?: string; // the issue it sits under
  why?: string; // analyst "why it travelled" line
  days?: string[]; // day labels it ran on (dot-timeline)
}
// A day's coverage split by channel (Stories "coverage peaked on …" chart).
export interface IReportDayChannel {
  day: string; // 'Aug 7'
  online: number;
  print: number;
  broadcast: number;
  ave: string; // 'PHP 120.0M'
  event?: string; // 'EDCOM 2 hearing'
}
// A row of the "which stories moved each issue" table.
export interface IReportMovedIssue {
  issue: string;
  count: number;
  change: number; // pct vs a year earlier
  biggestNow: string;
  biggestBefore: string;
  moved: string; // "what moved it"
}
// A horizontal stacked bar row (e.g. a month × categories) — web: StackedRows.
export interface IReportStackedRow {
  label: string;
  parts: number[]; // category values (rendered as proportions)
  isCurrent?: boolean;
}
// A ranked bar with a previous-year ghost + a 12-month-average tick (web: RankedBars).
export interface IReportRankedItem {
  label: string;
  value: number;
  prev?: number; // previous-year value (ghost bar)
  tick?: number; // 12-month average (tick mark)
  change?: string;
  changeTone?: 'up' | 'down' | 'flat';
}
export interface IReportIssue {
  key: string;
  label: string;
  count: number;
  read: 'above' | 'within' | 'below' | 'few'; // vs its usual range
  lo: number;
  hi: number;
  series: number[]; // ~20-month history (sparkline)
  prevYear: number; // same-month count a year earlier
  change: number; // pct change on the year
  share: number; // % of the month's articles
  tone: { pos: number; neu: number; neg: number };
}
export interface IReportYoyRow {
  month: string; // 'Jan'
  earlier: number; // a year earlier
  later: number; // this year
  changePct: number;
  lo?: number; // usual-range band (around the 'later' line)
  hi?: number;
}
// A YoY "question" comparison card (web: CompareBox).
export interface IReportCompareCard {
  title: string; // "Main comparison · Year on year"
  question: string;
  bars: { label: string; value: number; display: string }[];
  answer: string; // "▲46% · 490 vs 336 articles"
  answerTone: 'up' | 'down' | 'flat';
}
// A row of the dense month-by-month YoY table.
export interface IReportMonthRow {
  month: string; // 'Aug'
  articles: number;
  ave: string; // 'PHP 805.8M'
  avePerArticle: string; // 'PHP 1.6M'
  outlets: number;
  broadcastShare: string; // '12%'
  mainFocus: string; // '68%'
  negTone: string; // '15%'
  impressions: string; // '7.8M'
  biggestStory: string;
  isCurrent?: boolean;
}
// The single-issue column chart's per-month series (Issues deep chart).
export interface IReportIssueSeries {
  key: string;
  label: string;
  months: { label: string; n: number; negTone: number }[];
}
export interface IEdcom2TabData {
  yoy: {
    rows: IReportYoyRow[];
    changeOnYear: number;
    measureLabel: string;
    lead: string;
    sub: string;
    writeup?: IReportWriteup;
    compare: IReportCompareCard[];
    monthTable: IReportMonthRow[];
  };
  issues: IReportIssue[];
  issuesLead: string;
  issuesSub: string;
  issuesWriteups: IReportWriteup[];
  issueSeries: IReportIssueSeries[];
  stories: IReportStory[];
  storiesLead: string;
  storiesSub: string;
  storiesWriteups: IReportWriteup[];
  dayChannels: IReportDayChannel[];
  peakDay: string;
  movedIssues: IReportMovedIssue[];
  stage: {
    lead: string;
    sub: string;
    note: string;
    stageNames: string[];
    rows: IReportStackedRow[]; // per month × stages
    writeup?: IReportWriteup;
  };
  voices: {
    lead: string;
    sub: string;
    individuals: IReportRankedItem[];
    institutions: IReportRankedItem[];
    writeup?: IReportWriteup;
  };
  toneTab: {
    objectiveLead: string;
    personaLead: string;
    sub: string;
    objective: { pos: number; neu: number; neg: number };
    persona: { pos: number; neu: number; neg: number };
    prevNet: number; // last-year net (objective)
    prevNegShare: number;
    byMonth: IReportStackedRow[]; // per month pos/neu/neg
    byIssue: IReportStackedRow[]; // per issue pos/neu/neg
    writeup?: IReportWriteup;
  };
  channels: {
    lead: string;
    sub: string;
    mix: IReportStackedRow[]; // Articles/AVE/Impr this month + last year, stacked by channel
    byChannel: { channel: string; items: { label: string; value: number }[] }[];
    months: IReportStackedRow[]; // per month × channel
    writeup?: IReportWriteup;
  };
  credit: {
    lead: string;
    sub: string;
    line: IReportYoyRow[]; // earlier = DepEd, later = EDCOM 2 (share of headlines %)
    focus: IReportStackedRow[]; // per month × [main focus, mention]
    writeups: IReportWriteup[];
  };
  tone: { pos: number; neu: number; neg: number };
}

// ── PH-auto deep-tab payloads (Phase 3) ──
export interface IAutoBrand {
  name: string;
  n: number; // articles
  share: number; // share of voice, %
  ave: number; // pesos
  tone: { pos: number; neu: number; neg: number };
}
export interface IAutoNameplate {
  name: string;
  brand: string;
  n: number;
}
export interface IAutoH2HRow {
  label: string;
  a: string; // brand A's value, formatted
  b: string; // brand B's value, formatted
  leader: 'a' | 'b' | 'tie';
}
export interface IAutoTabData {
  brands: IAutoBrand[];
  nameplates: IAutoNameplate[];
  stories: IReportStory[];
  h2h: { a: string; b: string; rows: IAutoH2HRow[] };
}

// ── Generic deep-tab "sections" (the long-tail tabs for both reports) ──
export type ReportMeasure = 'n' | 'ave' | 'imp';
export type ReportSectionKind = 'breakdown' | 'timeline' | 'toneIssues' | 'actions' | 'summary' | 'howToRead';
export interface IReportBreakdownItem {
  label: string;
  n: number; // articles
  ave: number; // pesos
  imp: number; // impressions
  sub?: string;
  color?: string; // explicit bar color (e.g. channel/stage palette)
}
export interface IReportBullet {
  title: string;
  body: string;
}
// An analyst write-up card (web: WriteUpCard) — a kicker + a bold claim + body prose.
export interface IReportWriteup {
  kicker?: string; // "1 · Analyst write-up · from EDCOM 2"
  claim: string; // the bold one-liner
  body: string;
  dark?: boolean; // the dark verdict variant
}
// A structured recommendation (web: ActionsTab) — title + source + labeled term/detail rows.
export interface IReportActionCard {
  source: string; // "from EDCOM 2"
  title: string;
  rows: { term: string; detail: string }[];
}
// "How to read this" tab data.
export interface IReportTermMap {
  term: string; // source-report term, e.g. "Pickups"
  metric: string; // Scoup metric, e.g. "Articles"
  origin: string; // 'mm' | 'sc' | 'rp'
  rule: string; // the precise rule sentence
}
export interface IReportMethodBlock {
  title: string;
  paras: string[];
}
export interface IReportSection {
  kind: ReportSectionKind;
  intro: string;
  lead?: string; // TabLead bold one-liner (web parity)
  readMore?: string; // TabLead "how to read" sub
  writeups?: IReportWriteup[]; // analyst write-up cards
  items?: IReportBreakdownItem[]; // breakdown / timeline
  measurable?: boolean; // breakdown re-scopes by the Articles/AVE/Impressions switch
  tone?: { pos: number; neu: number; neg: number }; // toneIssues
  bullets?: IReportBullet[]; // actions / summary / howToRead (legacy simple cards)
  actionCards?: IReportActionCard[]; // structured actions
  termMap?: IReportTermMap[]; // howToRead: source term → Scoup metric
  glossary?: { term: string; meaning: string }[]; // howToRead glossary
  method?: IReportMethodBlock[]; // howToRead: how the review was built
}

// A "before vs now" comparison row in the At-a-glance body.
export interface IReportCompareRow {
  label: string; // 'Articles'
  before: string; // '336'
  now: string; // '490'
  change: string; // '▲46%'
  changeTone: 'up' | 'down' | 'flat';
}
// The "At a glance" tab's own body (web: GlanceTab) — distinct from the masthead figures.
export interface IReportGlance {
  lead: string; // the "At a glance" intro sentence
  // The dark verdict card, with an optional headline-stage shift grid.
  verdict?: { ask: string; title: string; text: string; grid?: { stage: string; shift: string }[] };
  beforeTitle: string; // 'Before — the baseline'
  before: { label: string; value: string }[]; // 3 context tiles
  nowTitle: string; // 'Now — this month'
  now: { label: string; value: string }[]; // 3 context tiles
  findings: { title: string; body: string }[]; // analyst "key findings" write-ups
}

// The report detail shell for a given month (web: edcom2Masthead/autoMasthead).
export interface IClientReportDetail {
  id: ClientReportId;
  kicker: string; // report title
  title: string; // the reported month / period
  sub: string;
  pills: IReportPill[];
  figures: IReportFigure[]; // the masthead "Key figures" (persist across tabs)
  glance?: IReportGlance; // the At-a-glance tab's own body
  tabs: IReportTabDef[];
  months: IReportMonth[];
  activeMonth: string | null;
  edcom2Tabs?: IEdcom2TabData; // the deep-tab data (EDCOM 2 only)
  autoTabs?: IAutoTabData; // the deep-tab data (PH-auto only)
  sections?: Record<string, IReportSection>; // the long-tail tabs, keyed by tab key
}

// ─── Personas ─────────────────────────────────────────────────────────────────
// The audiences each brief is written for. Mirrors the web Personas page
// (src/features/personas): a card grid where "active" = the single primary persona,
// each persona carrying two dossiers (User Profile + Organization Profile), every
// dossier a list of named sections. Served by a mutable mock; maps to the real
// /api/v1/persona/artifacts routes later.
export interface IPersonaSection {
  id: string; // section_id, e.g. "1.2"
  name: string; // "Coverage Focus"
  content: string;
  dynamic: boolean; // dynamic (AI-generated) vs static section
}
export interface IPersonaDossier {
  id: string;
  name: string; // "User Profile Dossier"
  sections: IPersonaSection[];
}
export interface IPersonaNewsletterRef {
  id: string;
  name: string;
}
export interface IPersona {
  id: string; // group_id
  name: string; // "Carmela Reyes"
  role: string; // "Head of Corporate Communications"
  org: string; // "Globe Telecom"
  title: string; // "Carmela Reyes | Head of Corporate Communications | Globe Telecom"
  dossierNames: string[]; // ["User Profile Dossier", "Organization Profile Dossier"] → card subtitle
  coverageFocus: string; // user dossier §1.2 — the card preview line
  prompt: string; // the monitoring prompt
  active: boolean; // the primary persona (exactly one across the list)
  createdAt: string; // ISO; "" or sentinel → "Just now" for session-new personas
  updatedAt: string; // ISO
  newsletters: IPersonaNewsletterRef[];
  dossiers: IPersonaDossier[];
}
// Persona sort — three fields, each with a direction (shown grouped in the sort sheet):
// Active (primary pinned, then by date) · Name (A–Z / Z–A) · Recently added (by createdAt).
export type IPersonaSort =
  | 'active-newest'
  | 'active-oldest'
  | 'name-az'
  | 'name-za'
  | 'recent-newest'
  | 'recent-oldest';
