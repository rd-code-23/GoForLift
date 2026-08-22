// Maps the routines destination into the shared responsive application shell.
import { createFileRoute } from '@tanstack/react-router';

import { SectionLanding } from '../features/dashboard/section-landing';

export const Route = createFileRoute('/routines')({
  component: () => <SectionLanding title="Routines" />,
});
