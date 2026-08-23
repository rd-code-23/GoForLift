// Maps the settings URL into the protected application layout.
import { createFileRoute } from '@tanstack/react-router';

import { SectionLanding } from '../features/dashboard/section-landing';

export const Route = createFileRoute('/_app/settings')({
  component: () => <SectionLanding title="Settings" />,
});
