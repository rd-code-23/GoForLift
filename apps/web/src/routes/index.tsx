// Maps the root route to the public welcome page.
import { createFileRoute } from '@tanstack/react-router';

import { WelcomePage } from '../features/auth/welcome-page';

export const Route = createFileRoute('/')({ component: WelcomePage });
