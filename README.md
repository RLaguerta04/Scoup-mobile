# Scoup Mobile

Mobile-first, **API-ready** React Native app for Scoup Media Meter. Previews in **Expo
Go**; runs on realistic sample data now and swaps to the real backend by flipping one flag
— no UI changes.

## Stack

Expo (SDK 58) · Expo Router (file-based nav) · TypeScript · NativeWind v4 (Tailwind) ·
TanStack Query · Zustand · React Hook Form + Zod · @gorhom/bottom-sheet ·
react-native-maps · react-native-gifted-charts · Archivo + Chivo Mono fonts.

All chosen to run **inside Expo Go** (no custom dev build needed to prototype).

## Run it

```bash
cd scoup-mobile

# On your phone (Expo Go) — recommended
npx expo start            # scan the QR with the Expo Go app (iOS/Android)

# In a browser (quick layout checks; native map + bottom sheets are device-only)
npx expo start --web
```

> **Android + the Map tab:** react-native-maps uses Google Maps on Android and needs an
> API key (`android.config.googleMaps.apiKey` in `app.json`). On **iOS** it uses Apple Maps
> and works key-free. The web build shows a city-chip fallback instead of the live map.

## Architecture (clean, swappable layers)

```
src/
  app/                      Expo Router screens + navigation
    (tabs)/                 Feed · Map · Decisions · Library · More
    story/[id].tsx          story detail (pushed stack screen)
    _layout.tsx             providers: fonts, QueryClient, gesture/safe-area, bottom-sheet
  components/               design system (ui/*, charts/*, AppHeader)
  features/                 feed/*, map/*  (screen-specific components)
  services/api/
    scoup.ts                endpoint fns — the ONE mock/real switch (USE_MOCKS)
    queries.ts              TanStack Query hooks (all screens read data through these)
    client.ts               axios client for the real API (auth + base URL)
  data/mock/                entities + deterministic generators (view-models)
  stores/                   zustand: selection (newsletter), filters
  theme/tokens.ts           colors + Okabe–Ito viz palette (ported from the web app)
  types/                    domain view-models
  lib/                      config (USE_MOCKS, API_URL), queryClient, format helpers
```

**Rule:** a screen never calls the network directly — it uses a `useX()` query hook →
`services/api` → mock (now) or real API (later).

## API-ready: mock → real

- Default: `USE_MOCKS = true` (sample data, with simulated latency so loading states are
  real). Set `EXPO_PUBLIC_USE_MOCKS=false` + `EXPO_PUBLIC_API_URL=<backend>` to go live.
- Each endpoint fn in `services/api/scoup.ts` documents its real route + where the response
  mapper goes. Screens consume typed **view-models**, so swapping the data source needs
  **no component changes**.

## Design system

Ported from the web app's tokens: cream `#faf9f5` surfaces, near-black ink, amber brand
accent, and the **Okabe–Ito colorblind-safe** palette for tone/sentiment. Type is Archivo
(UI) + Chivo Mono (uppercase micro-labels + numbers). Primitives in `components/ui` +
`components/charts` map ~1:1 to the web's Shadcn set.

## What's built

- **Feed** — Stories / Articles / Posts (segmented), date-range chips, story cards →
  detail, and the **This period** analytics in a swipe-up sheet (results, AVE, tone,
  mobile heatmap, AVE-by-medium, social).
- **Map** — full-screen Metro Manila map (native) with count markers → place bottom sheet
  (Sentiment / Most posts / Top posts). Web shows a city-chip fallback.
- **Decisions / Library / More** — present as tabs; fill in next.

## Notes

- Bottom sheets (@gorhom) render on device; on react-native-web they can be finicky — use
  a phone to review the This-period and place sheets.
- The story-detail deep sections (Narrative / Social / Coverage) use placeholder prose;
  wire to per-story endpoints when the API lands.
