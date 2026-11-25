import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { choroplethFor, colors } from '@/theme/tokens';
import { CITY_COORDS, NCR_REGION } from './cityCoords';
import MapDom, { type DomMarker } from './MapDom';
import type { IMapArea } from '@/types';

// Native map surface.
//
// react-native-maps' MapView needs a Google Maps API key (absent in this standalone/offline
// build) and crashes on Android without one, so we don't use it. Instead:
//   • ONLINE  → a real MapLibre map (OpenFreeMap tiles, no key) via an Expo DOM component
//               rendered in a WebView — same map engine the web app uses.
//   • OFFLINE → a lightweight placeholder: the same sized, colour-ramped city markers as a
//               tappable grid, so selecting a city still scopes the panels / place sheet.
// The web build (MapCanvas.web.tsx) renders MapLibre directly.

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
  // Default to the offline placeholder; only swap in the real map once a quick reachability
  // probe to the tile server confirms we're online (so offline never shows a blank WebView).
  const [online, setOnline] = useState(false);
  useEffect(() => {
    let active = true;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    fetch('https://tiles.openfreemap.org/styles/positron', { signal: ctl.signal })
      .then((r) => {
        if (active) setOnline(r.ok);
      })
      .catch(() => {
        if (active) setOnline(false);
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      ctl.abort();
    };
  }, []);

  // Parity with the real map: only cities with known coordinates were ever plotted.
  const plotted = areas.filter((a) => CITY_COORDS[a.name]);

  if (online) {
    const markers: DomMarker[] = plotted.map((a) => {
      const c = CITY_COORDS[a.name];
      return {
        name: a.name,
        lat: c.lat,
        lng: c.lng,
        label: a.posts,
        color: colorFor(a.posts),
        size: sizeFor(a.posts),
      };
    });
    return (
      <View style={{ flex: 1 }}>
        <MapDom
          dom={{ scrollEnabled: false, style: { flex: 1 } }}
          markers={markers}
          center={{ lat: NCR_REGION.latitude, lng: NCR_REGION.longitude }}
          zoom={9.2}
          onSelect={async (city) => {
            onSelect(city);
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface2 }}>
      <View className="items-center pt-14 pb-3">
        <Txt variant="caption" className="text-ink-3">
          Map preview — tap a city
        </Txt>
      </View>
      <View className="flex-1 flex-row flex-wrap content-start items-start justify-center gap-3 px-6">
        {plotted.map((a) => {
          const size = sizeFor(a.posts);
          return (
            <Pressable
              key={a.name}
              onPress={() => onSelect(a.name)}
              className="items-center"
              style={{ width: 76 }}>
              <View
                className="items-center justify-center rounded-full border-2 border-white"
                style={{ width: size, height: size, backgroundColor: colorFor(a.posts) }}>
                <Txt mono weight="bold" className="text-[11px] text-ink">
                  {a.posts}
                </Txt>
              </View>
              <Txt className="mt-1 text-[10px] text-ink-2" numberOfLines={1}>
                {a.name}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
