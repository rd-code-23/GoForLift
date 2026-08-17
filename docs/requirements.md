# GoForLift — Product Requirements

## 1. Product Overview

GoForLift is a workout application focused initially on simple dumbbell workouts.

The application allows users to:

- create workout routines
- configure exercises, sets, reps, weight, and rest periods
- execute a workout through a guided interface
- track completed workouts
- review and edit workout history

The initial product is a web application.

The architecture should leave open a reasonably simple path toward an Android
application in the future.


## 2. Product Goals

### Primary Goals

1. Build a useful application for managing and performing workout routines.

2. Provide a polished full-stack portfolio project that demonstrates
   production-quality software engineering.

3. Learn an effective AI-assisted software development workflow without relying
   on uncontrolled "vibe coding."

4. Build the application primarily for personal use while allowing other users
   to create accounts and use it independently.


## 3. MVP Scope

The MVP focuses on basic dumbbell workout routines.

Avoid expanding the initial scope into advanced workout-programming concepts.

Examples of exercises the MVP should comfortably support include:

- bicep curls
- hammer curls
- tricep extensions
- overhead press
- lateral raises

The data model should not unnecessarily prevent future exercise types, but the
MVP UX only needs to handle straightforward dumbbell workouts well.


# 4. Authentication

## 4.1 Registered Users

Users should be able to authenticate using Google OIDC.

After authentication, GoForLift should maintain a server-side session stored in
PostgreSQL. The browser should receive only an opaque session ID in an
`HttpOnly` cookie. Application authentication should not use JWTs for the MVP.

Logging out should invalidate the server-side session. Protected resources must
require a valid session, and the backend must verify that the authenticated user
is authorized to access or modify each resource.

Registered users have persistent data.

Their:

- routines
- workout history
- settings
- custom exercises

should persist across sessions.


## 4.2 Guest Mode

The application should provide a guest experience.

The primary reason is to allow someone such as an interviewer to quickly explore
the application without creating an account.

Guest mode:

- does not require authentication
- does not create a registered-user authentication session
- does not persist user data permanently
- should allow meaningful exploration of the application's core functionality

The exact mechanism for temporary guest data can be determined during
implementation.


# 5. Workout Routines

## 5.1 Create Routine

A registered user should be able to create a workout routine.

A routine should contain:

- a name
- one or more exercises
- optional planned workout days/times


## 5.2 Routine Exercises

For each exercise in a routine, the user should be able to configure:

- exercise
- number of sets
- target reps
- weight
- rest time between sets
- rest time between exercises where applicable
- optional exercise description/notes

For the MVP, a single configured weight applies to the exercise's planned sets.

Supporting different planned weights for individual sets is a future feature.


## 5.3 Exercise Selection

Users should be able to select from predefined exercises.

Examples include:

- bicep curl
- hammer curl
- tricep extension
- overhead press
- lateral raise

The exercise catalog can grow over time.


## 5.4 Custom Exercises

Users should be able to create a custom exercise.

At minimum, a custom exercise should support:

- custom name
- optional description

Custom exercises should be available to that user when building routines.


## 5.5 Exercise Ordering

Exercises within a routine should have an explicit order.

Users should be able to control the order in which exercises appear in the
routine.


## 5.6 Edit Routine

Users should be able to modify an existing routine.

This includes modifying:

- routine information
- exercises
- exercise ordering
- sets
- reps
- weight
- rest periods
- planned schedule


## 5.7 Delete Routine

Users should be able to delete a routine.

Destructive actions should require an appropriate confirmation UX.


# 6. Workout Execution

## 6.1 Starting a Workout

A user should be able to start a workout from one of their routines.

Starting a workout begins a guided workout experience.

The application should clearly show:

- current exercise
- current set
- target reps
- target weight
- progress through the exercise
- progress through the workout


## 6.2 Set Completion

The application does NOT automatically determine when a set has finished.

The user performs the set at their own pace.

After completing the set, the user presses a button such as:

    Complete Set

Pressing this button tells the application exactly when the set was completed.


## 6.3 Rest Timer

After the user completes a set, the configured rest timer begins.

Example:

    Bicep Curl

    Set 1 of 3
    10 reps
    15 lb

    [ Complete Set ]

After pressing the button:

    Rest

    00:45

When the rest period finishes, the application advances to the next appropriate
set or exercise.

The timer should not depend on guessing how long the user's set took.


## 6.4 Next Exercise

After all intended sets for an exercise are completed or skipped, the workout
advances to the next exercise.

The configured exercise rest period should be respected where applicable.


## 6.5 Skip

The active workout should provide a Skip action.

Skipping the current set means that set is not recorded as completed.

The workout should then continue appropriately.

The MVP does not require complicated skip/resume/reordering behavior.


## 6.6 No Pause

The MVP does not include a workout pause feature.

This is intentional to keep the workout lifecycle simple.


## 6.7 Finish

The user should be able to finish a workout before completing every planned set.

Finish means:

- preserve the work that has actually been completed
- create workout history from the completed work
- exclude unfinished/skipped work from completed statistics

The user should receive an appropriate confirmation before prematurely finishing
a workout if data would otherwise be omitted.


## 6.8 Normal Completion

When the user completes the workout normally:

- the completed workout is saved
- completed sets are stored in workout history
- workout completion information is displayed

The UI may use GoForLift's space-themed personality for completion messaging.

Example:

    Houston, We Have Gains.

This branding copy should not replace clear functional information.


## 6.9 Cancel

The active workout should provide a Cancel action.

Cancel means:

- discard the entire active workout
- do not create workout history
- do not save completed sets from that workout

Because this is destructive, the user should receive a confirmation before the
workout is discarded.


# 7. Active Workout Persistence Strategy

For the MVP, the active workout is maintained client-side.

Starting a workout does not create a persisted workout session.

Completing or skipping individual sets does not require API calls. The frontend
tracks the in-progress workout, including completed sets and rest timers.

The workout is persisted only when:

- the workout completes normally, or
- the user chooses Finish to end the workout early

When persisted, the frontend sends the completed workout data to the backend.

Cancel discards the client-side workout and does not persist anything.

The implementation may perform other necessary non-workout-persistence API
requests, but the application should not save every set individually merely for
the sake of persistence.

This decision intentionally keeps the MVP workout lifecycle simpler.


# 8. Workout History

Registered users should be able to view previous workouts.

History should provide enough information to understand what the user actually
performed.

Examples include:

- workout date
- routine used
- exercises performed
- completed sets
- reps
- weight
- workout duration where available


## 8.1 Historical Accuracy

Workout history represents what happened during that workout.

Editing a routine later should not rewrite old workout history.

Historical workout records should therefore retain the information required to
accurately represent the completed workout.


## 8.2 Editable History

Workout history should be fully editable.

Users should be able to correct mistakes after completing a workout.

For example, if the user accidentally recorded:

    Bicep Curl
    10 reps
    15 lb

but actually performed:

    12 reps
    15 lb

they should be able to correct the historical workout.

Editing history changes the historical record only.

It should not automatically modify the routine from which the workout
originated.


# 9. Statistics

The application should provide useful basic workout statistics.

The MVP should focus on statistics that can be derived reliably from completed
workout history.

Examples may include:

- number of workouts completed
- number of completed sets
- total reps
- exercise-specific activity
- recent workout activity

The exact dashboard statistics can be finalized alongside the UI implementation.

Avoid building an advanced analytics platform for the MVP.


# 10. Routine Scheduling

Users should be able to associate planned workout days/times with routines.

The MVP should store and display this schedule.

Advanced scheduling and notification infrastructure are not required initially.


# 11. Settings

Users should have application settings.

MVP settings should include at least:

- theme preference
- accent color preference where supported by the design

Additional settings can be added when justified.


# 12. Theme

GoForLift supports:

- dark theme
- light theme

Dark theme is the default.

The application's accent/primary color should be configurable rather than
hardcoded to purple.

See:

    docs/design.md


# 13. Support

The application should provide a way for users to access a customer support
email address.

A full customer-support ticketing system is outside MVP scope.


# 14. Responsive Design

The web application should work well on:

- mobile
- tablet
- desktop

The application should not simply stretch the mobile layout across a desktop
screen.

Desktop layouts may take advantage of additional space while preserving the same
features and design system.


# 15. Future Features

The following are explicitly outside the initial MVP unless later promoted into
scope.


## 15.1 Progression Rules

Allow users to configure automatic progression.

Potential examples:

Exercise-level progression:

    Increase reps by: 1
    Occurrence: every workout

More detailed progression could eventually support individual sets.

Progression is intentionally excluded from the MVP.


## 15.2 Per-Set Planned Weight

The MVP uses one configured weight for the planned sets of an exercise.

Future versions may allow:

    Set 1: 15 lb
    Set 2: 20 lb
    Set 3: 20 lb


## 15.3 Exercise Media

Allow exercises to contain:

- images
- videos

Media could be:

- provided by GoForLift
- uploaded or linked by users

This media could be shown during workout execution.


## 15.4 Public Routines

Users may eventually make routines public.

Other users could:

- discover routines
- view routines
- copy routines into their own account


## 15.5 Routine Recommendations

Users may eventually provide information such as:

- goals
- experience
- available equipment
- workout frequency

GoForLift could recommend an appropriate routine.


## 15.6 Workout Notifications

Future versions may remind users about scheduled workouts.

Possible channels include:

- push notifications
- SMS
- other appropriate notification mechanisms


## 15.7 Music Integration

Potential integration with music services such as Spotify during workouts.


## 15.8 Native Android Application

GoForLift begins as a responsive web application.

A future Android application should be possible without redesigning the entire
backend.

The backend should therefore expose application functionality through clean APIs
rather than coupling core functionality directly to the web frontend.


# 16. Explicitly Out of Scope for MVP

Unless requirements change, the MVP does NOT require:

- automatic progression
- per-set planned weights
- workout pause/resume
- saving every completed set immediately to the backend
- exercise images/videos
- public/social routines
- AI-generated routines
- recommendation engines
- SMS/push notifications
- Spotify integration
- native Android application
- advanced analytics
- complicated workout programming
- support for every possible type of exercise


# 17. Product Personality

GoForLift uses a light space / mission-control theme.

The theme should add personality without reducing usability.

Potential phrases include:

Starting a workout:

    We Have Liftoff.

Completing a workout:

    Houston, We Have Gains.

Other subtle launch/countdown concepts may be used where appropriate.

However, standard workout terminology should remain understandable.

Prefer:

    Routine
    Exercise
    Set
    Reps
    Weight
    Rest
    History

Do not replace every domain term with space terminology merely to fit the theme.


# 18. MVP Success Criteria

The MVP is successful when a user can reliably:

1. Enter GoForLift.
2. Authenticate or explore through guest mode.
3. Create a routine.
4. Add and configure dumbbell exercises.
5. Edit or delete the routine.
6. Start the routine as a workout.
7. Work through sets at their own pace.
8. Explicitly complete or skip sets.
9. Use the automatic rest timer between sets.
10. Finish, complete, or cancel the workout with the documented behavior.
11. Persist completed workouts for registered users.
12. Review workout history.
13. Edit historical workout data.
14. View useful basic workout statistics.
15. Use the application comfortably on mobile and desktop.
16. Switch between light and dark themes.
17. Customize the supported accent color.
