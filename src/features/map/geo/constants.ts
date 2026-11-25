import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl';

// Ported from the web app's map.constants — the light-theme palette and the Dashboard
// story buckets (the mobile app is light-only).

type Bounds = [west: number, south: number, east: number, north: number];

// The main archipelago, Batanes to Tawi-Tawi.
export const PH_BOUNDS: Bounds = [116.9, 4.6, 126.6, 21];
export const PH_PAN_LIMIT: Bounds = [100, -1, 143, 26.5];
export const PH_MIN_ZOOM = 4;
export const PH_MAX_ZOOM = 15;
// Below this zoom provinces stand in for their cities; above it, cities split out.
export const PLACE_MIN_ZOOM = 7;

export const NCR_REGION_CODE = '1300000000';

// One GeoJSON file per region (served from public/geo/ph-places/).
export const PH_REGION_CODES = [
  '0100000000', '0200000000', '0300000000', '0400000000', '0500000000',
  '0600000000', '0700000000', '0800000000', '0900000000', '1000000000',
  '1100000000', '1200000000', NCR_REGION_CODE, '1400000000', '1600000000',
  '1700000000', '1800000000', '1900000000',
] as const;

export const phPlacesUrl = (regionCode: string) => `/geo/ph-places/${regionCode}.geojson`;

// No basemap: the places are the whole map, over the water-coloured container.
export const BLANK_MAP_STYLE: StyleSpecification = { version: 8, sources: {}, layers: [] };

export const LAYER_IDS = {
  provinceFill: 'province-fill',
  placeFill: 'place-fill',
  placeLine: 'place-line',
  provinceLine: 'province-line',
  selectedLine: 'selected-line',
} as const;

// Light-theme palette (matches the web app's MAP_PALETTE.light).
export const MAP_PALETTE = {
  land: ['#f1eee7', '#fbe8bd', '#fbd185', '#f4a62a'] as const,
  border: '#b9b3a3',
  provinceBorder: '#8f897b',
  selected: '#121212',
  water: '#cfe2e8',
};

export type IStoryBucket = { min: number; label: string; color: string };

// The Dashboard prototype's steps, on the land colours.
export const DASHBOARD_STORY_BUCKETS: IStoryBucket[] = [
  { min: 0, label: '0', color: MAP_PALETTE.land[0] },
  { min: 1, label: '1', color: MAP_PALETTE.land[1] },
  { min: 2, label: '2–3', color: MAP_PALETTE.land[2] },
  { min: 4, label: '4+', color: MAP_PALETTE.land[3] },
];

// MapLibre `step` expression: fill a feature by its `stories` property.
export const storyFillColor = (
  buckets: IStoryBucket[] = DASHBOARD_STORY_BUCKETS,
): ExpressionSpecification =>
  [
    'step',
    ['coalesce', ['get', 'stories'], 0],
    buckets[0].color,
    ...buckets.slice(1).flatMap((b) => [b.min, b.color]),
  ] as unknown as ExpressionSpecification;

// A bubble's diameter by its step (1..6): 2 * (9 + step*2), matching the web's size classes.
export const storyNodeSize = (step: number) => 18 + 4 * Math.min(Math.max(step, 1), 6);
