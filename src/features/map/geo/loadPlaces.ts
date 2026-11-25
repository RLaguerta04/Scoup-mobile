import { PH_REGION_CODES, phPlacesUrl } from './constants';
import type { IPhPlacesCollection } from './types';

// Fetch all 18 region GeoJSON files (served from public/geo/ph-places/) and merge their
// features into one collection. Web-only: the native Dashboard map uses react-native-maps.
let cache: Promise<IPhPlacesCollection> | null = null;

export function fetchAllPlaces(): Promise<IPhPlacesCollection> {
  if (cache) return cache;
  cache = Promise.all(
    PH_REGION_CODES.map((code) =>
      fetch(phPlacesUrl(code)).then((res) => {
        if (!res.ok) throw new Error(`geo ${code}: ${res.status}`);
        return res.json() as Promise<IPhPlacesCollection>;
      }),
    ),
  ).then((parts) => ({
    type: 'FeatureCollection',
    features: parts.flatMap((p) => p.features),
  }));
  // Let a failed load be retried on the next mount.
  cache.catch(() => {
    cache = null;
  });
  return cache;
}
