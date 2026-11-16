# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build the UI as a small React Router app with Bootstrap styling and route-specific fetch logic; keep each page focused on rendering API data, loading, empty, and error states without business logic.
- Logic tier decision: Implement the Express API as thin TypeScript route handlers that validate request payloads, normalize Mongo/Mongoose cast issues into deliberate 4xx responses, and delegate persistence and aggregation to the model layer.
- Data tier decision: Use Mongoose schemas for the canonical contracts: required identity fields on User, required team metadata, computed activity points/occurredAt timestamps, and reusable Workout recommendations with focused fields.
- Activity tracking approach: Accept `userId` and `teamId` IDs, verify they exist, reject malformed or missing references with 4xx errors, and store a normalized activity with `user`, `team`, `type`, `minutes`, plus computed `points` and `occurredAt`.
- Team management approach: Require a team `name` and `mascot`, default `members` to an empty array, and preserve memberships as ObjectId references while exposing them through the API as strings.
- Leaderboard approach: Aggregate activity points per team, sort descending by total points, and assign a 1-based rank to each team entry so the frontend can render the ranking without additional client-side calculations.
- Workout suggestions approach: Match a seeded user by email, derive the recommendation from recent activity patterns and fitness goal, and return a first suggestion whose `focus` reflects the trait that best matches the user while including a human-readable `reason`.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates the Mongoose contracts and seed behavior. Failures here mean the data model is missing required fields, defaults, or invariants, which will cascade into API and UI issues.
- API command: `npm run test:api --prefix octofit-tracker/backend` — validates the HTTP contract for activities, teams, leaderboard, and workout suggestions. Failures indicate missing route logic, bad error handling, or incorrect aggregation/recommendation behavior.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — validates the React UI contract for route rendering, loading states, empty states, and failure alerts. Failures here usually mean the app is not fetching or rendering the expected API payloads.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — verifies TypeScript compilation and catches contract mismatches in the server implementation.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — verifies the React app and Vite build still compile and that the presentation layer remains consistent with the API contract.
