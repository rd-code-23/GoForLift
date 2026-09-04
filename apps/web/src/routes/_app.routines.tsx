// Maps the routines URL into the protected application layout.
import { createFileRoute } from '@tanstack/react-router';

import { RoutinesLanding } from '../features/routines/landing/routines-landing';

export const Route = createFileRoute('/_app/routines')({
  component: RoutinesLanding,
});
