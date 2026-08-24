// Introduces new dashboard visitors with identity-aware onboarding copy.
import { useApplicationIdentity } from './application-identity';

export function DashboardLanding() {
  const identity = useApplicationIdentity();

  const identityLabel =
    identity.kind === 'guest'
      ? 'Guest'
      : (identity.user.displayName ?? identity.user.email);

  return (
    <header>
      <p className="text-sm font-medium text-primary">Dashboard</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Welcome, {identityLabel}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Let&apos;s get stronger today.
      </p>
    </header>
  );
}
