// Maps the history destination into the shared responsive application shell.
import { createFileRoute } from '@tanstack/react-router';

import { SectionLanding } from '../features/dashboard/section-landing';

export const Route = createFileRoute('/history')({
  component: () => <SectionLanding title="History" />,
});
