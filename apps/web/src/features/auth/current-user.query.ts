/** Exposes the authoritative TanStack Query source for browser authentication state. */
import { queryOptions, useQuery } from '@tanstack/react-query';

import { fetchCurrentUser } from './auth.api';

export const currentUserQueryKey = ['auth', 'current-user'] as const;

export const currentUserQueryOptions = queryOptions({
  queryKey: currentUserQueryKey,
  queryFn: fetchCurrentUser,
  retry: false,
});

export function useCurrentUser() {
  const query = useQuery(currentUserQueryOptions);

  if (query.isPending) {
    return {
      ...query,
      authenticationStatus: 'loading' as const,
      user: null,
    };
  }

  if (query.isError) {
    return {
      ...query,
      authenticationStatus: 'error' as const,
      user: null,
    };
  }

  if (!query.data.user) {
    return {
      ...query,
      authenticationStatus: 'anonymous' as const,
      user: null,
    };
  }

  return {
    ...query,
    authenticationStatus: 'authenticated' as const,
    user: query.data.user,
  };
}
