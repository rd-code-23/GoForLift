/** Provides one routine draft form across every route in the creation flow. */
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createRoutineInputSchema,
  createRoutineExerciseInputSchema,
  createRoutineScheduleInputSchema,
  exerciseSummarySchema,
  routineNameSchema,
} from '@goforlift/contracts';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

// The form draft keeps UI-only fields that the create API does not need. The
// name displays the exercise. exerciseId identifies the exercise type, but the
// same exercise may be added more than once, so draftExerciseId uniquely tracks
// each configured row while its position changes during reordering. The save
// mapper removes both UI-only fields before sending the request.
const routineDraftExerciseSchema = createRoutineExerciseInputSchema.extend({
  draftExerciseId: z.uuid(),
  name: exerciseSummarySchema.shape.name,
});

const routineDraftExercisesSchema = z
  .array(routineDraftExerciseSchema)
  .superRefine((exercises, context) => {
    const result =
      createRoutineInputSchema.shape.exercises.safeParse(exercises);

    if (!result.success) {
      for (const issue of result.error.issues) {
        // Exercise fields are already validated by routineDraftExerciseSchema.
        // Reuse only collection rules, such as the shared minimum of one exercise.
        if (issue.path.length === 0) {
          context.addIssue({ ...issue });
        }
      }
    }
  });

const routineDraftFormSchema = z.object({
  name: routineNameSchema,
  exercises: routineDraftExercisesSchema,
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
export type ParsedRoutineDraftFormValues = z.output<
  typeof routineDraftFormSchema
>;

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
