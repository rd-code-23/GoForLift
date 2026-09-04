/** Provides the TanStack Query source for exercises available to the user. */
import { queryOptions, useQuery } from '@tanstack/react-query';

import { fetchExercises } from './exercises.api';

export const exercisesQueryKey = ['exercises'] as const;
const EXERCISES_STALE_TIME_MS = 2 * 60 * 1000;

export const exercisesQueryOptions = queryOptions({
  queryKey: exercisesQueryKey,
  queryFn: ({ signal }) => fetchExercises(signal),
  retry: false,
  staleTime: EXERCISES_STALE_TIME_MS,
});

export function useExercises() {
  return useQuery(exercisesQueryOptions);
}
