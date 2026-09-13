/** Normalizes unsuccessful HTTP responses into one application-wide error type. */
import type { ZodType } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(
      code
        ? `API request failed with status ${status}: ${code}`
        : `API request failed with status ${status}`,
    );
    this.name = 'ApiError';
  }
}

export function isAuthenticationRequiredError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export async function ensureSuccessfulResponse(response: Response) {
  if (!response.ok) {
    throw await createApiError(response);
  }

  return response;
}

export async function parseApiJsonResponse<T>(
  response: Response,
  schema: ZodType<T>,
): Promise<T> {
  await ensureSuccessfulResponse(response);
  const data: unknown = await response.json();

  return schema.parse(data);
}

async function createApiError(response: Response) {
  let code: string | undefined;

  try {
    const body: unknown = await response.json();

    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
    ) {
      code = body.error;
    }
  } catch {
    // Error responses are not required to contain JSON.
  }

  return new ApiError(response.status, code);
}
