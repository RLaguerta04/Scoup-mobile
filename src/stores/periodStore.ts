import { create } from 'zustand';
import { presetRange } from '@/lib/dateRange';
import type { RangePreset } from '@/types';

// The active reporting period, shown in the header and shared across every tab.
interface PeriodState {
  from: string;
  to: string;
  preset: RangePreset | 'custom';
  setPreset: (preset: RangePreset) => void;
  setCustom: (from: string, to: string) => void;
}

const initial = presetRange('7d');

export const usePeriodStore = create<PeriodState>((set) => ({
  from: initial.from,
  to: initial.to,
  preset: '7d',
  setPreset: (preset) => {
    const { from, to } = presetRange(preset);
    set({ preset, from, to });
  },
  setCustom: (from, to) => set({ preset: 'custom', from, to }),
}));
