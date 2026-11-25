import { create } from 'zustand';
import type { IMentionsFilters, RankBy } from '@/types';

// Sort + advanced filters for the Mentions feed (the web's Rank-by dropdown and
// Filters panel). Kept separate from the view/tab/lens navigation (filterStore).
export const EMPTY_FILTERS: IMentionsFilters = {
  mediums: [],
  emphasis: 'all',
  tones: [],
  storyValueMin: 0,
  platforms: [],
  commentSentiment: 'all',
  days: [],
  outlets: [],
};

/** Number of active (non-default) filters — drives the badge on the Filters button. */
export const countActiveFilters = (f: IMentionsFilters): number =>
  f.mediums.length +
  (f.emphasis !== 'all' ? 1 : 0) +
  f.tones.length +
  (f.storyValueMin > 0 ? 1 : 0) +
  f.platforms.length +
  (f.commentSentiment !== 'all' ? 1 : 0) +
  f.days.length +
  f.outlets.length;

/** Stable string for query keys + deterministic mock seeding. */
export const filterSignature = (f: IMentionsFilters): string =>
  [
    f.mediums.join(','),
    f.emphasis,
    f.tones.join(','),
    f.storyValueMin,
    f.platforms.join(','),
    f.commentSentiment,
    f.days.join(','),
    f.outlets.join(','),
  ].join('|');

interface MentionsFilterState {
  rankBy: RankBy;
  filters: IMentionsFilters;
  setRankBy: (rankBy: RankBy) => void;
  applyFilters: (filters: IMentionsFilters) => void;
  resetFilters: () => void;
}

export const useMentionsFilterStore = create<MentionsFilterState>((set) => ({
  rankBy: 'articles',
  filters: EMPTY_FILTERS,
  setRankBy: (rankBy) => set({ rankBy }),
  applyFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
}));
