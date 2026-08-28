/** Fetches and validates exercises available to the authenticated user. */
import {
  exerciseListResponseSchema,
  type ExerciseListResponse,
} from '@goforlift/contracts';

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
