/** Fetches and validates exercises available to the authenticated user. */
import {
  createExerciseInputSchema,
  exerciseListResponseSchema,
  exerciseSummarySchema,
  type CreateExerciseInput,
  type ExerciseListResponse,
  type ExerciseSummary,
} from '@goforlift/contracts';

import { requestWithCsrf } from '@/features/auth/auth.api';

export class ExercisesApiError extends Error {
  constructor(public readonly status: number) {
    super(`Exercises API request failed with status ${status}`);
    this.name = 'ExercisesApiError';
  }
}

export async function fetchExercises(
  signal?: AbortSignal,
): Promise<ExerciseListResponse> {
  const response = await fetch('/api/exercises', {
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    throw new ExercisesApiError(response.status);
  }

  const data: unknown = await response.json();
  return exerciseListResponseSchema.parse(data);
}

export async function createExercise(
  input: CreateExerciseInput,
): Promise<ExerciseSummary> {
  const validatedInput = createExerciseInputSchema.parse(input);
  const response = await requestWithCsrf('/api/exercises', {
    body: JSON.stringify(validatedInput),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const data: unknown = await response.json();

  return exerciseSummarySchema.parse(data);
}
