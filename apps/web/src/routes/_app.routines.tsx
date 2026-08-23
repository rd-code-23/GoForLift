// Maps the routines URL into the protected application layout.
import { createFileRoute } from '@tanstack/react-router';

import { SectionLanding } from '../features/dashboard/section-landing';

export const Route = createFileRoute('/_app/routines')({
  component: () => <SectionLanding title="Routines" />,
});
