# Cutoff

**Make practice count.** A JEE practice app with timed papers, saved attempts,
server-side scoring and clear question-level feedback.

## What is built

- A responsive React interface with Cutoff branding and an interactive warm-up.
- Supabase email/password signup, login, email confirmation and password reset flows.
- A paper library with search, year filters, instructions and source labels.
- Timed attempts with single-choice, multiple-select and numerical answers.
- Automatic saves, resume, review flags, answer clearing and submission confirmation.
- Server-side expiry, ownership checks and transactions for saving/submitting.
- Results, answer explanations, subject/chapter/topic/difficulty analytics and history.
- A validated JSON import command and an optional original demo paper.

**The core MVP is implemented.** Live Supabase connection and email delivery still
need verification after project credentials are supplied. Verified historical
papers and deployment are separate remaining steps. The demo is not JEE paper data.

## Stack

| Layer          | Choice                                    |
| -------------- | ----------------------------------------- |
| Interface      | React, Vite, plain CSS                    |
| API            | Node.js 22.12+ and Express                |
| Database       | PostgreSQL on Supabase, queried with `pg` |
| Authentication | Supabase Auth                             |
| Tests          | Node test runner, Supertest, Playwright   |

Prisma has been removed. SQL migrations are the database source of truth.

```text
React → Supabase Auth: signup, login, password recovery
React → Express: bearer token + student requests
Express → Supabase Auth: verify the token
Express → PostgreSQL: read/write private application tables
```

## Run locally

```bash
npm ci
npm --prefix client ci
```

Fill `.env` and `client/.env.local` using their `.env.example` files.
See [Supabase setup](docs/setup.md) for the exact values and dashboard settings.

```bash
npm run check:env
npm run db:migrate
npm run seed:demo    # Optional; run once to add original practice questions.
npm run dev
```

Open **http://localhost:5173**. The API runs at **http://localhost:3000**.
The public landing page works before credentials are added. Sign-in and student
data require the configured Supabase project and migrations. Restart `npm run dev`
after changing environment values.

To create a production build, run `npm run build`, then `npm start`.
Express serves the built frontend and API from the same origin.

## Find your way around

```text
client/src/
  pages/          Landing, auth, dashboard, papers, attempt, results and account
  components/     Shared controls, question renderer, timer and navigation
  hooks/          Fetching data and managing a saved attempt
  context/        Signed-in session state
  lib/            Supabase and authenticated API clients
  styles.css      Brand and desktop styles
  responsive.css  Mobile layouts and reduced-motion support
src/
  routes/         URL → service function
  middleware/     Authentication
  services/       SQL queries, answer saving, scoring and imports
  lib/            Database transactions, errors and input checks
supabase/migrations/  Ordered SQL files, applied once
scripts/              Setup checks, migration and paper import commands
data/                 Original demo and later verified paper JSON
 tests/               Unit, database integration and browser tests
 docs/                Setup, API, data format and design decisions
```

## Read the code in this order

1. `src/app.js`: how the Express middleware and routes fit together.
2. `src/routes/student.routes.js`: each API endpoint and its service call.
3. `src/services/papers.js`: a small example of SQL with input parameters.
4. `src/services/answers.js`: one transaction saves the complete answer.
5. `src/services/scoring.js`: plain JavaScript determines outcomes and totals.
6. `client/src/pages/PapersPage.jsx`: a page fetching and displaying API data.
7. `client/src/hooks/useAttempt.js`: local state, the save queue and resume behavior.

`$1` and `$2` are input placeholders, not string concatenation. A transaction
runs several writes together: `COMMIT` keeps them, `ROLLBACK` cancels them.
`FOR UPDATE` makes submission wait for an in-flight answer save.

## Database model

The 16 normalized application tables follow the AP + DE design:
users, tests, subjects, chapters, topics, questions, question_topics,
question_options, correct_options, numerical_keys, question_images,
option_images, test_questions, attempts, answers and answer_options.

Two intentional implementation changes are documented in
[the architecture notes](docs/architecture.md): student IDs are Supabase Auth
UUIDs, and credentials stay in Auth. Paper source/demo metadata is added by
migration 004. Application tables live in the private `cutoff` schema, with
RLS enabled and browser roles denied access. Only Express accesses them.
The coursework repository is separate; update its documentation deliberately
when reconciling the final Supabase design.

## Add papers later

Start from [the demo JSON](data/demo-paper.json), following the
[paper format](docs/paper-format.md). Replace all demo content with verified data
and set `isDemo` to false for a real paper.

```bash
npm run data:validate -- data/my-paper.json
npm run data:import -- data/my-paper.json
```

Imports are atomic. Re-importing the same title/year/session is rejected.
The app does not edit a published paper or its keys. Corrections get a new version.

## Verification

```bash
npm test
npm run build
npm run format:check
```

[Testing instructions](docs/testing.md) explain the real PostgreSQL integration
and browser tests. Browser tests inject authentication only inside their isolated
test server; they do not verify real Supabase email delivery.

## Team and Git workflow

- Krishna: frontend and integration.
- Tahseen: backend and database.
- Atharv: historical question extraction.
- Srijan: verification and analytics research.

Work on `main` with small commits and short messages. Keep database credentials
in the server environment. The browser uses the project URL and publishable key.

See [API reference](docs/api.md), [setup](docs/setup.md), and
[remaining work](docs/remaining-work.md).
