import { create } from 'zustand';

// Lets a screen hide the floating bottom tab bar — e.g. during multi-select, so a bottom
// action bar (Cancel / Delete) can take its place without the pill overlapping it. Global
// because the bar is rendered once by the Tabs navigator, above every screen.
interface TabBarState {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}

export const useTabBarStore = create<TabBarState>((set) => ({
  hidden: false,
  setHidden: (hidden) => set({ hidden }),
}));
