# GoForLift — Design & UX

## 1. Purpose

This document defines the visual, UX, responsive, and component-design direction
for GoForLift.

Product behavior is defined in:

    docs/requirements.md

Technical architecture is defined in:

    docs/architecture.md

Database design is defined in:

    docs/database.md

This document should guide frontend implementation and future mockups.


# 2. Design Goals

GoForLift should feel:

- modern
- polished
- clean
- focused
- responsive
- easy to use while actively exercising
- visually distinctive without becoming gimmicky

The application is also a portfolio project.

The UI should demonstrate thoughtful frontend engineering rather than looking
like a default component-library demo.


# 3. Brand

Product name:

    GoForLift

The name is inspired by spaceflight / mission-control terminology such as:

    Go for launch.

combined with:

    lifting weights.


# 4. Visual Theme

GoForLift uses a subtle:

    space
    NASA
    mission-control
    launch

inspired visual identity.

The theme should provide personality without making the application difficult to
understand.

The application should NOT look like a children's rocket game.

Prefer subtle references through:

- typography
- iconography
- status indicators
- countdowns
- motion
- small pieces of copy
- branding
- restrained space imagery

Functional usability always takes priority over the theme.


# 5. Product Language

Normal workout concepts should use normal workout terminology.

Use:

    Routine
    Exercise
    Set
    Reps
    Weight
    Rest
    Workout
    History

Do NOT rename everything to space terminology.

Avoid UX such as:

    Routine → Mission Plan
    Exercise → Mission Objective
    Weight → Payload Mass

The user should never need to decode the theme to understand the application.


# 6. Personality Copy

Space-themed copy may be used selectively for moments where it adds personality.

## Starting a Workout

Potential copy:

    Ready for liftoff?

After starting:

    We Have Liftoff.


## Workout Completion

Potential completion message:

    Houston, We Have Gains.

This can appear alongside useful workout information.

Example:

    HOUSTON,
    WE HAVE GAINS.

    Workout Complete

    42 min
    12 sets
    96 reps


## Rest Timer

Countdown styling may subtly reference launch countdowns.

For example:

    REST

    T–00:45

However, clarity is more important than maintaining the joke.

If usability testing shows that:

    00:45

is clearer than:

    T–00:45

use the clearer presentation.


# 7. Theme Modes

GoForLift supports:

- dark theme
- light theme

Dark mode is the default.

Both themes should be intentionally designed.

Light mode should not simply be an inverted afterthought.


# 8. Accent Color

The application has a configurable accent/primary color.

The initial mockups may use purple, but purple must NOT be hardcoded throughout
the application.

Use semantic design tokens.

Conceptually:

    --background
    --foreground
    --surface
    --surface-elevated
    --primary
    --primary-foreground
    --secondary
    --muted
    --border
    --destructive

Components should consume semantic tokens rather than assuming a specific color.

Changing the supported accent should update appropriate elements such as:

- primary buttons
- selected navigation
- progress indicators
- focus states
- active controls
- selected cards
- appropriate highlights

without requiring individual components to be rewritten.


# 9. UI Technology

Use:

    Tailwind CSS
    shadcn/ui

shadcn/ui provides reusable component building blocks.

Tailwind CSS is used to style and customize those components according to the
GoForLift design system.

GoForLift should not simply use the default appearance of every shadcn component.


# 10. Component Architecture

The conceptual component hierarchy is:

    Tailwind CSS
          |
          v
    shadcn/ui primitives
          |
          v
    GoForLift shared components
          |
          v
    feature-specific components
          |
          v
    pages


# 11. shadcn/ui

Use shadcn/ui for appropriate foundational components such as:

- Button
- Input
- Select
- Dialog
- Alert Dialog
- Dropdown Menu
- Tabs
- Card
- Tooltip
- Sheet
- Checkbox
- Radio Group
- Form-related primitives

Do not automatically install every available shadcn component.

Add components as features require them.


# 12. Shared GoForLift Components

Build reusable application components when meaningful patterns emerge.

Potential examples include:

    PageHeader
    SectionCard
    StatCard
    RoutineCard
    ExerciseCard
    WorkoutSetCard
    RestTimer
    EmptyState
    LoadingState

These are examples, not mandatory abstractions.

Do not create components merely because they might theoretically be reusable.


# 13. Avoid Styling Duplication

Avoid repeating large identical Tailwind class combinations throughout the
application.

If the same meaningful visual pattern repeatedly appears, consider:

- a reusable component
- a component variant
- a design token
- an appropriate utility abstraction

Do not abstract one-off styling simply to eliminate every repeated class.

For readability, keep short Tailwind class lists inline. When a list becomes
long or combines several responsibilities, pass multiple strings to `cn()` and
group them in this order when applicable:

1. layout and spacing
2. typography and color
3. interaction and focus states
4. responsive overrides
5. conditional state

Extract a reusable component or `cva()` variant only when a meaningful styling
pattern actually repeats.


# 14. Responsive Design

GoForLift is a responsive web application.

It must work well on:

- mobile
- tablet
- laptop
- desktop

Mobile and desktop should share the same product capabilities.

However, the layouts do NOT need to be identical.


# 15. Mobile Design

Mobile is especially important because workouts are likely to be performed using
a phone.

The active workout experience should prioritize:

- current exercise
- current set
- reps
- weight
- timer
- large primary actions

Touch targets should be comfortably sized.

Important workout actions should not require precise tapping.


# 16. Desktop Design

Desktop should use the additional screen space intentionally.

Do not simply take:

    mobile card
        ↓
    stretch to 1400px wide

Desktop may use:

- multi-column layouts
- persistent navigation
- side panels
- wider statistics sections
- richer routine summaries
- more information visible simultaneously

The underlying design system and visual identity should remain consistent with
mobile.


# 17. Navigation

Navigation should adapt appropriately to screen size.

Possible direction:

Mobile:

    bottom navigation

Desktop:

    sidebar navigation

Exact navigation structure should follow the approved mockups.

Navigation should clearly expose major areas such as:

    Home
    Routines
    History
    Settings

The exact labels may evolve with the product.


# 18. Active Workout UX

The active workout screen is one of the most important screens in the product.

It should clearly answer:

    What exercise am I doing?

    What set am I on?

    How many reps?

    What weight?

    What do I press when I'm finished?

    How much rest time remains?

The interface should minimize unnecessary interaction during the workout.


# 19. Complete Set

The primary active-workout action should be visually prominent.

Example:

    [ Complete Set ]

The application must NOT attempt to infer when the user finished the set.

The user explicitly presses this action.


# 20. Rest Timer

After completing a set, the rest timer becomes a primary visual element.

It should:

- be easy to read at a glance
- clearly show remaining time
- visually distinguish rest state from active-set state
- automatically transition appropriately when rest completes

Animations should be restrained and should not interfere with usability.


# 21. Skip

Skip is a secondary action.

It should be available but visually less prominent than:

    Complete Set

The UI should make the consequence understandable without creating unnecessary
friction.


# 22. Finish and Cancel

Finish and Cancel have different meanings.

Finish:

    Save the workout using completed work.

Cancel:

    Discard the entire active workout.

The UI must clearly distinguish them.

Cancel is destructive and should use an appropriate confirmation dialog.

Finishing early may also require confirmation when planned work remains.


# 23. Forms

Routine creation/editing forms should prioritize clarity.

Users should be able to understand the relationship between:

    Exercise
    Sets
    Reps
    Weight
    Rest

without needing documentation.

Use React Hook Form and the shared component system.

Validation errors should appear near the relevant fields and explain how to fix
the problem.


# 24. Routine Editor

The routine editor should make exercise ordering clear.

Users should be able to:

- add exercises
- configure exercises
- remove exercises
- understand their order

Reordering interaction can be finalized during implementation.

Do not introduce drag-and-drop solely because it looks sophisticated if simpler
controls provide a better MVP experience.


# 25. Workout History

History should emphasize:

- date
- routine
- exercises
- sets
- reps
- weight

Users should be able to inspect a workout and edit historical values.

Editing history must visually communicate that the user is modifying the
historical workout, not the source routine.


# 26. Statistics

Statistics should be visually useful without overwhelming the user.

Potential components:

    Workouts Completed
    Total Sets
    Total Reps
    Recent Activity

Use cards/charts only when they improve comprehension.

Do not add charts simply to make the dashboard look more sophisticated.


# 27. Empty States

Important empty states should be intentionally designed.

Examples:

No routines:

    No routines yet.

    Create your first routine to get ready for liftoff.

No workout history:

    No workouts yet.

    Your completed workouts will appear here.

The space theme may be used lightly in empty-state copy.


# 28. Loading States

Avoid unnecessary full-screen loading indicators.

Prefer appropriate:

- skeletons
- localized loading states
- disabled pending actions

depending on context.

The UI should avoid large layout shifts when data loads.


# 29. Error States

Errors should explain:

- what went wrong when known
- what the user can do next

Avoid exposing technical backend errors.

Bad:

    PostgreSQL foreign key constraint violation

Better:

    We couldn't save your routine. Try again.


# 30. Accessibility

Accessibility is part of production quality.

At minimum:

- semantic HTML
- keyboard accessibility
- visible focus states
- appropriate labels
- sufficient contrast
- accessible dialogs
- appropriate ARIA usage when semantic HTML is insufficient
- touch targets suitable for mobile use

Do not remove focus indicators merely for visual appearance.

shadcn/accessibility primitives should be preserved rather than bypassed.


# 31. Motion

Motion may reinforce the space/launch identity.

Potential examples:

- subtle workout-start transition
- progress transitions
- timer state changes
- workout-completion animation

Motion should be:

- short
- purposeful
- non-blocking
- respectful of reduced-motion preferences

Avoid excessive animation.


# 32. Icons

Use a consistent icon system.

Do not mix unrelated icon styles throughout the application.

Space-related icons may appear selectively in:

- branding
- empty states
- completion states

Workout functionality should use immediately understandable icons.


# 33. Typography

Typography should prioritize readability.

Workout-critical information such as:

    10 REPS
    15 LB
    00:45

should be easy to read quickly.

The visual hierarchy should clearly distinguish:

- page title
- section title
- exercise name
- workout metrics
- supporting text


# 34. Design Tokens

Prefer semantic tokens over raw visual values when the value represents a
system-wide design decision.

Examples:

    background
    foreground
    surface
    primary
    muted
    border
    destructive
    radius

This enables:

- dark/light themes
- configurable accent colors
- consistent component appearance
- easier future redesigns


# 35. Space Theme Restraint

A useful test:

If removing all space-themed copy would make the interface confusing, the design
is too dependent on the theme.

The core application should remain understandable as a workout application.

Space branding should make GoForLift memorable, not make it harder to use.


# 36. Storybook

Storybook is NOT required during initial development.

Consider adding Storybook once GoForLift has a meaningful set of reusable
components and variants.

A reasonable trigger might be when the application has approximately 8–12
meaningful reusable UI components whose states would benefit from isolated
development/documentation.

Do not add Storybook merely because component libraries commonly use it.


# 37. Mockups

Approved mockups should be treated as visual references.

Store them under a structure such as:

    docs/
      mockups/

When implementing a screen:

1. Review the relevant mockup.
2. Review this design document.
3. Identify reusable patterns.
4. Implement using the GoForLift component system.
5. Verify responsive behavior.

The mockup should guide visual intent.

It should not require reproducing accidental pixel-level artifacts that produce
poor responsive or accessible behavior.


# 38. Design Review

Before considering a major screen complete, verify:

- visual consistency
- responsive behavior
- dark mode
- light mode
- supported accent-color behavior
- keyboard usability
- loading state
- error state
- empty state where applicable
- important interaction states


# 39. Branding Direction

The current branding direction is:

    GOFORLIFT

with a restrained space / mission-control identity.

Possible concepts include:

    launch status
    countdown
    orbit
    mission control
    spacecraft instrumentation

Avoid directly copying NASA logos, protected branding, or visual assets.

The goal is inspiration from spaceflight aesthetics, not imitation of NASA's
identity.


# 40. Design Principle

GoForLift should feel like:

    a polished workout application
             +
    a subtle mission-control personality

not:

    a NASA-themed interface
             +
    workout functionality added afterward

Usability comes first.
