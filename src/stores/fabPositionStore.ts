import { create } from 'zustand';

// Remembers where the user dragged the floating "Ask Scoup" button, so it stays put when
// switching the Newsletters sub-views (and across the session). `bottom` is the button's
// bottom-edge distance from the screen bottom (bottom-anchored, like the tab bar / "This
// period" pill — robust on native); -1 means "unset — use the default spot".
interface FabPositionState {
  side: 'left' | 'right';
  bottom: number;
  setPosition: (side: 'left' | 'right', bottom: number) => void;
}

export const useFabPosition = create<FabPositionState>((set) => ({
  side: 'right',
  bottom: -1,
  setPosition: (side, bottom) => set({ side, bottom }),
}));
