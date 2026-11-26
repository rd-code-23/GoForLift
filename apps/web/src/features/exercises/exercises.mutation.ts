/** Saves custom exercises locally for guests and through the API for signed-in users. */
import type { ExerciseListResponse } from '@goforlift/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';

import { ApplicationIdentityContext } from '@/app/application-identity';
import {
  createExercise,
  deleteExercise,
  updateExerciseName,
} from './exercises.api';
import { exercisesQueryKey } from './exercises.query';
import { useGuestExercisesStore } from './guest-exercises.store';

export function useCreateExerciseMutation() {
  const queryClient = useQueryClient();
  const isGuest = useContext(ApplicationIdentityContext)?.kind === 'guest';

  return useMutation({
    networkMode: isGuest ? 'always' : undefined,
    mutationFn: (input: Parameters<typeof createExercise>[0]) =>
      isGuest
        ? Promise.resolve(
            useGuestExercisesStore.getState().createExercise(input),
          )
        : createExercise(input),
    onSuccess: (createdExercise) => {
      if (isGuest) return;
      queryClient.setQueryData<ExerciseListResponse>(
        exercisesQueryKey,
        (currentData) => ({
          exercises: currentData
            ? [...currentData.exercises, createdExercise]
            : [createdExercise],
        }),
      );
    },
  });
}

export function useUpdateExerciseNameMutation() {
  const queryClient = useQueryClient();
  const isGuest = useContext(ApplicationIdentityContext)?.kind === 'guest';

  return useMutation({
    networkMode: isGuest ? 'always' : undefined,
    mutationFn: (request: Parameters<typeof updateExerciseName>[0]) =>
      isGuest
        ? Promise.resolve(
            useGuestExercisesStore
              .getState()
              .renameExercise(request.exerciseId, request.input),
          )
        : updateExerciseName(request),
    onSuccess: (updatedExercise) => {
      if (isGuest) return;
      queryClient.setQueryData<ExerciseListResponse>(
        exercisesQueryKey,
        (currentData) =>
          currentData && {
            exercises: currentData.exercises.map((exercise) =>
              exercise.id === updatedExercise.id ? updatedExercise : exercise,
            ),
          },
      );
    },
  });
}

export function useDeleteExerciseMutation() {
  const queryClient = useQueryClient();
  const isGuest = useContext(ApplicationIdentityContext)?.kind === 'guest';

  return useMutation({
    networkMode: isGuest ? 'always' : undefined,
    mutationFn: (exerciseId: string) =>
      isGuest
        ? Promise.resolve(
            useGuestExercisesStore.getState().deleteExercise(exerciseId),
          )
        : deleteExercise(exerciseId),
    onSuccess: (_, deletedExerciseId) => {
      if (isGuest) return;
      queryClient.setQueryData<ExerciseListResponse>(
        exercisesQueryKey,
        (currentData) =>
          currentData && {
            exercises: currentData.exercises.filter(
              (exercise) => exercise.id !== deletedExerciseId,
            ),
          },
      );
    },
  });
}
