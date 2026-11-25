import { useLocalSearchParams } from 'expo-router';
import { StoryCanvas } from '@/features/decision-report/canvas/StoryCanvas';

// The pushed Story Canvas — the full single-story detail (Phase 2). The initial story is
// the one tapped in the brief; prev/next inside the canvas walk the rest of the edition.
export default function ReportStoryScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  return <StoryCanvas storyId={storyId ?? ''} />;
}
