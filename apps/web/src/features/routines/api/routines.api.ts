/** Fetches and validates browser-safe routine data from the backend API. */
import {
  createRoutineInputSchema,
  routineListResponseSchema,
  routineDetailSchema,
  routineSummarySchema,
  type CreateRoutineInput,
  type RoutineListResponse,
  type RoutineDetail,
  type RoutineSummary,
} from '@goforlift/contracts';

import { requestWithCsrf } from '@/features/auth/auth.api';
import { parseApiJsonResponse } from '@/lib/api-error';

export async function fetchRoutines(
  signal?: AbortSignal,
): Promise<RoutineListResponse> {
  const response = await fetch('/api/routines', {
    credentials: 'include',
    signal,
  });

  return parseApiJsonResponse(response, routineListResponseSchema);
}

export async function fetchRoutine(
  routineId: string,
  signal?: AbortSignal,
): Promise<RoutineDetail> {
  const response = await fetch(`/api/routines/${routineId}`, {
    credentials: 'include',
    signal,
  });

  return parseApiJsonResponse(response, routineDetailSchema);
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

export async function deleteRoutine(routineId: string): Promise<void> {
  await requestWithCsrf(`/api/routines/${routineId}`, {
    method: 'DELETE',
  });
}
