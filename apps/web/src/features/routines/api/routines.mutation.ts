/** Mutates routines and keeps their TanStack Query cache entries synchronized. */
import type { RoutineListResponse } from '@goforlift/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createRoutine, deleteRoutine } from './routines.api';
import { routineQueryKey, routinesQueryKey } from './routines.query';

export function useCreateRoutineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoutine,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: routinesQueryKey }),
  });
}

export function useDeleteRoutineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoutine,
    onSuccess: (_, deletedRoutineId) => {
      queryClient.setQueryData<RoutineListResponse>(
        routinesQueryKey,
        (currentData) =>
          currentData && {
            routines: currentData.routines.filter(
              (routine) => routine.id !== deletedRoutineId,
            ),
          },
      );
      queryClient.removeQueries({
        queryKey: routineQueryKey(deletedRoutineId),
        exact: true,
      });
    },
  });
}
