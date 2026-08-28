/** Provides the TanStack Query source for exercises available to the user. */
import { queryOptions, useQuery } from '@tanstack/react-query';

import { fetchExercises } from './exercises.api';

export const exercisesQueryKey = ['exercises'] as const;

export const exercisesQueryOptions = queryOptions({
  queryKey: exercisesQueryKey,
  queryFn: ({ signal }) => fetchExercises(signal),
  retry: false,
});

export function useExercises() {
  return useQuery(exercisesQueryOptions);
}
