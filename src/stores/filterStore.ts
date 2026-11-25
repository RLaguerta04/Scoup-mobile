import { create } from 'zustand';
import type { Lens, MentionsTab } from '@/types';

// Daily Feed state — the two filter levels that mirror the web's feed:
//   tab  (Stories / Articles / Posts)
//   lens (All / MediaWatch / SharedView)
// The newsletter view (Feed / Dashboard / Report / Map) is now a bottom-tab route;
// the reporting period is separate and global (periodStore).
interface FilterState {
  lens: Lens;
  tab: MentionsTab;
  setLens: (lens: Lens) => void;
  setTab: (tab: MentionsTab) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  lens: 'all',
  tab: 'stories',
  setLens: (lens) => set({ lens }),
  setTab: (tab) => set({ tab }),
}));
