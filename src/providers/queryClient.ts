import { QueryClient } from '@tanstack/react-query';

import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS } from '@/constants/limits';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      gcTime: QUERY_GC_TIME_MS,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
