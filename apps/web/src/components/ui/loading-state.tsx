// Displays a consistent centered spinner while page content is loading.
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils';

type LoadingStateProps = ComponentProps<'div'> & {
  label?: string;
};

export function LoadingState({
  className,
  label = 'Loading…',
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[50vh] flex-col items-center justify-center gap-3',
        'text-sm text-muted-foreground',
        className,
      )}
      role="status"
      {...props}
    >
      <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
