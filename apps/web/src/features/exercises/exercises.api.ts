/** Fetches and validates exercises available to the authenticated user. */
import {
  createExerciseInputSchema,
  exerciseListResponseSchema,
  exerciseSummarySchema,
  updateExerciseInputSchema,
  type CreateExerciseInput,
  type ExerciseListResponse,
  type ExerciseSummary,
  type UpdateExerciseInput,
} from '@goforlift/contracts';

import { requestWithCsrf } from '@/features/auth/auth.api';
import { parseApiJsonResponse } from '@/lib/api-error';

export async function fetchExercises(
  signal?: AbortSignal,
): Promise<ExerciseListResponse> {
  const response = await fetch('/api/exercises', {
    credentials: 'include',
    signal,
  });

  return parseApiJsonResponse(response, exerciseListResponseSchema);
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

export async function updateExerciseName({
  exerciseId,
  input,
}: {
  exerciseId: string;
  input: UpdateExerciseInput;
}): Promise<ExerciseSummary> {
  const validatedInput = updateExerciseInputSchema.parse(input);
  const response = await requestWithCsrf(`/api/exercises/${exerciseId}`, {
    body: JSON.stringify(validatedInput),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  });
  const data: unknown = await response.json();

  return exerciseSummarySchema.parse(data);
}
