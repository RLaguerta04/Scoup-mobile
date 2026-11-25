import { create } from 'zustand';

// The current scope, shared across tabs (replaces the desktop left-sidebar tree).
// `bucketId === null` means the whole newsletter; a bucket id narrows to that
// keyword group.
interface SelectionState {
  newsletterId: string;
  bucketId: number | null;
  selectNewsletter: (id: string) => void;
  selectBucket: (newsletterId: string, bucketId: number) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  newsletterId: 'nl-telco',
  bucketId: null,
  selectNewsletter: (newsletterId) => set({ newsletterId, bucketId: null }),
  selectBucket: (newsletterId, bucketId) => set({ newsletterId, bucketId }),
}));
