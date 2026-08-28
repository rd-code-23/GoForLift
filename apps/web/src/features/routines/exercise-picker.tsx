/** Lets a routine author search the exercises available to add to a routine. */
import type { ExerciseSummary } from '@goforlift/contracts';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Dumbbell, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';

import { AddActionButton } from '../../components/ui/add-action-button';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { LoadingState } from '../../components/ui/loading-state';
import { PageTitle } from '../../components/ui/page-title';
import { useExercises } from '../exercises/exercises.query';

export function ExercisePicker() {
  const [searchTerm, setSearchTerm] = useState('');
  const exercisesQuery = useExercises();

  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
  const exercises = exercisesQuery.data?.exercises ?? [];
  const visibleExercises = exercises.filter((exercise) =>
    exercise.name.toLocaleLowerCase().includes(normalizedSearchTerm),
  );

  let content = <ExerciseList exercises={visibleExercises} />;

  if (exercisesQuery.isPending) {
    content = <LoadingState />;
  } else if (exercisesQuery.isError) {
    content = (
      <p className="text-sm text-destructive">Exercises could not be loaded.</p>
    );
  } else if (visibleExercises.length === 0) {
    content = (
      <p className="text-sm text-muted-foreground">No exercises found.</p>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl lg:max-w-3xl">
      <header className="mb-5 flex items-center gap-3 lg:mb-7 lg:gap-4">
        <Button
          aria-label="Close exercise picker"
          asChild
          className="lg:size-10"
          size="icon"
          variant="ghost"
        >
          <Link to="/routines/new">
            <X aria-hidden="true" />
          </Link>
        </Button>
        <PageTitle className="flex-1 text-center">Add Exercise</PageTitle>
        <div aria-hidden="true" className="size-9" />
      </header>

      <div className="relative">
        <Input
          aria-label="Search exercises"
          className="h-12 rounded-lg bg-surface-elevated pr-11 pl-4 lg:h-14 lg:text-base"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search exercises…"
          type="search"
          value={searchTerm}
        />
        <Search
          aria-hidden="true"
          className="absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground lg:size-6"
        />
      </div>

      <div className="mt-4">{content}</div>

      <div className="mt-7">
        <AddActionButton
          className="border border-dashed border-input lg:h-16 lg:text-base"
          disabled
        >
          <Plus aria-hidden="true" />
          Create Custom Exercise
        </AddActionButton>
      </div>
    </section>
  );
}

function ExerciseList({ exercises }: { exercises: ExerciseSummary[] }) {
  return (
    <ul>
      {exercises.map((exercise) => (
        <li
          className="relative flex min-h-12 items-center gap-3 rounded-md px-2 py-1.5 transition-colors after:absolute after:bottom-0 after:left-[12.5%] after:h-0.5 after:w-3/4 after:bg-border/20 after:content-[''] last:after:hidden hover:bg-accent/50 lg:min-h-14 lg:gap-4 lg:px-3 lg:py-2"
          key={exercise.id}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-elevated text-primary lg:size-10">
            <Dumbbell aria-hidden="true" className="size-5 lg:size-6" />
          </div>
          <p className="min-w-0 flex-1 truncate text-[15px] font-normal text-muted-foreground lg:text-base">
            {exercise.name}
          </p>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground lg:size-5"
          />
        </li>
      ))}
    </ul>
  );
}
