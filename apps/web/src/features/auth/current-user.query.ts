/** Exposes the authoritative TanStack Query source for browser authentication state. */
import { queryOptions, useQuery } from '@tanstack/react-query';

import { fetchCurrentUser } from './auth.api';

export const currentUserQueryKey = ['auth', 'current-user'] as const;

export const currentUserQueryOptions = queryOptions({
  queryKey: currentUserQueryKey,
  queryFn: fetchCurrentUser,
  retry: false,
});

export type AuthenticationStatus =
  'loading' | 'anonymous' | 'authenticated' | 'error';

export function useCurrentUser() {
  const query = useQuery(currentUserQueryOptions);
  let authenticationStatus: AuthenticationStatus = 'anonymous';

  if (query.isPending) {
    authenticationStatus = 'loading';
  } else if (query.isError) {
    authenticationStatus = 'error';
  } else if (query.data.user) {
    authenticationStatus = 'authenticated';
  }

  return {
    ...query,
    authenticationStatus,
    user: query.data?.user ?? null,
  };
}
