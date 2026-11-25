import { create } from 'zustand';
import type { IStoryFootnote } from '@/types';

// Drives the Source bottom-sheet opened when a `[^n]` citation chip is tapped. Lives in a store
// (not props) so any prose anywhere in the Story page can open it without threading a callback.
interface SourceSheetState {
  footnote: IStoryFootnote | null;
  open: (footnote: IStoryFootnote) => void;
  close: () => void;
}

export const useSourceSheet = create<SourceSheetState>((set) => ({
  footnote: null,
  open: (footnote) => set({ footnote }),
  close: () => set({ footnote: null }),
}));
