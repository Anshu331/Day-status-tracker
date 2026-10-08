'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { authKeys } from '@/features/auth/hooks';
import { isApiError } from '@/lib/api-client';

const MAX_QUERY_RETRIES = 2;

function createQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !(isApiError(error) && error.status >= 400 && error.status < 500) &&
          failureCount < MAX_QUERY_RETRIES,
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        // session expired - treat the user as logged out
        if (isApiError(error, 401)) queryClient.setQueryData(authKeys.me, null);
      },
    }),
  });
  return queryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
