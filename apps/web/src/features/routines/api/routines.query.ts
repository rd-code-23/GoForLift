/** Provides the TanStack Query source for the authenticated user's routines. */
import { queryOptions, useQuery } from '@tanstack/react-query';

import { fetchRoutines } from './routines.api';

export const routinesQueryKey = ['routines'] as const;

export const routinesQueryOptions = queryOptions({
  queryKey: routinesQueryKey,
  queryFn: ({ signal }) => fetchRoutines(signal),
  retry: false,
});

export function useRoutines(enabled = true) {
  return useQuery({ ...routinesQueryOptions, enabled });
}
