// Maps the routines URL into the protected application layout.
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/routines')({
  component: RoutinesLanding,
});

function RoutinesLanding() {
  return (
    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
      Routines
    </h1>
  );
}
