# Cutoff

**Make practice count.** A JEE practice app with timed papers, saved attempts,
server-side scoring and clear question-level feedback.

## Features

- A responsive React interface with Cutoff branding and an interactive warm-up.
- Supabase email/password signup, login, email confirmation and password reset flows.
- A paper library with search, year filters, instructions and source labels.
- Timed attempts with single-choice, multiple-select and numerical answers.
- Automatic saves, resume, review flags, answer clearing and submission confirmation.
- Server-side expiry, ownership checks and transactions for saving/submitting.
- Results, answer explanations, subject/chapter/topic/difficulty analytics and history.
- A validated JSON import command and an optional original demo paper.

## Stack

| Layer          | Choice                                  |
| -------------- | --------------------------------------- |
| Interface      | React, Vite, plain CSS                  |
| API            | Node.js 22.12+ and Express              |
| Database       | Supabase PostgreSQL with Prisma ORM     |
| Authentication | Supabase Auth                           |
| Tests          | Node test runner, Supertest, Playwright |

Prisma Client reads and writes the application tables. Versioned SQL migrations create the tables, constraints and triggers.

```text
React → Supabase Auth: signup, login, password recovery
React → Express: bearer token + student requests
Express → Supabase Auth: verify the token
Express → Prisma Client → Supabase PostgreSQL: read/write practice data
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

## Project structure

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
  services/       Prisma queries, answer saving, scoring and imports
  lib/            Database transactions, errors and input checks
prisma/schema.prisma  Prisma models and their database relationships
supabase/migrations/  Ordered SQL files, applied once
scripts/              Setup checks, migration and paper import commands
data/                 Practice paper JSON files
tests/                Unit, database integration and browser tests
docs/                 Setup, API, data format and design decisions
```

## Database model

The 16 application tables cover student profiles, papers, questions, answer keys
and attempts. Each profile uses the student's Supabase Auth UUID. Express reads
and writes practice data in the private `cutoff` schema through Prisma.

Saving an answer and its selected options takes one transaction. If submission
arrives during a save, PostgreSQL waits for the save to finish before closing
the attempt. See the [architecture notes](docs/architecture.md).

## Verification

```bash
npm test
npm run build
npm run format:check
```

See the [testing guide](docs/testing.md) for the PostgreSQL integration tests and
browser tests.

## Team

- Krishna: frontend and integration.
- Tahseen: backend and database.
- Atharv: historical question extraction.
- Srijan: verification and analytics research.
