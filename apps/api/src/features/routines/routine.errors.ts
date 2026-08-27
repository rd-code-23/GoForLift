/** Defines expected business errors raised by routine operations. */
export class InvalidRoutineExerciseSelectionError extends Error {
  constructor() {
    super('One or more exercises are not available to this user.');
    this.name = 'InvalidRoutineExerciseSelectionError';
  }
}
