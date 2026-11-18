/** Fetches and validates browser-safe routine data from the backend API. */
import {
  createRoutineInputSchema,
  routineListResponseSchema,
  routineDetailSchema,
  routineSummarySchema,
  updateRoutineInputSchema,
  type CreateRoutineInput,
  type RoutineListResponse,
  type RoutineDetail,
  type RoutineSummary,
  type UpdateRoutineInput,
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

export async function updateRoutine({
  input,
  routineId,
}: {
  input: UpdateRoutineInput;
  routineId: string;
}): Promise<RoutineSummary> {
  const validatedInput = updateRoutineInputSchema.parse(input);
  const response = await requestWithCsrf(`/api/routines/${routineId}`, {
    body: JSON.stringify(validatedInput),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  });

  return parseApiJsonResponse(response, routineSummarySchema);
}
