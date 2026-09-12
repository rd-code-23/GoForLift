/** Fetches and validates browser-safe routine data from the backend API. */
import {
  createRoutineInputSchema,
  routineListResponseSchema,
  routineSummarySchema,
  type CreateRoutineInput,
  type RoutineListResponse,
  type RoutineSummary,
} from '@goforlift/contracts';

import { requestWithCsrf } from '@/features/auth/auth.api';

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

export async function createRoutine(
  input: CreateRoutineInput,
): Promise<RoutineSummary> {
  const validatedInput = createRoutineInputSchema.parse(input);
  const response = await requestWithCsrf('/api/routines', {
    body: JSON.stringify(validatedInput),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const data: unknown = await response.json();

  return routineSummarySchema.parse(data);
}
