import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Layer,
  Map as MapLibreMap,
  Marker,
  Source,
  type MapRef,
} from '@vis.gl/react-maplibre';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import type { FilterSpecification } from 'maplibre-gl';
import type { DashboardMapProps } from './dashboardMap.types';
import {
  BLANK_MAP_STYLE,
  DASHBOARD_STORY_BUCKETS,
  LAYER_IDS,
  MAP_PALETTE,
  NCR_REGION_CODE,
  PH_BOUNDS,
  PH_MAX_ZOOM,
  PH_MIN_ZOOM,
  PH_PAN_LIMIT,
  PLACE_MIN_ZOOM,
  storyFillColor,
  storyNodeSize,
} from './geo/constants';
import { fetchAllPlaces } from './geo/loadPlaces';
import { bboxCenter, indexPhPlaces, storyNodes, withStoryCounts } from './geo/phPlaces';
import type { IPhPlacesCollection, IPhPlacesIndex, IStoryNode } from './geo/types';

// Metro can't resolve maplibre's worker via import.meta.url, so point it at the copy served
// from public/ (see MapCanvas.web.tsx for the full note). Idempotent across the web maps.
setWorkerUrl('/maplibre-gl-worker.js');

const FILL = storyFillColor();
const byLevel = (level: string): FilterSpecification =>
  ['==', ['get', 'level'], level] as unknown as FilterSpecification;

type Bounds2 = [[number, number], [number, number]];

// Union of the bboxes of places that pass `keep` — for the preset "fit" buttons + NCR fit.
const placesBounds = (
  index: IPhPlacesIndex,
  keep: (code: string, region: string) => boolean,
): Bounds2 | null => {
  let box: number[] | null = null;
  for (const place of index.places.values()) {
    if (!place.bbox || !keep(place.properties.code, place.properties.region)) continue;
    const b = place.bbox as number[];
    box = box
      ? [Math.min(box[0], b[0]), Math.min(box[1], b[1]), Math.max(box[2], b[2]), Math.max(box[3], b[3])]
      : [b[0], b[1], b[2], b[3]];
  }
  return box ? [[box[0], box[1]], [box[2], box[3]]] : null;
};

function Bubble({ node, picked, onPress }: { node: IStoryNode; picked: boolean; onPress: () => void }) {
  const d = storyNodeSize(node.step);
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onPress();
      }}>
      <div
        style={{
          width: d,
          height: d,
          borderRadius: d / 2,
          background: picked ? '#1e4fa8' : '#f4a62a',
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          color: picked ? '#fff' : '#1a1a1a',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}>
        {node.stories}
      </div>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: '#1a1a1a',
          whiteSpace: 'nowrap',
          textShadow: '0 0 2px #f6f3ec, 0 0 3px #f6f3ec',
        }}>
        {node.name}
      </span>
    </div>
  );
}

const PRESETS: { label: string; key: 'stories' | 'ncr' | 'ph' }[] = [
  { label: 'All places', key: 'stories' },
  { label: 'Metro Manila', key: 'ncr' },
  { label: 'Philippines', key: 'ph' },
];

// The Dashboard's map (web): the web app's region-shaded choropleth. Counts come from the
// story→place tags (props), so tapping a place scopes the list + charts in DashboardView.
export function DashboardMap({ counts, total, placeCount, selectedCode, onSelectPlace }: DashboardMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [collection, setCollection] = useState<IPhPlacesCollection | null>(null);
  const [failed, setFailed] = useState(false);
  const [belowPlaceZoom, setBelowPlaceZoom] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    fetchAllPlaces()
      .then((c) => alive && setCollection(c))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const index = useMemo(() => (collection ? indexPhPlaces(collection) : null), [collection]);
  const data = useMemo(
    () => (collection && index ? withStoryCounts(collection, index, counts) : null),
    [collection, index, counts],
  );
  const nodes = useMemo(
    () => (index ? storyNodes(index, counts, belowPlaceZoom ? 'ncr' : 'none') : []),
    [index, counts, belowPlaceZoom],
  );
  const bubbledCodes = useMemo(() => new Set(nodes.map((n) => n.code)), [nodes]);

  const ncrBounds = useMemo<[number, number, number, number] | undefined>(() => {
    if (!index) return undefined;
    const b = placesBounds(index, (_c, r) => r === NCR_REGION_CODE);
    return b ? [b[0][0], b[0][1], b[1][0], b[1][1]] : undefined;
  }, [index]);

  // Fly to the scoped place when it changes (the list is already filtering to it).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !index || !selectedCode) return;
    if (selectedCode === NCR_REGION_CODE) {
      const b = placesBounds(index, (_c, r) => r === NCR_REGION_CODE);
      if (b) map.fitBounds(b, { padding: 24, duration: 500 });
      return;
    }
    const bbox = index.places.get(selectedCode)?.bbox as number[] | undefined;
    if (bbox) map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 56, duration: 500 });
  }, [selectedCode, index]);

  const flyTo = (bounds: Bounds2 | null) => {
    if (bounds) mapRef.current?.fitBounds(bounds, { padding: 24, duration: 500 });
  };
  const onPreset = (key: 'stories' | 'ncr' | 'ph') => {
    if (key === 'ph') mapRef.current?.fitBounds(PH_BOUNDS, { padding: 16, duration: 500 });
    else if (key === 'ncr') flyTo(index ? placesBounds(index, (_c, r) => r === NCR_REGION_CODE) : null);
    else flyTo(index ? placesBounds(index, (code) => (counts[code] ?? 0) > 0) : null);
  };

  if (failed) {
    return (
      <View className="flex-1 items-center justify-center bg-surface3 px-6">
        <Txt className="text-center text-[13px] text-ink-3">Couldn’t load the map.</Txt>
        <Pressable
          onPress={() => {
            setCollection(null);
            setFailed(false);
            fetchAllPlaces()
              .then(setCollection)
              .catch(() => setFailed(true));
          }}
          className="mt-3 rounded-full border border-border bg-surface px-4 py-2">
          <Txt weight="medium" className="text-[12px] text-ink-2">
            Try again
          </Txt>
        </Pressable>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: MAP_PALETTE.water }}>
        <Skeleton className="h-16 w-16" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <div style={{ position: 'absolute', inset: 0, background: MAP_PALETTE.water }}>
        <MapLibreMap
          ref={mapRef}
          initialViewState={{ bounds: ncrBounds ?? PH_BOUNDS, fitBoundsOptions: { padding: 24 } }}
          style={{ position: 'absolute', inset: 0 }}
          mapStyle={BLANK_MAP_STYLE}
          minZoom={PH_MIN_ZOOM}
          maxZoom={PH_MAX_ZOOM}
          maxBounds={PH_PAN_LIMIT}
          renderWorldCopies={false}
          attributionControl={false}
          dragRotate={false}
          pitchWithRotate={false}
          onLoad={(e) => setBelowPlaceZoom(e.target.getZoom() < PLACE_MIN_ZOOM)}
          onZoom={(e) => setBelowPlaceZoom(e.viewState.zoom < PLACE_MIN_ZOOM)}>
          <Source id="places" type="geojson" data={data}>
            <Layer id={LAYER_IDS.provinceFill} type="fill" filter={byLevel('province')} maxzoom={PLACE_MIN_ZOOM} paint={{ 'fill-color': FILL }} />
            <Layer id={LAYER_IDS.placeFill} type="fill" filter={byLevel('place')} minzoom={PLACE_MIN_ZOOM} paint={{ 'fill-color': FILL }} />
            <Layer id={LAYER_IDS.placeLine} type="line" filter={byLevel('place')} minzoom={PLACE_MIN_ZOOM} paint={{ 'line-color': MAP_PALETTE.border, 'line-width': 0.7 }} />
            <Layer id={LAYER_IDS.provinceLine} type="line" filter={byLevel('province')} paint={{ 'line-color': MAP_PALETTE.provinceBorder, 'line-width': 0.9 }} />
          </Source>

          {/* Region names, hidden where a bubble already sits (merged NCR). */}
          {belowPlaceZoom &&
            index?.regions
              .filter((r) => !bubbledCodes.has(r.properties.code))
              .map((r) => (
                <Marker key={r.properties.code} longitude={r.geometry.coordinates[0]} latitude={r.geometry.coordinates[1]}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a', whiteSpace: 'nowrap', textShadow: '0 0 2px #f6f3ec, 0 0 3px #f6f3ec' }}>
                    {r.properties.name}
                  </span>
                </Marker>
              ))}

          {/* Story bubbles — tap scopes the list + charts to that place. */}
          {nodes.map((node) => {
            const c = bboxCenter(node.bbox);
            return (
              <Marker key={node.code} longitude={c.longitude} latitude={c.latitude} anchor="left" offset={[-storyNodeSize(node.step) / 2, 0]}>
                <Bubble
                  node={node}
                  picked={node.code === selectedCode}
                  onPress={() => onSelectPlace(node.code, node.name)}
                />
              </Marker>
            );
          })}
        </MapLibreMap>

        {/* Caption chip + compact preset views (top-left, clear of the drawer). */}
        <View className="absolute left-2.5 top-2.5" style={{ gap: 6 }}>
          <View className="self-start rounded-full border border-border bg-surface/90 px-2.5 py-1">
            <Txt className="text-[11px] text-ink-2">
              {total} stories · {placeCount} places
            </Txt>
          </View>
          <View className="flex-row self-start overflow-hidden rounded-full border border-border bg-surface/90">
            {PRESETS.map((p, i) => (
              <Pressable
                key={p.key}
                onPress={() => onPreset(p.key)}
                className={`px-3 py-2 ${i > 0 ? 'border-l border-border' : ''}`}>
                <Txt weight="medium" className="text-[12px] text-ink-2">
                  {p.label}
                </Txt>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Legend — collapsed to a 'Key' chip, tap to reveal/hide (top-right). */}
        <View className="absolute right-2.5 top-2.5">
          {legendOpen ? (
            <Pressable
              onPress={() => setLegendOpen(false)}
              accessibilityLabel="Hide map legend"
              className="flex-row items-center gap-2 rounded-lg border border-border bg-surface/95 px-2.5 py-2">
              <Txt mono className="text-[9px] uppercase tracking-wider text-ink-3">
                Stories
              </Txt>
              {DASHBOARD_STORY_BUCKETS.slice(1).map((b) => (
                <View key={b.label} className="flex-row items-center gap-1">
                  <View style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: b.color }} />
                  <Txt className="text-[10px] text-ink-3">{b.label}</Txt>
                </View>
              ))}
              <View className="flex-row items-center gap-1">
                <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: '#f4a62a', borderWidth: 1.5, borderColor: '#fff' }} />
                <Txt className="text-[10px] text-ink-3">Venue</Txt>
              </View>
              <Txt className="ml-0.5 text-[12px] text-ink-3">✕</Txt>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setLegendOpen(true)}
              accessibilityLabel="Show map legend"
              className="flex-row items-center gap-1.5 rounded-full border border-border bg-surface/90 px-3 py-2">
              <View className="flex-row">
                {DASHBOARD_STORY_BUCKETS.slice(1).map((b) => (
                  <View
                    key={b.label}
                    style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: b.color, marginLeft: -2, borderWidth: 1, borderColor: '#fff' }}
                  />
                ))}
              </View>
              <Txt weight="medium" className="text-[11px] text-ink-2">
                Key
              </Txt>
            </Pressable>
          )}
        </View>
      </div>
    </View>
  );
}
