// Presents the temporary shared landing state before the full dashboard is designed.
export function DashboardLanding() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Welcome to GoForLift</h1>
        <p className="mt-4 text-muted-foreground">
          Your session is ready. The full dashboard is the next step.
        </p>
      </section>
    </main>
  );
}
