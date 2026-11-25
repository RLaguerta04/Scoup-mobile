import { NCR_REGION_CODE } from './constants';
import type { IPhPlacesIndex, IStoryCounts } from './types';

// Deterministic story counts across the country, seeded by newsletter + lens so the map is
// stable per selection but shifts when the lens changes. Mirrors the web's spread: most
// stories cluster in Metro Manila, with a scatter of major cities nationwide.

// mulberry32 over a string hash — same seed, same sequence.
const seededRandom = (seed: string) => {
  let a = 0;
  for (const ch of seed) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Major cities that carry a few stories each, outside the NCR heartland.
const MAJOR_CITIES = [
  'Davao City', 'Cebu City', 'Cagayan de Oro City', 'Zamboanga City',
  'Iloilo City', 'Baguio City', 'Bacolod City', 'General Santos City',
  'Tacloban City', 'Naga City', 'Puerto Princesa City', 'Butuan City',
];

export type MockMap = {
  counts: IStoryCounts;
  total: number;
  placeCount: number;
  unplaced: number;
};

export function buildMockCounts(
  index: IPhPlacesIndex,
  seedKey: string,
): MockMap {
  const rand = seededRandom(seedKey);
  const counts: IStoryCounts = {};

  // NCR cities — the heartland, most stories (skewed small via rand*rand).
  for (const place of index.places.values()) {
    if (place.properties.region !== NCR_REGION_CODE) continue;
    const n = Math.round(rand() * rand() * 13);
    if (n > 0) counts[place.properties.code] = n;
  }

  // A scatter of major cities nationwide — most, but not all, appear.
  const byName = new Map(
    [...index.places.values()].map((p) => [p.properties.name, p] as const),
  );
  for (const name of MAJOR_CITIES) {
    const place = byName.get(name);
    if (!place || rand() < 0.3) continue;
    counts[place.properties.code] = 1 + Math.floor(rand() * 7);
  }

  const placed = Object.values(counts);
  const total = placed.reduce((sum, n) => sum + n, 0);
  return {
    counts,
    total,
    placeCount: placed.length,
    unplaced: 3 + Math.floor(rand() * 6),
  };
}
