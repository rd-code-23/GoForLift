/** Provides one routine draft form across every route in the creation flow. */
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createRoutineExerciseInputSchema,
  createRoutineScheduleInputSchema,
  exerciseSummarySchema,
  routineNameSchema,
} from '@goforlift/contracts';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

// The form draft keeps the exercise name so the editor can display it without
// reading the exercise catalog again. The create-routine API accepts only the
// exercise ID and configuration, so the transform removes this UI-only name
// from the validated output before that data is submitted.
// When the complete form is successfully parsed by the Zod resolver, .transform() removes name.
const routineDraftExerciseSchema = createRoutineExerciseInputSchema
  .extend({ name: exerciseSummarySchema.shape.name })
  .transform(({ name, ...exercise }) => {
    void name;
    return exercise;
  });

const routineDraftFormSchema = z.object({
  name: routineNameSchema,
  exercises: z.array(routineDraftExerciseSchema),
  schedules: z.array(createRoutineScheduleInputSchema),
});
// Exercise defaults live in the shared Zod contract so every consumer uses the
// same values. Adding .default() lets those fields be omitted or undefined in
// Zod's input, while Zod guarantees their values in its parsed output. RHF must
// therefore use separate input and output types; z.infer describes only the
// output and causes a resolver type mismatch when it is also used as the input.
export type RoutineDraftFormValues = z.input<typeof routineDraftFormSchema>;
export type RoutineDraftExerciseFormValues = z.input<
  typeof routineDraftExerciseSchema
>;
type ParsedRoutineDraftFormValues = z.output<typeof routineDraftFormSchema>;

export function RoutineDraftFormProvider({
  children,
}: {
  children: ReactNode;
}) {
  const form = useForm<
    RoutineDraftFormValues,
    unknown,
    ParsedRoutineDraftFormValues
  >({
    defaultValues: { exercises: [], name: '', schedules: [] },
    mode: 'onChange', // when to run validation.
    resolver: zodResolver(routineDraftFormSchema),
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}
