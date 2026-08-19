import { healthResponseSchema } from '@goforlift/contracts';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Activity, Orbit } from 'lucide-react';

import { Button } from '../components/ui/button';

export const Route = createFileRoute('/')({ component: HomePage });

async function getHealth() {
  const response = await fetch('/health');
  const data: unknown = await response.json();
  return healthResponseSchema.parse(data);
}

function HomePage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    retry: false,
  });

  const isConnected = health.data?.database === 'connected';
  const systemStatus = getSystemStatus(health.isPending, isConnected);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10 lg:px-16">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl content-center gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
        <section>
          <div className="mb-8 flex items-center gap-3 text-sm font-semibold tracking-[0.22em] text-primary uppercase">
            <Orbit aria-hidden="true" className="size-5" />
            GoForLift
          </div>
          <p className="mb-3 text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Development foundation
          </p>
          <h1 className="max-w-3xl text-5xl leading-none font-bold tracking-tight sm:text-7xl">
            Ready for liftoff.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            The React application, typed routing, server-state client, Tailwind
            design system, and Express API foundation are configured.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => void health.refetch()}>
              Check API status
            </Button>
            <Button asChild variant="outline">
              <a
                href="https://tanstack.com/router"
                rel="noreferrer"
                target="_blank"
              >
                Router documentation
              </a>
            </Button>
          </div>
        </section>

        <aside className="rounded-xl border border-border bg-surface p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                System status
              </p>
              <h2 className="mt-2 text-xl font-semibold">Foundation check</h2>
            </div>
            <Activity aria-hidden="true" className="size-6 text-primary" />
          </div>
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
            <span
              aria-hidden="true"
              className={`size-2.5 rounded-full ${systemStatus.dotColor}`}
            />
            <p aria-live="polite" className="font-medium">
              {systemStatus.message}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function getSystemStatus(isPending: boolean, isConnected: boolean) {
  if (isPending) {
    return {
      dotColor: 'bg-muted-foreground',
      message: 'Contacting API…',
    };
  }

  if (isConnected) {
    return {
      dotColor: 'bg-primary',
      message: 'API and PostgreSQL connected',
    };
  }

  return {
    dotColor: 'bg-destructive',
    message: 'API or PostgreSQL unavailable',
  };
}
