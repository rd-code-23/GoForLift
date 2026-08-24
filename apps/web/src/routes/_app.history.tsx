// Maps the history URL into the protected application layout.
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/history')({
  component: HistoryLanding,
});

function HistoryLanding() {
  return (
    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
      History
    </h1>
  );
}
