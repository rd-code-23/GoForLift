/** Provides one routine draft form across every route in the creation flow. */
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createRoutineScheduleInputSchema,
  routineNameSchema,
} from '@goforlift/contracts';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

const routineDraftFormSchema = z.object({
  name: routineNameSchema,
  schedules: z.array(createRoutineScheduleInputSchema),
});

export type RoutineDraftFormValues = z.infer<typeof routineDraftFormSchema>;

export function RoutineDraftFormProvider({
  children,
}: {
  children: ReactNode;
}) {
  const form = useForm<RoutineDraftFormValues>({
    defaultValues: { name: '', schedules: [] },
    mode: 'onChange', // when to run validation.
    resolver: zodResolver(routineDraftFormSchema),
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}
