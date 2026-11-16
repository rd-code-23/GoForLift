/** Converts application API failures into safe, actionable user-facing messages. */
import { ApiError } from './api-error';

const SHARED_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  authentication_required: 'Your session has expired. Sign in and try again.',
  forbidden: "You don't have permission to do that.",
  invalid_csrf_token:
    'Your session could not be verified. Refresh the page and try again.',
  request_too_large:
    'The submitted information is too large. Reduce it and try again.',
};

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  codeMessages: Readonly<Record<string, string>> = {},
) {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  if (error.code) {
    const codeMessage =
      codeMessages[error.code] ?? SHARED_ERROR_MESSAGES[error.code];

    if (codeMessage) {
      return codeMessage;
    }
  }

  if (error.status === 429) {
    return 'Too many requests. Wait a moment and try again.';
  }

  return fallback;
}
