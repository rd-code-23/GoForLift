/** Ends the browser session and synchronizes the authoritative current-user cache. */
import type { CurrentUserResponse } from '@goforlift/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isAuthenticationRequiredError, logout } from './auth.api';
import { currentUserQueryKey } from './current-user.query';

const anonymousCurrentUser: CurrentUserResponse = { user: null };

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(currentUserQueryKey, anonymousCurrentUser);
    },
    onError: (error) => {
      if (isAuthenticationRequiredError(error)) {
        queryClient.setQueryData(currentUserQueryKey, anonymousCurrentUser);
      }
    },
  });
}
