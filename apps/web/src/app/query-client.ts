/** Creates the application query client and centralizes expired-session handling. */
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { currentUserQueryKey } from '@/features/auth/current-user.query';
import { isAuthenticationRequiredError } from '@/lib/api-error';

export function createApplicationQueryClient() {
  function handleRequestError(error: unknown) {
    if (isAuthenticationRequiredError(error)) {
      queryClient.setQueryData(currentUserQueryKey, { user: null });
    }
  }

  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError: handleRequestError }),
    queryCache: new QueryCache({ onError: handleRequestError }),
  });

  return queryClient;
}
