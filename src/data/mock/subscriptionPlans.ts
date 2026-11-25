// Subscription plans — ported verbatim from the web's static pricing data
// (scoup_ui_v2 src/features/subscription/constants/plans.ts). No API: the web
// Subscription page is a marketing pricing grid, not a billing page.

export interface IPlanAllowance {
  title: string;
  sub: string;
  value: string;
  unit?: string;
}

export interface IPlan {
  name: string;
  scope: string;
  tagline: string;
  price: { yearly: string; monthly: string };
  priceNote?: string;
  billingNote?: { yearly: string; monthly: string };
  isCustom?: boolean;
  allowances: [IPlanAllowance, IPlanAllowance];
  featuresHeading: string;
  features: string[];
  cta: string;
  ctaVariant: 'default' | 'outline';
}

export const PLANS: IPlan[] = [
  {
    name: 'Free',
    scope: '1 brand',
    tagline: 'Try it out. Track one brand with basic monitoring.',
    price: { yearly: '$0', monthly: '$0' },
    priceNote: 'no credit card required',
    allowances: [
      { title: 'Rolling stories', sub: '~48 / 24h · ~336 / 7d', value: '2', unit: '/day' },
      { title: 'Chatbot tokens', sub: '~350K / 7d', value: '50K', unit: '/24h' },
    ],
    featuresHeading: 'Includes:',
    features: [
      '1 newsletter & bucket',
      'Up to 5 keywords',
      'Weekly recommendations',
      '3-persona framework',
      'Community support',
    ],
    cta: 'Use Scoup free',
    ctaVariant: 'outline',
  },
  {
    name: 'Starter',
    scope: '1 brand',
    tagline: 'Solo PR pros & small agencies monitoring a single brand.',
    price: { yearly: '$100', monthly: '$120' },
    priceNote: 'USD / month',
    billingNote: { yearly: 'billed annually', monthly: 'billed monthly' },
    allowances: [
      { title: 'Rolling stories', sub: '~120 / 24h · ~840 / 7d', value: '5', unit: '/day' },
      { title: 'Chatbot tokens', sub: '~1.05M / 7d', value: '150K', unit: '/24h' },
    ],
    featuresHeading: 'Everything in Free, and:',
    features: [
      'Unlimited newsletters & buckets',
      'Unlimited keywords',
      'Incremental story updates (6hr)',
      '9-persona framework',
    ],
    cta: 'Get Starter plan',
    ctaVariant: 'default',
  },
  {
    name: 'Professional',
    scope: 'Multi-brand',
    tagline: 'Mid-size agencies covering multiple brands or regions.',
    price: { yearly: '$250', monthly: '$300' },
    priceNote: 'USD / month',
    billingNote: { yearly: 'billed annually', monthly: 'billed monthly' },
    allowances: [
      { title: 'Rolling stories', sub: '~240 / 24h · ~1,680 / 7d', value: '10', unit: '/day' },
      { title: 'Chatbot tokens', sub: '~2.8M / 7d', value: '400K', unit: '/24h' },
    ],
    featuresHeading: 'Everything in Starter, and:',
    features: [
      'Per-platform writeups',
      'Daily highlights',
      'Post-comment analysis (PCA)',
      'Newsletter chatbot',
      'Priority email support',
    ],
    cta: 'Get Professional plan',
    ctaVariant: 'default',
  },
  {
    name: 'Business',
    scope: 'Multi-market',
    tagline: 'Enterprise PR & corporate comms with multi-market needs.',
    price: { yearly: '$500', monthly: '$600' },
    priceNote: 'USD / month',
    billingNote: { yearly: 'billed annually', monthly: 'billed monthly' },
    allowances: [
      { title: 'Rolling stories', sub: '~480 / 24h · ~3,360 / 7d', value: '20', unit: '/day' },
      { title: 'Chatbot tokens', sub: '~7M / 7d', value: '1M', unit: '/24h' },
    ],
    featuresHeading: 'Everything in Professional, and:',
    features: [
      'Custom publisher & channel imports',
      'Crisis alerting & real-time push',
      'Source audit service',
      'Dedicated CSM · 99.9% SLA',
    ],
    cta: 'Get Business plan',
    ctaVariant: 'default',
  },
  {
    name: 'Enterprise',
    scope: 'Global',
    tagline: 'Unlimited scale for global comms orgs, agencies of record.',
    price: { yearly: 'Custom', monthly: 'Custom' },
    priceNote: 'from $14,999 / mo',
    isCustom: true,
    allowances: [
      { title: 'Rolling stories', sub: 'fair use', value: 'No cap' },
      { title: 'Chatbot tokens', sub: 'fair use', value: 'No cap' },
    ],
    featuresHeading: 'Everything in Business, and:',
    features: [
      'White-label & custom branding',
      'Dedicated / single-tenant infra',
      'Custom SLA & dedicated Slack',
      'Quarterly business reviews',
    ],
    cta: 'Contact sales',
    ctaVariant: 'default',
  },
];
