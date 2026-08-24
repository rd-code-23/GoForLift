// Defines and exposes the application identity shared by protected pages.
import type { PublicUser } from '@goforlift/contracts';
import { createContext, useContext } from 'react';

export type ApplicationIdentity =
  { kind: 'guest' } | { kind: 'user'; user: PublicUser };

export const ApplicationIdentityContext =
  createContext<ApplicationIdentity | null>(null);

export function useApplicationIdentity() {
  const identity = useContext(ApplicationIdentityContext);

  if (!identity) {
    throw new Error(
      'useApplicationIdentity must be used within ApplicationIdentityContext',
    );
  }

  return identity;
}
