// Maps the root route to the public welcome page.
import { createFileRoute } from '@tanstack/react-router';

import { clearGuestSession } from '../features/auth/guest-session';
import { WelcomePage } from '../features/auth/welcome-page';

export const Route = createFileRoute('/')({
  beforeLoad: clearGuestSession,
  component: WelcomePage,
});
