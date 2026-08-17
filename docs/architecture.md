# GoForLift — Architecture

## 1. Purpose

This document describes the high-level technical architecture and major
engineering decisions for GoForLift.

Product behavior is defined in:

    docs/requirements.md

Database design is defined in:

    docs/database.md

UI and visual conventions are defined in:

    docs/design.md


# 2. Architecture Goals

GoForLift should be:

- maintainable
- secure
- strongly typed
- testable
- easy to understand
- easy to run locally
- suitable for demonstrating professional full-stack engineering
- capable of evolving if usage grows
- capable of supporting non-web clients in the future

The project should use production-quality engineering practices without
introducing unnecessary distributed-system complexity.

Prefer the simplest architecture that satisfies current requirements while
preserving reasonable paths for future evolution.


# 3. High-Level Architecture

GoForLift consists of three primary runtime components:

    Browser
       |
       | HTTPS / REST
       v
    React Web Application
       |
       | HTTP / REST
       v
    Express API
       |
       | Drizzle
       v
    PostgreSQL

The frontend and backend are separate applications.

They communicate through REST APIs.

The frontend must not access PostgreSQL directly.


# 4. Repository Strategy

GoForLift uses a monorepo.

The frontend and backend are separate applications but live in the same Git
repository.

Expected structure:

    GoForLift/
      apps/
        web/
        api/

      packages/
        contracts/
        config/

      docs/

      .github/
        workflows/

      AGENTS.md
      compose.yaml
      package.json
      pnpm-workspace.yaml

Benefits for this project include:

- frontend/backend changes can occur in one pull request
- easier sharing of TypeScript contracts
- unified CI
- unified developer setup
- easier coordination for a project owned by one developer

The frontend and backend should remain architecturally separated even though
they share a repository.


# 5. Package Management

Use:

    pnpm

The repository uses pnpm workspaces for managing applications and shared
packages.

Expected workspace locations:

    apps/*
    packages/*


# 6. Frontend

The frontend lives in:

    apps/web

Technology:

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui
- React Compiler
- Vitest
- React Testing Library


# 7. Frontend Responsibilities

The web application is responsible for:

- rendering the UI
- routing
- form interaction
- client-side validation for user experience
- server-state fetching/caching
- active workout state
- rest timer behavior
- responsive layouts
- theme handling
- communicating with the API

Security-sensitive validation and authorization must still occur on the server.


# 8. Frontend Code Organization

Prefer feature-based organization.

Conceptual example:

    apps/web/src/
      features/
        auth/
        exercises/
        routines/
        workouts/
        history/
        settings/

      components/
        ui/

      lib/

      routes/

Feature directories may contain:

- components
- hooks
- queries
- mutations
- schemas
- utilities
- tests

when appropriate.

Do not create folders merely to satisfy a predetermined structure.

Shared components should only be extracted when they are genuinely shared.


# 9. Routing

Use:

    TanStack Router

Routes should remain separate from substantial feature/business logic.

Route components may compose feature components but should not become large
containers for unrelated logic.


# 10. Server State

Use:

    TanStack Query

for state owned by the server.

Examples:

- routines
- exercises
- workout history
- user settings loaded from the backend

TanStack Query is responsible for concerns such as:

- fetching
- caching
- refetching
- mutation state
- invalidation

Do not duplicate TanStack Query data into Zustand without a specific reason.


# 11. Client State

Use the smallest appropriate state mechanism.

Use React local state for state that is local to a component or small subtree.

Use React Hook Form for form state.

Use Zustand when state needs to be shared across unrelated components or screens
and does not naturally belong to server state.

One expected Zustand use case is the active workout session.


# 12. Active Workout Architecture

The MVP intentionally keeps an active workout primarily on the client.

Conceptually:

    Routine data
        |
        v
    Start Workout
        |
        v
    Client-side Active Workout State
        |
        | complete/skip sets locally
        | run rest timers locally
        |
        v
    Finish / Normal Completion
        |
        | one persistence operation
        v
    Express API
        |
        v
    PostgreSQL

The backend does not need to receive an API request after every completed set.


## 12.1 Why

This keeps the initial workout lifecycle simpler.

A workout may take an unpredictable amount of time.

The application knows a set has finished only when the user explicitly presses
the Complete Set button.

There is little MVP value in persisting every intermediate set individually.


## 12.2 Completion

When the user:

- finishes early, or
- completes the workout normally

the frontend sends the completed workout data to the backend.

The backend:

1. validates the request
2. verifies authorization
3. creates the workout session
4. creates the completed workout-set records
5. commits the operation atomically where appropriate


## 12.3 Cancel

Cancel discards the client-side active workout.

Because the backend has not persisted the active workout, no workout persistence
operation is required for cancellation.


## 12.4 Tradeoff

Refreshing or closing the browser may lose an active workout in the initial MVP.

That tradeoff is acceptable unless the requirements are later changed.

Potential future improvements could include:

- local browser persistence
- periodic server checkpoints
- resumable server-side workout sessions

Do not implement these unless required.


# 13. Forms

Use:

    React Hook Form

for substantial forms.

Use:

    Zod

for validation schemas where appropriate.

Forms should provide useful client-side validation feedback.

Server-side validation remains mandatory because client-side validation cannot
be trusted.


# 14. UI Architecture

Use:

    Tailwind CSS
    shadcn/ui

shadcn/ui provides low-level reusable UI components/primitives.

Tailwind is used to implement the visual design.

GoForLift may build its own reusable components on top of these primitives.

Conceptually:

    Tailwind
        |
        v
    shadcn/ui
        |
        v
    GoForLift shared components
        |
        v
    feature components
        |
        v
    pages

See:

    docs/design.md


# 15. Backend

The backend lives in:

    apps/api

Technology:

- Node.js
- TypeScript
- Express 5
- Zod
- PostgreSQL
- Drizzle ORM
- Drizzle Kit
- Vitest


# 16. Backend Architecture

The backend begins as a modular monolith.

Do not introduce microservices for the MVP.

A conceptual feature organization might be:

    apps/api/src/
      features/
        auth/
        exercises/
        routines/
        workouts/
        history/
        settings/

      db/
      middleware/
      lib/

Each backend feature may contain the pieces needed by that feature, such as:

- routes
- services
- repositories/data-access helpers
- validation
- tests

Do not force every feature to contain every layer.


# 17. Backend Separation of Concerns

Express route handlers should primarily deal with HTTP concerns.

Conceptually:

    Request
       |
       v
    Route / Controller
       |
       v
    Validation
       |
       v
    Service / Business Logic
       |
       v
    Data Access
       |
       v
    PostgreSQL

Do not place substantial business logic directly inside route handlers.

At the same time, avoid creating unnecessary service/repository abstractions for
trivial operations.

The architecture should remain pragmatic.


# 18. API Style

GoForLift uses REST.

URLs should be resource-oriented and predictable.

Conceptual examples:

    /routines
    /exercises
    /workouts
    /workout-history
    /settings

Exact endpoint definitions can be designed when each feature is implemented.

Do not design the entire API surface prematurely.


# 19. API Base Path

The API base path has not yet been finalized.

Whether routes use a prefix such as:

    /api/routines

or are exposed through another deployment/routing strategy will be determined
when deployment architecture is better understood.

Do not couple application code unnecessarily to a specific deployment topology.


# 20. API Versioning

API versions should NOT be encoded in every resource URL.

Avoid:

    /api/v1/routines

The project prefers header-based API versioning so URLs remain clean.

Conceptually:

    GET /api/routines
    X-API-Version: 1

The exact header name and initial behavior should be finalized when API
versioning is actually implemented.

Do not build an elaborate multi-version framework before multiple API versions
exist.

The initial implementation may simply establish the convention.


# 21. Shared Contracts

Shared API contracts belong in:

    packages/contracts

Use Zod schemas where runtime validation and shared TypeScript types are both
useful.

Example:

    export const CreateRoutineSchema = z.object({
      name: z.string().min(1)
    });

    export type CreateRoutineInput =
      z.infer<typeof CreateRoutineSchema>;

The backend can use the schema for runtime validation.

The frontend can use the same contract for type safety and appropriate
client-side validation.


## 21.1 Do Not Share Everything

The monorepo does not mean every type should be shared.

Do not expose:

- database row types
- internal backend entities
- implementation-specific types

to the frontend merely because TypeScript allows it.

Prefer explicit API contracts.


# 22. Database

Use:

    PostgreSQL

PostgreSQL is the authoritative persistent data store for registered users.

Database details are documented in:

    docs/database.md


# 23. Database Access

Use:

    Drizzle ORM

Reasons include:

- strong TypeScript integration
- explicit SQL-oriented model
- compile-time type safety
- relatively lightweight abstraction

Use:

    Drizzle Kit

for schema migrations and related development tooling.


# 24. Database Migrations

Persistent schema changes must be represented through migrations.

Do not rely on manually modifying production database schemas.

The development workflow should make schema changes reviewable in Git.


# 25. Local Database Development

Use Docker Compose to run PostgreSQL locally.

Conceptually:

    Developer Machine
      |
      +-- React / Vite
      |
      +-- Node / Express
      |
      +-- Docker
            |
            +-- PostgreSQL

Initially, React and Express run directly on the developer machine.

Do not containerize the entire development environment unless there is a real
need.


# 26. Configuration

Environment-specific configuration should use environment variables.

For example:

    DATABASE_URL

Provide safe example configuration through files such as:

    .env.example

Never commit real credentials or secrets.


# 27. Authentication

Registered users authenticate with Google using OpenID Connect (OIDC).

After a successful OIDC flow, the API finds or creates the corresponding
GoForLift user and creates a server-side application session. Session records are
stored in PostgreSQL. The browser receives only a cryptographically random,
opaque session ID in an `HttpOnly` cookie; application authentication does not
use JWTs for the MVP.

The authentication flow is conceptually:

    Browser
       |
       | Google OIDC login
       v
    Express API
       |
       | find/create user + create session
       v
    PostgreSQL

    Browser <- HttpOnly session ID cookie <- Express API

Use a maintained OIDC and session-management library rather than implementing
OIDC, cookie signing, or session lifecycle behavior from scratch. The exact
library should be selected during implementation based on compatibility,
maintenance, and security posture.

Session cookies must use:

- `HttpOnly`
- `Secure` in production
- an intentionally selected `SameSite` policy compatible with the deployment
  topology and OIDC redirect flow
- a narrow path and domain scope where practical
- a defined expiration consistent with the server-side session

Logout invalidates the server-side session and clears the cookie. Expired and
invalid session IDs must not authenticate a request. Because authentication uses
cookies, the implementation must include appropriate CSRF protection for
state-changing requests.

Guest access remains unauthenticated and does not create a persistent session or
registered-user data.


## 27.1 Authorization

Authorization must occur on the backend.

Every protected request must resolve a valid server-side session and enforce
resource ownership or other applicable authorization rules. Authentication alone
does not grant access to every registered user's resources.

A user must not be able to access or modify another user's:

- routines
- custom exercises
- workout history
- settings

Client-side hiding of UI elements is not authorization.


# 28. Guest Architecture

Guest mode should not create permanently persisted user data.

The exact implementation can be finalized with the guest feature.

Possible approaches may include temporary client-side state.

Avoid creating unnecessary backend guest-account infrastructure unless
requirements justify it.


# 29. Error Handling

The backend should provide consistent and safe error responses.

Expected errors should be represented intentionally.

Unexpected server errors should:

- be logged
- avoid leaking stack traces or sensitive implementation details to clients

The frontend should:

- handle request failures
- provide useful error states
- use appropriate error boundaries for unexpected rendering failures


# 30. Observability

Production observability is desirable but should be added incrementally.

Potential future tooling may include:

- frontend RUM
- centralized backend logs
- metrics
- alarms
- error tracking

CloudWatch is a possible option depending on the eventual hosting platform.

Do not commit to AWS-specific observability until deployment architecture is
selected.


# 31. Testing Strategy

Use:

    Vitest

for frontend and backend tests.

Use:

    React Testing Library

for React component/user-behavior testing.

Tests should focus on confidence in behavior.

Important targets include:

- business logic
- Zod validation
- API behavior
- authorization
- workout lifecycle behavior
- forms
- important UI flows
- regressions


# 32. End-to-End Testing

A browser E2E framework such as Playwright is NOT required during initial
bootstrap.

The project may introduce E2E testing later when meaningful end-to-end user
flows exist.

Likely future candidates include:

- creating a routine
- executing a workout
- completing a workout
- editing workout history

Do not add Playwright until there is enough product behavior to justify it.


# 33. Code Quality

Use:

- TypeScript strict mode
- ESLint
- Prettier

Expected repository-level commands should eventually include:

    pnpm dev
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm format:check
    pnpm build


# 34. CI/CD

GitHub is the source-control platform.

GitHub Actions should eventually validate pull requests.

At minimum, CI should be capable of running:

    install
    typecheck
    lint
    format check
    test
    build

Deployment automation will be designed after the hosting architecture is chosen.


# 35. Git Workflow

Development should use Git intentionally.

A typical feature workflow should be:

    main
      |
      +-- feature branch
             |
             +-- implementation
             +-- tests
             +-- review
             +-- pull request
             +-- CI
             +-- merge

AI-generated changes should be reviewed like changes from another engineer.


# 36. Deployment

The deployment platform has intentionally NOT been selected yet.

Potential decisions include:

- frontend hosting
- backend hosting
- PostgreSQL hosting
- domain
- secret management
- logging/monitoring

Do not introduce deployment-specific architecture until this decision is made.


# 37. Future Android Support

The first client is a web application.

A native Android application may be added later.

Therefore:

    Web
      |
      |
      v
    REST API
      ^
      |
      |
    Future Android App

Core business capabilities should remain accessible through the backend API.

Do not place server-authoritative business logic exclusively inside the React
application when that logic will eventually need to be shared across clients.

This does NOT mean the React UI itself must be reusable by Android.


# 38. Scalability Philosophy

GoForLift should be designed cleanly enough to evolve if usage becomes large.

However:

    "could support millions of users someday"

does NOT mean:

    "build distributed infrastructure today."

Start with:

- modular monolith
- PostgreSQL
- stateless HTTP API where practical
- clean domain boundaries
- indexes based on actual query needs
- proper authorization
- good observability when deployed

If scaling problems eventually occur, architecture can evolve based on measured
requirements.


# 39. Major Decisions Summary

| Area | Decision |
|---|---|
| Repository | Monorepo |
| Package manager | pnpm |
| Frontend | React 19 + TypeScript |
| Build tool | Vite |
| Router | TanStack Router |
| Server state | TanStack Query |
| Client state | React state + Zustand where appropriate |
| Forms | React Hook Form |
| Validation | Zod |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Node + Express 5 + TypeScript |
| API | REST |
| API versioning | Header-based |
| Database | PostgreSQL |
| ORM | Drizzle |
| Migrations | Drizzle Kit |
| Local DB | Docker Compose |
| Testing | Vitest + React Testing Library |
| E2E | Deferred; consider Playwright later |
| Structure | Feature-based / vertical |
| Architecture | Modular monolith |
| Active workout | Client-side until finish/completion |
| Authentication | Google OIDC + PostgreSQL-backed server-side sessions; opaque session ID in an HttpOnly cookie; no application JWT for MVP |
| Deployment | TBD |
| Android | Future client using the same API |


# 40. Architecture Principle

When choosing between two solutions, prefer the one that:

1. satisfies current requirements,
2. is easy to understand,
3. is easy to test,
4. preserves important future options,
5. introduces the least unnecessary complexity.
