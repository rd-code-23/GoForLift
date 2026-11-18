/** Mutates routines and keeps their TanStack Query cache entries synchronized. */
import type { RoutineListResponse } from '@goforlift/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createRoutine, deleteRoutine, updateRoutine } from './routines.api';
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

export function useUpdateRoutineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRoutine,
    onSuccess: (_, { routineId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: routinesQueryKey }),
        // The detail query is still active behind the editor. Mark it stale
        // without fetching there; the destination details page refetches it.
        queryClient.invalidateQueries({
          queryKey: routineQueryKey(routineId),
          refetchType: 'none',
        }),
      ]),
  });
}
