'use dom';

import { useEffect, useRef } from 'react';
import { Map as MapLibreMap, Marker, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// maplibre can't resolve its own worker URL under Metro, so we point it at the copy the
// web app already serves from public/ (available at the DOM webview's root). Pinned to the
// installed maplibre-gl version — re-copy public/maplibre-gl-worker.js if that bumps.
setWorkerUrl('/maplibre-gl-worker.js');

export type DomMarker = {
  name: string;
  lat: number;
  lng: number;
  label: number;
  color: string;
  size: number;
};

// Expo DOM component: rendered as a web page inside a native WebView (@expo/dom-webview),
// so it runs real MapLibre GL JS with free OpenFreeMap tiles — no Google key, no native map
// library. Only mounted when the device is online (MapCanvas gates on connectivity).
export default function MapDom({
  markers,
  center,
  zoom,
  onSelect,
}: {
  markers: DomMarker[];
  center: { lat: number; lng: number };
  zoom: number;
  onSelect: (city: string) => Promise<void>;
  dom?: import('expo/dom').DOMProps;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const map = new MapLibreMap({
      container: el,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
    });
    const created: Marker[] = [];
    markers.forEach((m) => {
      const node = document.createElement('div');
      node.textContent = String(m.label);
      Object.assign(node.style, {
        width: `${m.size}px`,
        height: `${m.size}px`,
        borderRadius: '50%',
        background: m.color,
        border: '2px solid #ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: '11px',
        fontWeight: '700',
        color: '#1a1a1a',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        cursor: 'pointer',
      });
      node.addEventListener('click', () => {
        void onSelectRef.current(m.name);
      });
      created.push(new Marker({ element: node }).setLngLat([m.lng, m.lat]).addTo(map));
    });
    return () => {
      created.forEach((mk) => mk.remove());
      map.remove();
    };
  }, [markers, center.lat, center.lng, zoom]);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}
