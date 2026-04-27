import { QueryClient } from '@tanstack/react-query';

// Browser-side singleton
let browserQueryClient: QueryClient | undefined;

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't immediately refetch on window focus — reduces noise during demos
        refetchOnWindowFocus: false,
        // Data considered fresh for 60 seconds
        staleTime: 60_000,
      },
    },
  });
}

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always make a new client (no caching between requests)
    return makeQueryClient();
  }
  // Browser: create once, reuse
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
