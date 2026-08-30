/** Fetches and validates browser-safe routine data from the backend API. */
import {
  routineListResponseSchema,
  type RoutineListResponse,
} from '@goforlift/contracts';

export class RoutinesApiError extends Error {
  constructor(public readonly status: number) {
    super(`Routines API request failed with status ${status}`);
    this.name = 'RoutinesApiError';
  }
}

export async function fetchRoutines(
  signal?: AbortSignal,
): Promise<RoutineListResponse> {
  const response = await fetch('/api/routines', {
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    throw new RoutinesApiError(response.status);
  }

  const data: unknown = await response.json();
  return routineListResponseSchema.parse(data);
}
