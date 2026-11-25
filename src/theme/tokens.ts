// Programmatic tokens — the same values as tailwind.config.js, for contexts that
// can't use className (chart colors, map fills, native props).

export const colors = {
  bg: '#faf9f5',
  surface: '#ffffff',
  surface2: '#f5f4ed',
  surface3: '#f0eee6',
  surface4: '#e8e6dc',
  ink: '#121212',
  ink2: '#3d3d3a',
  ink3: '#73726c',
  ink4: '#505050',
  border: '#e8e6dc',
  primary: '#121212',
  brand: '#f5a623',
  link: '#578bd9',
  campaign: '#5b35b8',
} as const;

// Okabe–Ito colorblind-safe palette for chart series / up-down deltas.
export const tone = {
  positive: '#0072b2',
  neutral: '#999999',
  negative: '#d55e00',
} as const;

// Article-tone sentiment colors — matches the web app's tone bar (red / grey / green).
export const sentiment = {
  positive: '#159d72',
  neutral: '#6b6963',
  negative: '#e34948',
} as const;

// Scoup brand yellow (social bars / day-bar fill) and the Results heatmap cell fill.
export const scoupYellow = '#ffba49';
export const heatFill = '#e8890c';

// The eight tracked emotions (Plutchik) — exact web values (--color-emotion-chart-*).
// Used by the story emotion radar and emotion pills.
export const emotionColor: Record<string, string> = {
  Joy: '#eda100',
  Trust: '#159d72',
  Fear: '#7c3aed',
  Surprise: '#eb6834',
  Sadness: '#2a78d6',
  Disgust: '#5c7a29',
  Anger: '#e34948',
  Anticipation: '#c2185b',
};

export const viz = {
  blue: '#0072b2',
  vermillion: '#d55e00',
  green: '#009e73',
  orange: '#e69f00',
  sky: '#56b4e9',
  purple: '#cc79a7',
  yellow: '#f0e442',
  neutral: '#999999',
} as const;

// AVE-by-medium bar colors — exact web values (--color-medium-*).
export const mediumColor: Record<string, string> = {
  TV: '#7c3aed',
  'Online news': '#1e4fa8',
  Broadsheet: '#5b5bd6',
  Radio: '#d6336c',
  Tabloid: '#e8590c',
  Provincial: '#0b8f8f',
};

// Choropleth amber ramp for post counts (buckets: 0–22, 23–36, 37–43, 44+).
export const choroplethRamp = ['#f0eee6', '#f6d9a8', '#e9a94e', '#dd7f1e'] as const;

export const choroplethFor = (count: number): string => {
  if (count >= 44) return choroplethRamp[3];
  if (count >= 37) return choroplethRamp[2];
  if (count >= 23) return choroplethRamp[1];
  return choroplethRamp[0];
};
