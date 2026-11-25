import { QueryClient } from '@tanstack/react-query';

// Matches the web app's defaults.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});
