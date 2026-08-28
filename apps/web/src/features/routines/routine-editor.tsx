/** Presents the responsive visual shell for creating a registered-user routine. */
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Plus } from 'lucide-react';

import { AddActionButton } from '../../components/ui/add-action-button';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageTitle } from '../../components/ui/page-title';
import { RoutineScheduleField } from './routine-schedule-field';

export function RoutineEditor() {
  return (
    <section className="mx-auto w-full max-w-5xl">
      <EditorHeader />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <RoutineDetails />
          <ExerciseSection />
        </div>

        <RoutineScheduleField />
      </div>
    </section>
  );
}

function EditorHeader() {
  return (
    <header className="mb-7 flex items-center gap-3 border-b pb-5">
      <Button aria-label="Back to routines" asChild size="icon" variant="ghost">
        <Link to="/routines">
          <ArrowLeft aria-hidden="true" />
        </Link>
      </Button>
      <PageTitle>Create Routine</PageTitle>
      <div className="ml-auto flex gap-2">
        <Button className="hidden sm:inline-flex" disabled variant="outline">
          Preview
        </Button>
        <Button disabled>Save</Button>
      </div>
    </header>
  );
}

function RoutineDetails() {
  return (
    <div>
      <Label htmlFor="routine-name">Routine Name</Label>
      <Input
        className="mt-2"
        id="routine-name"
        maxLength={100}
        placeholder="e.g., Upper Body"
      />
    </div>
  );
}

function ExerciseSection() {
  return (
    <div>
      <Label asChild>
        <h2>Exercises (0)</h2>
      </Label>
      <div className="mt-3">
        <AddActionButton asChild>
          <Link to="/routines/new/exercises">
            <Plus aria-hidden="true" />
            Add Exercise
          </Link>
        </AddActionButton>
      </div>
    </div>
  );
}
