// Presents a minimal content heading inside the shared application shell.
import { ApplicationShell } from './application-shell';

type SectionLandingProps = {
  title: string;
};

export function SectionLanding({ title }: SectionLandingProps) {
  return (
    <ApplicationShell>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
    </ApplicationShell>
  );
}
