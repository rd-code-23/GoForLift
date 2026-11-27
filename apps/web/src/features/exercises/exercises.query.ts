/** Provides the TanStack Query source for exercises available to the user. */
import { useQuery } from '@tanstack/react-query';

import { fetchExercises } from './exercises.api';
import { useGuestExercisesStore } from './guest-exercises.store';

export const exercisesQueryKey = ['exercises'] as const;
const EXERCISES_STALE_TIME_MS = 2 * 60 * 1000;

export function useExercises(enabled = true, isGuest = false) {
  const guestExercises = useGuestExercisesStore((state) => state.exercises);
  const query = useQuery({
    retry: false,
    staleTime: EXERCISES_STALE_TIME_MS,
    queryKey: isGuest ? (['guest-exercises'] as const) : exercisesQueryKey,
    queryFn: async ({ signal }) => {
      const data = await fetchExercises(signal, isGuest ? 'omit' : 'include');
      return isGuest
        ? { exercises: data.exercises.filter((exercise) => !exercise.isCustom) }
        : data;
    },
    enabled,
  });

  const data =
    isGuest && query.data
      ? { exercises: [...query.data.exercises, ...guestExercises] }
      : query.data;

  return { ...query, data };
}
