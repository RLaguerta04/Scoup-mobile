import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson';

// Subset of the web app's map types, ported for the mobile Dashboard choropleth.
// Codes are 10-digit PSGC codes; the GeoJSON carries level/code/name per feature.
export type PlaceKind = 'city' | 'huc' | 'municipality';

export type IProvinceProperties = {
  level: 'province';
  code: string;
  name: string;
  region: string;
};

export type IPlaceProperties = {
  level: 'place';
  code: string;
  name: string;
  kind: PlaceKind;
  province: string;
  region: string;
  // Attached at runtime by withStoryCounts for the fill expression.
  stories?: number;
};

export type IRegionProperties = {
  level: 'region';
  code: string;
  name: string;
  fullName: string;
};

export type IProvinceFeature = Feature<Polygon | MultiPolygon, IProvinceProperties>;
export type IPlaceFeature = Feature<Polygon | MultiPolygon, IPlaceProperties>;
export type IRegionFeature = Feature<Point, IRegionProperties>;

export type IPhPlacesCollection = FeatureCollection<
  Polygon | MultiPolygon | Point,
  IProvinceProperties | IPlaceProperties | IRegionProperties
>;

// Story counts keyed by PSGC code.
export type IStoryCounts = Record<string, number>;

// A Dashboard bubble: a place with stories, or NCR's cities merged into one (then `code` is
// NCR's region code and `places` is how many cities it holds).
export type IStoryNode = {
  code: string;
  name: string;
  stories: number;
  step: number;
  bbox: number[];
  places?: number;
};

export type IPhPlacesIndex = {
  provinces: Map<string, IProvinceFeature>;
  places: Map<string, IPlaceFeature>;
  regions: IRegionFeature[];
  placesByProvince: Map<string, IPlaceFeature[]>;
};
