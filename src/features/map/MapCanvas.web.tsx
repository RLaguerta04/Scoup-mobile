import { Map as MapLibreMap, Marker } from '@vis.gl/react-maplibre';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CITY_COORDS, NCR_REGION } from './cityCoords';

// maplibre resolves its worker via `new URL('./maplibre-gl-worker.mjs', import.meta.url)`,
// which Metro can't satisfy (the bundle has no servable sibling URL), so the worker never
// starts and every tile/GeoJSON source stays blank while DOM markers still render. We serve
// a copy of the self-contained worker from public/ and point maplibre at it. Pinned to the
// installed maplibre-gl version — re-copy public/maplibre-gl-worker.js if that bumps.
setWorkerUrl('/maplibre-gl-worker.js');
import { choroplethFor } from '@/theme/tokens';
import type { IMapArea } from '@/types';

// Web map: react-native-maps is native-only, so the browser build renders the map with
// MapLibre instead (same engine the web app uses). On device the native <MapCanvas>
// (MapCanvas.tsx) renders react-native-maps. Both share this props shape.
//
// SPIKE STEP: a hosted OpenFreeMap basemap + the city markers, to confirm MapLibre bundles
// and renders under Expo's Metro web build. The region-shaded choropleth is layered on next.
const postSize = (n: number): number => (n >= 55 ? 40 : n >= 28 ? 34 : 28);

export function MapCanvas({
  areas,
  onSelect,
  colorFor = choroplethFor,
  sizeFor = postSize,
}: {
  areas: IMapArea[];
  onSelect: (city: string) => void;
  colorFor?: (n: number) => string;
  sizeFor?: (n: number) => number;
}) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapLibreMap
        initialViewState={{
          longitude: NCR_REGION.longitude,
          latitude: NCR_REGION.latitude,
          zoom: 9.2,
        }}
        style={{ position: 'absolute', inset: 0 }}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        attributionControl={false}>
        {areas.map((a) => {
          const c = CITY_COORDS[a.name];
          if (!c) return null;
          const size = sizeFor(a.posts);
          return (
            <Marker
              key={a.name}
              longitude={c.lng}
              latitude={c.lat}
              onClick={() => onSelect(a.name)}>
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  background: colorFor(a.posts),
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}>
                {a.posts}
              </div>
            </Marker>
          );
        })}
      </MapLibreMap>
    </div>
  );
}
