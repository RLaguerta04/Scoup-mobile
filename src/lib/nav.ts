import { router } from 'expo-router';

// Back that never throws "The action 'GO_BACK' was not handled by any navigator":
// pops when there's a screen to return to, otherwise falls back to the feed. An
// empty stack happens on a fresh load, a web refresh, or a deep link straight into
// a pushed screen (Story, More destinations) — where there's nothing to pop.
export const goBack = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/');
};
