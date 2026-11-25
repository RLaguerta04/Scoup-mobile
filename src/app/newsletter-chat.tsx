import { useLocalSearchParams } from 'expo-router';
import { SagaChatView } from '@/features/chat/SagaChatView';
import type { SagaView } from '@/features/chat/sagaChat';

const VALID: SagaView[] = ['feed', 'dashboard', 'report', 'map', 'settings'];

// The newsletter "Ask Scoup" chat — opened from the floating button, contextual to the
// current sub-view (passed as ?view=).
export default function NewsletterChatScreen() {
  const { view } = useLocalSearchParams<{ view: string }>();
  const v = (VALID.includes(view as SagaView) ? view : 'feed') as SagaView;
  return <SagaChatView view={v} />;
}
