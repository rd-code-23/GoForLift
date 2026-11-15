import { describe, expect, it } from 'vitest';

import { currentUserQueryKey } from '@/features/auth/current-user.query';
import { ApiError } from '@/lib/api-error';

import { createApplicationQueryClient } from './query-client';

describe('application query client', () => {
  it('changes authentication state to anonymous after a query receives 401', async () => {
    const queryClient = createApplicationQueryClient();
    queryClient.setQueryData(currentUserQueryKey, {
      user: { id: crypto.randomUUID(), name: 'Rishi' },
    });

    await expect(
      queryClient.fetchQuery({
        queryFn: () => Promise.reject(new ApiError(401)),
        queryKey: ['protected-query'],
        retry: false,
      }),
    ).rejects.toEqual(new ApiError(401));

    expect(queryClient.getQueryData(currentUserQueryKey)).toEqual({
      user: null,
    });
  });

  it('changes authentication state to anonymous after a mutation receives 401', async () => {
    const queryClient = createApplicationQueryClient();
    queryClient.setQueryData(currentUserQueryKey, {
      user: { id: crypto.randomUUID(), name: 'Rishi' },
    });
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: () => Promise.reject(new ApiError(401)),
    });

    await expect(mutation.execute(undefined)).rejects.toEqual(
      new ApiError(401),
    );
    expect(queryClient.getQueryData(currentUserQueryKey)).toEqual({
      user: null,
    });
  });
});
