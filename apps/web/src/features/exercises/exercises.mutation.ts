/** Creates custom exercises and synchronizes the exercise-list cache. */
import type { ExerciseListResponse } from '@goforlift/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createExercise, updateExerciseName } from './exercises.api';
import { exercisesQueryKey } from './exercises.query';

export function useCreateExerciseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExercise,
    onSuccess: (createdExercise) => {
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

  return useMutation({
    mutationFn: updateExerciseName,
    onSuccess: (updatedExercise) => {
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
