// Presents a minimal heading within the parent application route layout.

type SectionLandingProps = {
  title: string;
};

export function SectionLanding({ title }: SectionLandingProps) {
  return (
    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
      {title}
    </h1>
  );
}
