/** Creates routines and marks the authenticated routine collection as stale. */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createRoutine } from './routines.api';
import { routinesQueryKey } from './routines.query';

export function useCreateRoutineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoutine,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: routinesQueryKey }),
  });
}
