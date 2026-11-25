// Canonical fictional PH media-monitoring entities, shared by every generator so
// names/numbers reconcile across screens. Ported from the web app's mock layer.
import type { INewsletter, NewsletterTheme } from '@/types';

export interface Outlet {
  name: string;
  medium: string; // ES-style platform code
  mediumLabel: string;
  reach: number;
}

export const OUTLETS: readonly Outlet[] = [
  { name: 'Philippine Daily Inquirer', medium: 'BROADSHEET', mediumLabel: 'Broadsheet', reach: 3_900_000 },
  { name: 'The Philippine Star', medium: 'BROADSHEET', mediumLabel: 'Broadsheet', reach: 3_200_000 },
  { name: 'Manila Bulletin', medium: 'BROADSHEET', mediumLabel: 'Broadsheet', reach: 2_700_000 },
  { name: 'BusinessWorld', medium: 'BROADSHEET', mediumLabel: 'Broadsheet', reach: 1_100_000 },
  { name: 'Rappler', medium: 'ONLINE_NEWS', mediumLabel: 'Online news', reach: 4_400_000 },
  { name: 'GMA News Online', medium: 'ONLINE_NEWS', mediumLabel: 'Online news', reach: 5_100_000 },
  { name: 'ABS-CBN News', medium: 'ONLINE_NEWS', mediumLabel: 'Online news', reach: 5_600_000 },
  { name: 'Philstar.com', medium: 'ONLINE_NEWS', mediumLabel: 'Online news', reach: 3_800_000 },
  { name: 'Manila Times', medium: 'BROADSHEET', mediumLabel: 'Broadsheet', reach: 1_500_000 },
  { name: 'Abante', medium: 'TABLOID', mediumLabel: 'Tabloid', reach: 2_100_000 },
  { name: 'Bandera', medium: 'TABLOID', mediumLabel: 'Tabloid', reach: 1_700_000 },
  { name: 'GMA-7', medium: 'TV', mediumLabel: 'TV', reach: 9_800_000 },
  { name: 'TV5', medium: 'TV', mediumLabel: 'TV', reach: 6_200_000 },
  { name: 'DZRH', medium: 'RADIO', mediumLabel: 'Radio', reach: 4_000_000 },
  { name: 'DZMM TeleRadyo', medium: 'RADIO', mediumLabel: 'Radio', reach: 3_500_000 },
  { name: 'SunStar', medium: 'PROVINCIAL', mediumLabel: 'Provincial', reach: 900_000 },
];

export const AUTHORS: readonly string[] = [
  'Ramon del Rosario', 'Maria Clara Santos', 'Joselito Fernandez', 'Andrea Lim',
  'Patrick Villanueva', 'Krista Mercado', 'Noel Bautista', 'Celine Aquino',
  'Miguel Tan', 'Rowena Cruz', 'Carlo Mangahas', 'Bea Gonzales',
];

export const PLATFORMS: readonly { code: string; label: string }[] = [
  { code: 'FACEBOOK', label: 'Facebook' },
  { code: 'TWITTER', label: 'X' },
  { code: 'INSTAGRAM', label: 'Instagram' },
  { code: 'TIKTOK', label: 'TikTok' },
  { code: 'YOUTUBE', label: 'YouTube' },
];

export const MEDIUMS: readonly { medium: string; label: string }[] = [
  { medium: 'ONLINE_NEWS', label: 'Online news' },
  { medium: 'BROADSHEET', label: 'Broadsheet' },
  { medium: 'TABLOID', label: 'Tabloid' },
  { medium: 'TV', label: 'TV' },
  { medium: 'RADIO', label: 'Radio' },
];

// Places a story can be tagged to — PSGC `code` matches the GeoJSON in public/geo so the web
// choropleth shades them; `short` is the native map's CITY_COORDS key (NCR only); `region` is
// the PSGC region so a tap on the merged "Metro Manila" bubble can scope to all NCR cities.
export const NCR_REGION_CODE = '1300000000';
export interface StoryPlace {
  code: string;
  name: string;
  short: string; // '' for non-NCR places (not on the native NCR map)
  region: string;
}
export const STORY_PLACES: readonly StoryPlace[] = [
  // Metro Manila (NCR)
  { code: '1380600000', name: 'Manila City', short: 'Manila', region: NCR_REGION_CODE },
  { code: '1381300000', name: 'Quezon City', short: 'Quezon City', region: NCR_REGION_CODE },
  { code: '1380300000', name: 'Makati City', short: 'Makati', region: NCR_REGION_CODE },
  { code: '1381500000', name: 'Taguig City', short: 'Taguig', region: NCR_REGION_CODE },
  { code: '1381200000', name: 'Pasig City', short: 'Pasig', region: NCR_REGION_CODE },
  { code: '1380100000', name: 'Caloocan City', short: 'Caloocan', region: NCR_REGION_CODE },
  { code: '1381000000', name: 'Parañaque City', short: 'Parañaque', region: NCR_REGION_CODE },
  { code: '1381100000', name: 'Pasay City', short: 'Pasay', region: NCR_REGION_CODE },
  { code: '1380500000', name: 'Mandaluyong City', short: 'Mandaluyong', region: NCR_REGION_CODE },
  { code: '1380700000', name: 'Marikina City', short: 'Marikina', region: NCR_REGION_CODE },
  { code: '1380800000', name: 'Muntinlupa City', short: 'Muntinlupa', region: NCR_REGION_CODE },
  { code: '1380200000', name: 'Las Piñas City', short: 'Las Piñas', region: NCR_REGION_CODE },
  { code: '1381600000', name: 'Valenzuela City', short: 'Valenzuela', region: NCR_REGION_CODE },
  { code: '1380400000', name: 'Malabon City', short: 'Malabon', region: NCR_REGION_CODE },
  { code: '1380900000', name: 'Navotas City', short: 'Navotas', region: NCR_REGION_CODE },
  { code: '1381400000', name: 'San Juan City', short: 'San Juan', region: NCR_REGION_CODE },
  // Major cities elsewhere
  { code: '1130700000', name: 'Davao City', short: '', region: '1100000000' },
  { code: '0730600000', name: 'Cebu City', short: '', region: '0700000000' },
  { code: '1430300000', name: 'Baguio City', short: '', region: '1400000000' },
  { code: '1030500000', name: 'Cagayan de Oro City', short: '', region: '1000000000' },
  { code: '0631000000', name: 'Iloilo City', short: '', region: '0600000000' },
  { code: '0931700000', name: 'Zamboanga City', short: '', region: '0900000000' },
];

export const HEADLINES: Readonly<Record<NewsletterTheme, readonly string[]>> = {
  telco: [
    'PLDT, Globe expand 5G coverage to 20 more cities',
    'DITO Telecommunity hits 20 million subscribers',
    'NTC orders telcos to improve rural signal quality',
    'Converge ICT rolls out fiber upgrade across Visayas',
    'Smart Communications partners with DepEd on connectivity',
    'Senate probes dropped-call complaints against carriers',
    'Globe reports double-digit growth in home broadband',
    'Starlink gains traction among provincial LGUs',
  ],
  banking: [
    'BSP keeps benchmark rate steady amid easing inflation',
    'BDO posts record first-half net income',
    'GCash crosses 90 million registered users',
    'Landbank expands digital lending for farmers',
    'Maya Bank launches high-yield savings campaign',
    'UnionBank migrates core systems to the cloud',
    'Remittances hit new high as peso stabilizes',
    'SEC tightens rules on online lending platforms',
  ],
  government: [
    'DICT launches national broadband backbone phase two',
    'DBM releases 2027 budget priorities to agencies',
    'DOTr opens new MRT-7 stations for testing',
    'LGUs roll out e-governance portals nationwide',
    'DOH reports improved vaccination coverage',
    'DPWH fast-tracks flood-control projects in NCR',
    'Comelec finalizes rules for the next elections',
    'Palace signs order streamlining business permits',
  ],
  general: [
    'Consumer prices ease for third straight month',
    'Tourism arrivals rebound to pre-pandemic levels',
    'Peso closes stronger against the US dollar',
    'Metro Manila traffic scheme under review',
    'Startups draw fresh venture funding in Q3',
    'Power demand peaks as dry season begins',
  ],
};

export const SUBJECTS: Record<NewsletterTheme, string[]> = {
  telco: ['Globe', 'PLDT', 'DITO', 'NTC'],
  banking: ['BSP', 'BDO', 'GCash', 'Maya'],
  government: ['DICT', 'DBM', 'DOTr', 'DPWH'],
  general: ['DTI', 'PSA', 'NEDA', 'BSP'],
};

export const NEWSLETTERS: readonly INewsletter[] = [
  {
    id: 'nl-telco',
    name: 'Telecommunications',
    theme: 'telco',
    buckets: [
      { id: 90101, name: 'Globe Telecom' },
      { id: 90102, name: 'PLDT / Smart' },
      { id: 90103, name: 'DITO' },
      { id: 90104, name: 'Regulators' },
    ],
  },
  {
    id: 'nl-banking',
    name: 'Banking & Finance',
    theme: 'banking',
    buckets: [
      { id: 90201, name: 'Universal Banks' },
      { id: 90202, name: 'Digital Wallets' },
      { id: 90203, name: 'Central Bank' },
    ],
  },
  {
    id: 'nl-government',
    name: 'Government & Public Sector',
    theme: 'government',
    buckets: [
      { id: 90301, name: 'Infrastructure' },
      { id: 90302, name: 'Digital Government' },
      { id: 90303, name: 'Budget & Policy' },
    ],
  },
];

// The eight tracked emotions (Plutchik), matching the web's emotion radar.
export const EMOTIONS = ['Joy', 'Trust', 'Fear', 'Surprise', 'Sadness', 'Disgust', 'Anger', 'Anticipation'];
