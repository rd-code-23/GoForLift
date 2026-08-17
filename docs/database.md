# GoForLift — Database Design

## 1. Purpose

This document defines the initial persistent data model for GoForLift.

The database is:

    PostgreSQL

Database access uses:

    Drizzle ORM

Schema migrations use:

    Drizzle Kit

This document describes the logical model. Exact PostgreSQL/Drizzle
implementation details may be refined during implementation as long as the
documented behavior is preserved.


# 2. Database Principles

The data model should:

- support the MVP requirements
- preserve accurate workout history
- support editing workout history
- enforce ownership and relationships
- avoid unnecessary complexity
- remain reasonably extensible
- use database constraints where appropriate

Do not design tables for future features unless the current model would
otherwise make those features unnecessarily difficult.


# 3. Core Relationships

At a high level:

    User
      |
      +---- Routines
      |
      +---- Custom Exercises
      |
      +---- Workout Sessions
      |
      +---- Settings


    Routine
      |
      +---- Routine Exercises
                |
                +---- Exercise


    Workout Session
      |
      +---- Workout Sets

A routine describes what the user plans to do.

A workout session describes an actual workout that occurred.

Workout sets describe what the user actually completed.


# 4. Users

## Purpose

Stores registered GoForLift users.

Guest users are not required to have persistent database records.

## Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Primary identifier for the user. |
| `email` | VARCHAR/TEXT | User's email address and identity-related contact information. |
| `display_name` | VARCHAR/TEXT, nullable | Name displayed in the application when available. |
| `avatar_url` | TEXT, nullable | Optional profile image supplied by the authentication provider. |
| `auth_provider` | VARCHAR/TEXT | Identifies the authentication provider, initially Google. |
| `auth_provider_subject` | VARCHAR/TEXT | Stable provider-specific user identifier used to associate the external identity with the GoForLift user. |
| `created_at` | TIMESTAMPTZ | When the user record was created. |
| `updated_at` | TIMESTAMPTZ | When the user record was last updated. |

## Constraints

- `id` is the primary key.
- (`auth_provider`, `auth_provider_subject`) should be unique.
- Email uniqueness should be finalized alongside the authentication design rather
  than assuming email is always the canonical external identity.


# 5. Exercises

## Purpose

Stores exercises available when creating routines.

An exercise can either be:

- a built-in GoForLift exercise
- a custom exercise belonging to a user

Examples:

    Bicep Curl
    Hammer Curl
    Tricep Extension
    Overhead Press
    Lateral Raise

## Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Primary identifier for the exercise. |
| `owner_user_id` | UUID, nullable, FK → `users.id` | Identifies the user who owns a custom exercise. NULL means the exercise is globally available/built-in. |
| `name` | VARCHAR/TEXT | Display name of the exercise. |
| `description` | TEXT, nullable | Optional description or instructions for the exercise. |
| `created_at` | TIMESTAMPTZ | When the exercise was created. |
| `updated_at` | TIMESTAMPTZ | When the exercise was last updated. |

## Ownership Rule

    owner_user_id = NULL
        → built-in exercise

    owner_user_id = user ID
        → custom exercise belonging to that user

Users must not be able to modify another user's custom exercises.

Built-in exercises should not be editable through normal user APIs.


# 6. Routines

## Purpose

Represents a reusable workout routine created by a user.

Example:

    Upper Body

    Bicep Curl
    Tricep Extension
    Overhead Press

The routine itself stores high-level information.

Exercise-specific configuration lives in `routine_exercises`.

## Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Primary identifier for the routine. |
| `user_id` | UUID, FK → `users.id` | Identifies the user who owns the routine. |
| `name` | VARCHAR/TEXT | User-visible routine name. |
| `description` | TEXT, nullable | Optional description or notes about the routine. |
| `created_at` | TIMESTAMPTZ | When the routine was created. |
| `updated_at` | TIMESTAMPTZ | When the routine was last modified. |

## Authorization

All routine operations must verify:

    routine.user_id == authenticated user ID

Client-provided ownership information must never be trusted by itself.


# 7. Routine Exercises

## Purpose

Joins exercises to routines and stores how each exercise should be performed
within that specific routine.

This table is necessary because:

- one routine contains many exercises
- one exercise may appear in many routines
- configuration such as reps/weight/rest belongs to the exercise within the
  routine, not to the global exercise definition

## Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Primary identifier for this routine-exercise configuration. |
| `routine_id` | UUID, FK → `routines.id` | Identifies the routine containing the exercise. |
| `exercise_id` | UUID, FK → `exercises.id` | Identifies the selected exercise. |
| `position` | INTEGER | Determines the order of the exercise within the routine. |
| `sets` | INTEGER | Number of planned sets. |
| `target_reps` | INTEGER | Number of planned reps per set for the MVP. |
| `weight` | NUMERIC | Planned weight used for the exercise's sets. |
| `weight_unit` | VARCHAR/TEXT | Unit for the weight, initially expected to support values such as `lb` or `kg`. |
| `rest_between_sets_seconds` | INTEGER | Rest duration after completing a set before continuing. |
| `rest_after_exercise_seconds` | INTEGER | Optional/additional rest duration after completing the exercise before beginning the next exercise. |
| `notes` | TEXT, nullable | Optional notes specific to this exercise in this routine. |
| `created_at` | TIMESTAMPTZ | When this configuration was created. |
| `updated_at` | TIMESTAMPTZ | When this configuration was last modified. |

## MVP Simplification

The MVP uses:

    one target rep count per exercise
    one planned weight per exercise

For example:

    Bicep Curl
    Sets: 3
    Reps: 10
    Weight: 15 lb

Future versions may support different planned reps or weights for each set.

Do not introduce per-set routine configuration during the MVP unless the
requirements change.


# 8. Routine Schedules

## Purpose

Stores when a user plans to perform a routine.

Scheduling is separate from the routine itself because a routine may eventually
have more than one planned occurrence.

Example:

    Upper Body
    Monday 6:00 PM
    Thursday 6:00 PM

## Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Primary identifier for the scheduled occurrence. |
| `routine_id` | UUID, FK → `routines.id` | Identifies the routine being scheduled. |
| `day_of_week` | SMALLINT | Day on which the routine is planned. Use a clearly documented convention such as 0–6. |
| `local_time` | TIME | User-local planned workout time. |
| `created_at` | TIMESTAMPTZ | When the schedule was created. |
| `updated_at` | TIMESTAMPTZ | When the schedule was last modified. |

## Time Zone

The schedule represents a user's local intended workout time.

If scheduling later requires notifications across time zones, user time-zone
information may need to be added.

Do not build notification scheduling infrastructure during the MVP.


# 9. Workout Sessions

## Purpose

Represents one persisted workout performed by a user.

Example:

    User performs "Upper Body"
    August 16, 2026
    42 minutes

That workout becomes one `workout_sessions` record.

## Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Primary identifier for the workout session. |
| `user_id` | UUID, FK → `users.id` | Identifies the user who performed the workout. |
| `routine_id` | UUID, nullable, FK → `routines.id` | References the routine that started the workout when that routine still exists. Nullable so historical workouts do not depend on the routine continuing to exist. |
| `routine_name` | VARCHAR/TEXT | Snapshot of the routine name at workout time so history remains meaningful after routine changes/deletion. |
| `started_at` | TIMESTAMPTZ | When the workout began. |
| `completed_at` | TIMESTAMPTZ | When the persisted workout finished. |
| `created_at` | TIMESTAMPTZ | When the historical workout record was created. |
| `updated_at` | TIMESTAMPTZ | When the workout history record was last edited. |

## Important Behavior

Active workouts are not initially persisted.

A `workout_sessions` record is created when the workout is:

- completed normally
- finished early

Cancel creates no workout session.


# 10. Workout Sets

## Purpose

Stores the individual sets actually completed during a persisted workout.

These records represent historical facts rather than the current routine
configuration.

Example:

    Workout: Upper Body
    Exercise: Bicep Curl
    Set 1
    12 reps
    15 lb

## Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Primary identifier for the historical set. |
| `workout_session_id` | UUID, FK → `workout_sessions.id` | Identifies the workout containing this set. |
| `exercise_id` | UUID, nullable, FK → `exercises.id` | References the original exercise when it still exists. Nullable so history can survive exercise deletion. |
| `exercise_name` | VARCHAR/TEXT | Snapshot of the exercise name at workout time. |
| `exercise_position` | INTEGER | Preserves the exercise's order during this workout. |
| `set_number` | INTEGER | Identifies the set's order within the exercise. |
| `reps` | INTEGER | Actual number of reps performed. |
| `weight` | NUMERIC | Actual weight used for the completed set. |
| `weight_unit` | VARCHAR/TEXT | Unit associated with the historical weight. |
| `completed_at` | TIMESTAMPTZ, nullable | When the set was completed, when that information is available. |
| `created_at` | TIMESTAMPTZ | When the historical set record was created. |
| `updated_at` | TIMESTAMPTZ | When this historical set was last edited. |

## Skipped Sets

Skipped sets are not considered completed sets.

For the MVP, skipped sets do not need their own persisted `workout_sets` records.

Therefore:

    Complete Set
        → persisted when workout is saved

    Skip Set
        → not persisted as a completed workout set


# 11. Historical Snapshots

Historical records must not depend entirely on mutable routine/exercise data.

Consider:

    August
      Routine name: Upper Body
      Exercise: Bicep Curl

Then in September the user changes:

    Upper Body → Arms & Shoulders
    Bicep Curl → Dumbbell Curl

The August history should still accurately describe what was recorded in August.

Therefore workout history stores snapshot values such as:

    workout_sessions.routine_name
    workout_sets.exercise_name

Foreign keys may still be retained where useful, but historical display must not
depend on those referenced records remaining unchanged.


# 12. Editable History

Workout history is editable.

Users may correct:

- reps
- weight
- other historical information explicitly supported by the history editor

Editing workout history modifies the historical records only.

It must not automatically modify:

    routines
    routine_exercises
    exercises

Example:

    Routine target:
    Bicep Curl — 10 reps

    Historical correction:
    Bicep Curl — 12 reps

The routine remains:

    10 reps

unless the user separately edits the routine.


# 13. User Settings

## Purpose

Stores persisted user preferences.

Each registered user should have at most one settings record.

## Fields

| Field | Type | Purpose |
|---|---|---|
| `user_id` | UUID, PK/FK → `users.id` | Identifies the user whose settings these are and enforces one settings record per user. |
| `theme` | VARCHAR/TEXT | Stores the user's theme preference, such as `dark` or `light`. |
| `accent_color` | VARCHAR/TEXT | Stores the user's selected supported accent color or token. |
| `created_at` | TIMESTAMPTZ | When the settings record was created. |
| `updated_at` | TIMESTAMPTZ | When settings were last changed. |

Dark is the product's default theme.


# 14. Table Summary

The initial persistent model contains:

| Table | Purpose |
|---|---|
| `users` | Registered user identity. |
| `exercises` | Built-in and user-created exercises. |
| `routines` | User-created workout routines. |
| `routine_exercises` | Exercise configuration within a routine. |
| `routine_schedules` | Planned days/times for routines. |
| `workout_sessions` | Persisted completed/finished workouts. |
| `workout_sets` | Sets actually completed during workouts. |
| `user_settings` | Persisted UI/user preferences. |

This gives the MVP **8 core tables**.

Do not add a progression table because progression is not part of the MVP.


# 15. Relationship Summary

    users
      |
      | 1:N
      v
    routines
      |
      | 1:N
      v
    routine_exercises
      |
      | N:1
      v
    exercises


    routines
      |
      | 1:N
      v
    routine_schedules


    users
      |
      | 1:N
      v
    workout_sessions
      |
      | 1:N
      v
    workout_sets


    users
      |
      | 1:1
      v
    user_settings


    users
      |
      | 1:N
      v
    custom exercises

Built-in exercises have no owner.


# 16. Delete Behavior

Deletion behavior should preserve historical workout data.

## Routine Deletion

Deleting a routine should remove or appropriately handle:

    routine_exercises
    routine_schedules

Historical workout sessions must remain.

Therefore historical workout data must not cascade-delete merely because its
source routine is deleted.


## Exercise Deletion

Deleting a user's custom exercise must not destroy historical workout data.

Historical `exercise_name` snapshots remain available.

Deletion should also account for whether the exercise is currently referenced by
active routines.

The exact UX and constraint behavior should be finalized when exercise deletion
is implemented.


## User Deletion

Account deletion behavior requires a deliberate product/security decision and
should be designed when account management is implemented.

Do not assume deletion behavior without considering privacy and data-retention
requirements.


# 17. Constraints

Use database constraints where they protect valid domain assumptions.

Examples that should be considered:

    sets > 0
    target_reps > 0
    weight >= 0
    rest_between_sets_seconds >= 0
    rest_after_exercise_seconds >= 0
    reps >= 0
    workout historical weight >= 0
    position >= 0
    set_number > 0

Application validation should also exist where useful.

Database constraints provide a final integrity boundary.


# 18. Indexing

Do not add indexes indiscriminately.

Primary keys and unique constraints will naturally create some indexes.

Likely query patterns should guide additional indexes.

Potential candidates include:

    routines.user_id

    exercises.owner_user_id

    routine_exercises.routine_id

    routine_schedules.routine_id

    workout_sessions.user_id

    workout_sessions (user_id, completed_at)

    workout_sets.workout_session_id

Exact indexes should be selected alongside actual query implementation and
verified using PostgreSQL query plans if performance becomes relevant.


# 19. Transactions

Operations that create or modify multiple related records should use
transactions where partial persistence would produce invalid state.

A key example is workout completion:

    BEGIN

      INSERT workout_session

      INSERT completed workout_sets

    COMMIT

If persistence fails partway through:

    ROLLBACK

The application should not leave a workout session partially recorded.


# 20. IDs

Use UUIDs for persistent entity identifiers unless implementation reveals a
strong reason to choose another strategy.

IDs should be generated consistently.

Do not expose sequential database implementation details merely for convenience.


# 21. Weight Representation

Weight must not be stored using floating-point types that introduce unnecessary
binary floating-point precision behavior.

Use an appropriate PostgreSQL numeric representation.

The exact precision/scale should be chosen during Drizzle schema implementation
based on supported weight increments.

The API should expose weight through a clearly defined contract.


# 22. Time

Persist actual event timestamps using timezone-aware timestamps:

    TIMESTAMPTZ

Examples:

    created_at
    updated_at
    started_at
    completed_at

Routine planned time is conceptually different because it represents a local
recurring schedule and therefore uses a local time representation.

Time-zone requirements should be revisited before implementing notifications.


# 23. Statistics

MVP statistics should primarily be derived from:

    workout_sessions
    workout_sets

Do not create aggregate/statistics tables until there is a demonstrated need.

Examples:

    total workouts
        → COUNT(workout_sessions)

    total completed sets
        → COUNT(workout_sets)

    total reps
        → SUM(workout_sets.reps)

More sophisticated analytics can be introduced later.


# 24. Progression

Automatic progression is NOT part of the MVP.

Do not create:

    progression_rules

or equivalent persistent structures during initial implementation.

Possible future requirements include:

    Increase exercise reps by 1
    every workout

and potentially individual set progression.

The data model should be revisited when that feature is designed.


# 25. Guest Data

Guest mode does not require persistent PostgreSQL records.

Guest:

- routines
- active workout
- history
- settings

may be represented through temporary client-side data for the demo experience.

The exact guest implementation belongs to the guest-mode feature design.


# 26. Drizzle

The implementation should translate this logical model into Drizzle schemas.

Conceptually:

    docs/database.md
           |
           v
    Drizzle schema
           |
           v
    Drizzle migration
           |
           v
    PostgreSQL

The Drizzle schema is executable implementation.

This document remains the architectural description.

If the implementation requires changing an important domain relationship, update
this document as part of the same change.


# 27. Initial Schema Rule

Do not automatically implement every table during repository bootstrap.

Repository bootstrap should establish:

- PostgreSQL
- Drizzle
- migration tooling
- database connectivity

Feature-related tables should be introduced as their corresponding features are
implemented unless there is a strong reason to create them together.


# 28. Database Design Principle

The database should distinguish between:

    what the user plans to do
            ↓
         ROUTINES

and:

    what the user actually did
            ↓
      WORKOUT HISTORY

That distinction is fundamental to the GoForLift data model.