import { PublishersListView } from '@/features/publishers/PublishersListView';

// The managed list of news outlets you monitor — add, edit, delete and see which
// keyword buckets each feeds. Mirrors the web's Publishers page (content + behaviour),
// rebuilt in the app's card-list idiom. Reached from the More hub.
export default function PublishersScreen() {
  return <PublishersListView />;
}
