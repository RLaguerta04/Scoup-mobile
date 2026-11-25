import type { IStoryMapArea } from '@/types';

// Shared props for the platform-split DashboardMap (native react-native-maps + web MapLibre).
// The counts/areas come from the story→place tags so the map, list and charts agree; the
// map emits the tapped place so DashboardView can scope everything to it.
export type DashboardMapProps = {
  /** Story counts per place, keyed by PSGC code (web choropleth shading + bubbles). */
  counts: Record<string, number>;
  /** Places with stories (native NCR markers use `short`/`name`). */
  areas: IStoryMapArea[];
  total: number;
  placeCount: number;
  unplaced: number;
  /** The currently scoped place (PSGC code, or the NCR region code for Metro Manila). */
  selectedCode: string | null;
  onSelectPlace: (code: string, name: string) => void;
};
