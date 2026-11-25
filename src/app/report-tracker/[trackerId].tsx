import { useLocalSearchParams } from 'expo-router';
import { TrackerDetailView } from '@/features/decision-report/tracker/TrackerDetailView';

// The pushed crisis-tracker detail, opened from the "Crises open" panel or a story row's
// "Tracker · Day N" chip in the Decision report.
export default function ReportTrackerScreen() {
  const { trackerId } = useLocalSearchParams<{ trackerId: string }>();
  return <TrackerDetailView trackerId={trackerId ?? ''} />;
}
