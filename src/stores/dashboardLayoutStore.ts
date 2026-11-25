import { create } from 'zustand';
import { DASH_CHART_IDS, type DashChartId } from '@/features/dashboard/DashboardChartStack';

// Which Dashboard chart cards are shown — the mobile take on the web's "Choose the charts"
// picker (minus reorder). All six show by default. Session-scoped (plain store, like the
// app's other stores); it survives sub-tab switches but resets on a full app restart.
interface DashboardLayoutState {
  hidden: Record<DashChartId, boolean>;
  toggle: (id: DashChartId) => void;
  showAll: () => void;
  hideAll: () => void;
  reset: () => void;
}

const NONE = {} as Record<DashChartId, boolean>;
const ALL_HIDDEN = Object.fromEntries(DASH_CHART_IDS.map((id) => [id, true])) as Record<
  DashChartId,
  boolean
>;

export const useDashboardLayoutStore = create<DashboardLayoutState>((set) => ({
  hidden: NONE,
  toggle: (id) =>
    set((s) => ({ hidden: { ...s.hidden, [id]: !s.hidden[id] } })),
  showAll: () => set({ hidden: { ...NONE } }),
  hideAll: () => set({ hidden: { ...ALL_HIDDEN } }),
  reset: () => set({ hidden: { ...NONE } }),
}));

// The visible charts, in registry order (reorder isn't supported).
export const shownChartIds = (hidden: Record<DashChartId, boolean>): DashChartId[] =>
  DASH_CHART_IDS.filter((id) => !hidden[id]);
