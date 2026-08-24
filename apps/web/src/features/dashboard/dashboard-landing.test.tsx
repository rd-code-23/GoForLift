// Verifies the dashboard introduction uses wording appropriate to the current identity.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApplicationIdentityContext } from '../../app/application-identity';
import { createPublicUser } from '../../test/fixtures/public-user.fixture';
import { DashboardLanding } from './dashboard-landing';

describe('dashboard landing', () => {
  it('welcomes a guest without implying saved account data', () => {
    render(
      <ApplicationIdentityContext.Provider value={{ kind: 'guest' }}>
        <DashboardLanding />
      </ApplicationIdentityContext.Provider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Welcome, Guest' }),
    ).toBeVisible();
    expect(screen.getByText("Let's get stronger today.")).toBeVisible();
  });

  it('welcomes a registered user by display name', () => {
    const user = createPublicUser({ displayName: 'Alex Rivera' });

    render(
      <ApplicationIdentityContext.Provider value={{ kind: 'user', user }}>
        <DashboardLanding />
      </ApplicationIdentityContext.Provider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Welcome, Alex Rivera' }),
    ).toBeVisible();
  });
});
