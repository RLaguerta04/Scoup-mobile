import { SectionHeader } from '@/components/SectionHeader';
import { Screen } from '@/components/ui/Card';
import { MapMonitorView } from '@/features/map/MapMonitorView';

// The Local map monitor — moved out of the Newsletters sub-nav into its own "More" destination
// (Marco, 2026-11-23). It's newsletter-scoped via the global selection store, so it reflects
// whichever newsletter is picked on the Newsletters tab. Mirrors the web's "Local" map view.
export default function MapScreen() {
  return (
    <Screen>
      <SectionHeader title="Map" />
      <MapMonitorView />
    </Screen>
  );
}
