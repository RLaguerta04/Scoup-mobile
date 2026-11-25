// Runtime config. Env vars are read via Expo's EXPO_PUBLIC_* convention.

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api-staging.scoup.app';

/**
 * Dev-only: serve realistic sample data through the data layer so every screen is
 * populated without a backend. Flip to false (and set EXPO_PUBLIC_API_URL) to hit
 * the real API — the UI consumes the same typed view-models either way, so no
 * component changes are needed. See src/services/api/request.ts.
 */
export const USE_MOCKS =
  (process.env.EXPO_PUBLIC_USE_MOCKS ?? 'true') !== 'false';

/** Simulated latency (ms) for mock responses, so loading/skeleton states are real. */
export const MOCK_LATENCY_MS = 350;
