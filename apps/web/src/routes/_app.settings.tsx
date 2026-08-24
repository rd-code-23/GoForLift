// Maps the settings URL into the protected application layout.
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings')({
  component: SettingsLanding,
});

function SettingsLanding() {
  return (
    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
      Settings
    </h1>
  );
}
