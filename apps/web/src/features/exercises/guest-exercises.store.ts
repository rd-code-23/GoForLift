/** Persists the guest's custom exercise catalog in the browser. */
import {
  createExerciseInputSchema,
  exerciseSummarySchema,
  updateExerciseInputSchema,
  type CreateExerciseInput,
  type ExerciseSummary,
  type UpdateExerciseInput,
} from '@goforlift/contracts';
import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const storedExercisesSchema = z.object({
  exercises: z.array(
    exerciseSummarySchema.extend({ isCustom: z.literal(true) }),
  ),
});

type GuestExercisesState = {
  exercises: ExerciseSummary[];
  createExercise: (input: CreateExerciseInput) => ExerciseSummary;
  renameExercise: (id: string, input: UpdateExerciseInput) => ExerciseSummary;
  deleteExercise: (id: string) => void;
};

export const useGuestExercisesStore = create<GuestExercisesState>()(
  persist(
    (set, get) => ({
      exercises: [],
      createExercise: (input) => {
        const { name, description } = createExerciseInputSchema.parse(input);
        const exercise = {
          id: crypto.randomUUID(),
          name,
          description: description ?? null,
          isCustom: true,
        };
        set(({ exercises }) => ({ exercises: [...exercises, exercise] }));
        return exercise;
      },
      renameExercise: (id, input) => {
        const existing = get().exercises.find((exercise) => exercise.id === id);
        if (!existing) throw new Error('Guest exercise could not be found.');

        const { name } = updateExerciseInputSchema.parse(input);
        const updated = { ...existing, name };
        set(({ exercises }) => ({
          exercises: exercises.map((exercise) =>
            exercise.id === id ? updated : exercise,
          ),
        }));
        return updated;
      },
      deleteExercise: (id) => {
        set(({ exercises }) => ({
          exercises: exercises.filter((exercise) => exercise.id !== id),
        }));
      },
    }),
    {
      name: 'goforlift-guest-exercises',
      partialize: ({ exercises }) => ({ exercises }),
      merge: (persisted, current) => {
        const result = storedExercisesSchema.safeParse(persisted);
        return result.success ? { ...current, ...result.data } : current;
      },
    },
  ),
);
