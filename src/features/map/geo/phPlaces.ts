import { NCR_REGION_CODE } from './constants';
import type {
  IPhPlacesCollection,
  IPhPlacesIndex,
  IPlaceFeature,
  IProvinceFeature,
  IRegionFeature,
  IStoryCounts,
  IStoryNode,
} from './types';

// Ported from the web app's phPlaces util — the pure index + count logic.

export const indexPhPlaces = (collection: IPhPlacesCollection): IPhPlacesIndex => {
  const index: IPhPlacesIndex = {
    provinces: new Map(),
    places: new Map(),
    regions: [],
    placesByProvince: new Map(),
  };
  for (const feature of collection.features) {
    const { properties } = feature;
    if (properties.level === 'province') {
      index.provinces.set(properties.code, feature as IProvinceFeature);
    } else if (properties.level === 'place') {
      const place = feature as IPlaceFeature;
      index.places.set(properties.code, place);
      const siblings = index.placesByProvince.get(properties.province) ?? [];
      siblings.push(place);
      index.placesByProvince.set(properties.province, siblings);
    } else {
      index.regions.push(feature as IRegionFeature);
    }
  }
  return index;
};

// A province shows its busiest place, so a quiet province with one busy city stands out.
export const provinceStoryCount = (
  index: IPhPlacesIndex,
  provinceCode: string,
  counts: IStoryCounts,
) =>
  Math.max(
    0,
    ...(index.placesByProvince.get(provinceCode) ?? []).map(
      (place) => counts[place.properties.code] ?? 0,
    ),
  );

// Attach a `stories` property to every province/place feature for the fill expression.
export const withStoryCounts = (
  collection: IPhPlacesCollection,
  index: IPhPlacesIndex,
  counts: IStoryCounts,
): IPhPlacesCollection => ({
  ...collection,
  features: collection.features.map((feature) => {
    const { level, code } = feature.properties;
    if (level === 'region') return feature;
    const stories =
      level === 'province'
        ? provinceStoryCount(index, code, counts)
        : (counts[code] ?? 0);
    return { ...feature, properties: { ...feature.properties, stories } };
  }),
});

export const bboxCenter = (bbox: number[]) => ({
  longitude: (bbox[0] + bbox[2]) / 2,
  latitude: (bbox[1] + bbox[3]) / 2,
});

// A bubble's size, 1..6.
export const nodeStep = (count: number) => Math.min(count, 6);

// Which cities share a region's bubble: none, or Metro Manila's.
export type NodeMerge = 'none' | 'ncr';

const unionBbox = (boxes: number[][]): number[] | null => {
  if (!boxes.length) return null;
  let [w, s, e, n] = boxes[0];
  for (const b of boxes.slice(1)) {
    w = Math.min(w, b[0]);
    s = Math.min(s, b[1]);
    e = Math.max(e, b[2]);
    n = Math.max(n, b[3]);
  }
  return [w, s, e, n];
};

// One bubble per place with stories, quietest first so the busiest draw on top. Until place
// zoom, Metro Manila's cities share one bubble (merge='ncr'), as in the web prototype.
export const storyNodes = (
  index: IPhPlacesIndex,
  counts: IStoryCounts,
  merge: NodeMerge,
): IStoryNode[] => {
  const nodes: IStoryNode[] = [];
  const ncr: IStoryNode[] = [];
  for (const [code, stories] of Object.entries(counts)) {
    const place = index.places.get(code);
    if (!place?.bbox || stories <= 0) continue;
    const node: IStoryNode = {
      code,
      name: place.properties.name,
      stories,
      step: nodeStep(stories),
      bbox: place.bbox as number[],
    };
    if (merge === 'ncr' && place.properties.region === NCR_REGION_CODE) {
      ncr.push(node);
    } else {
      nodes.push(node);
    }
  }
  if (ncr.length) {
    const bbox = unionBbox(ncr.map((n) => n.bbox));
    if (bbox) {
      const stories = ncr.reduce((sum, n) => sum + n.stories, 0);
      nodes.push({
        code: NCR_REGION_CODE,
        name: 'Metro Manila',
        stories,
        step: nodeStep(stories),
        bbox,
        places: ncr.length,
      });
    }
  }
  return nodes.sort((a, b) => a.stories - b.stories);
};

export const formatStories = (n: number) => `${n} ${n === 1 ? 'story' : 'stories'}`;

// Busiest places first (stable), for the "most in A, B and C" caption.
export const topPlaces = (
  index: IPhPlacesIndex,
  counts: IStoryCounts,
  limit: number,
): { name: string; stories: number }[] =>
  Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([code, n]) => ({
      name: index.places.get(code)?.properties.name ?? code,
      stories: n,
    }))
    .sort((a, b) => b.stories - a.stories)
    .slice(0, limit);
