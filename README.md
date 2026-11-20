# Cutoff

**Make practice count.**

Cutoff is a JEE practice and performance-analysis application built around historical exam papers. Students can browse papers, take timed tests, save and resume attempts, review answers, and understand their performance through question-level and topic-wise analytics.

> **Project status:** The repository currently includes the 2 April 2026 evening paper (75 questions), the student practice workflow, server-side scoring, and grouped performance analytics. See the API and paper-format documentation for current boundaries.

---

## Contents

- [What Cutoff does](#what-cutoff-does)
- [Features](#features)
- [Technology stack](#technology-stack)
- [How the application works](#how-the-application-works)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database and paper data](#database-and-paper-data)
- [API overview](#api-overview)
- [Security and data integrity](#security-and-data-integrity)
- [Useful commands](#useful-commands)
- [Documentation](#documentation)
- [Current scope and limitations](#current-scope-and-limitations)

---

## What Cutoff does

Cutoff turns a JEE paper into an interactive practice session and then turns the student's responses into useful feedback.

**Practice flow**

1. Sign up or log in.
2. Browse the available papers.
3. Start a timed attempt.
4. Answer questions, move between sections, and mark questions for review.
5. Answers are saved automatically.
6. Resume an active attempt or submit it.
7. View the score, question-wise review, explanations, and performance breakdowns.

## Features

### Student experience

- Supabase email/password authentication.
- Email confirmation and password-recovery flows.
- Responsive landing page and student application.
- Paper catalogue with search and year filtering.
- Paper details, instructions, duration, and source information.
- Timed tests with single-choice, multiple-select, and numerical questions.
- Question navigation and review flags.
- Automatic answer saving and attempt resumption.
- Submission confirmation and result review.
- Attempt history and profile management.

### Results and analytics

- Server-side evaluation and scoring.
- Correct, incorrect, and unattempted counts.
- Question-level answer review and explanations after submission.
- Subject-, chapter-, topic-, and difficulty-wise breakdowns.
- Time-spent information and identification of slower questions.

### Reliability

- Ownership checks for student attempts.
- Transactional answer saving.
- Database locking to coordinate answer saves and submission.
- Server-side attempt expiry.
- Trusted command-line paper imports.
- Database health-check endpoint.

---

## Technology stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React 19, Vite 8 | User interface and client-side application |
| Routing | React Router 7 | Page navigation and protected routes |
| Styling | CSS | Responsive interface and layouts |
| Backend | Node.js 22.12+, Express 5 | HTTP API and application logic |
| Authentication | Supabase Auth | Signup, login, sessions, and access tokens |
| Database | Supabase PostgreSQL | Persistent application data |
| ORM | Prisma 6 with PostgreSQL adapter | Database queries and transactions |
| Question rendering | KaTeX | Mathematical notation |
| Icons | Phosphor Icons | Interface icons |
| Security | Helmet, CORS, express-rate-limit | HTTP security headers, origin policy, and API rate limiting |

**Note:** The frontend currently communicates with the backend using the native `fetch()` API through `client/src/lib/api.js`; Axios is not currently used.

---

## How the application works

### High-level architecture

```text
                     STUDENT
                        |
                        v
              React + Vite Frontend
                 (client/)
                  /       \
                 /         \
        Sign in /           \ Student API requests
               v             v
        Supabase Auth      Express API
        (sessions/JWT)       (src/)
                                |
                         Verify access token
                         using Supabase Auth
                                |
                         Authentication and
                         ownership checks
                                |
                                v
                         Prisma Client
                                |
                                v
                      Supabase PostgreSQL
                       (private cutoff schema)
```

### Authentication flow

1. The React client signs the student in through Supabase Auth.
2. Supabase manages the authentication session and issues an access token.
3. The frontend API helper obtains the current session token.
4. It sends the token in the `Authorization: Bearer <token>` header.
5. Express middleware verifies the token with Supabase.
6. The verified Supabase user ID is attached to `req.user`.
7. Protected services use that verified ID when accessing student-owned data.

Passwords are managed by Supabase Auth; Cutoff does not store student passwords in its application tables.

### Practice and answer-saving flow

```text
Student selects a paper
        |
        v
POST /api/papers/:id/attempts
        |
        v
Backend creates or resumes an active attempt
        |
        v
GET /api/attempts/:id
        |
        v
Frontend displays safe question data
        |
        v
Student changes an answer
        |
        v
PUT /api/attempts/:id/answers/:questionId
        |
        v
Backend validates ownership and attempt status
        |
        v
Prisma transaction saves answer + selected options
        |
        v
Student submits attempt
        |
        v
POST /api/attempts/:id/submit
        |
        v
GET /api/attempts/:id/results
        |
        v
Backend evaluates answers and returns results
```

Answer keys and explanations are not sent as part of the active test questions. They are revealed through the result endpoint for the requesting student's submitted attempt.

---

## Project structure

```text
cutoff/
├── client/                         # React + Vite frontend
│   ├── public/
│   │   └── papers/                 # Bundled question figures
│   └── src/
│       ├── components/             # Reusable UI components
│       ├── context/                # Authentication context
│       ├── hooks/                  # Reusable React logic
│       ├── lib/
│       │   ├── api.js              # Shared fetch-based API client
│       │   └── supabase.js         # Supabase browser client
│       ├── pages/                  # Application pages
│       ├── App.jsx                 # Routes and protected routes
│       ├── main.jsx                # React entry point
│       ├── styles.css
│       ├── responsive.css
│       └── report.css
│
├── src/                            # Express backend
│   ├── middleware/
│   │   └── auth.js                 # Bearer-token verification
│   ├── lib/
│   │   ├── db.js                   # Prisma client and adapter
│   │   ├── errors.js               # Application/error handling
│   │   ├── supabase.js             # Server-side Supabase helpers
│   │   └── validation.js           # Request input validation
│   ├── routes/
│   │   ├── health.routes.js         # Health-check endpoints
│   │   └── student.routes.js        # Student API endpoints
│   ├── services/                   # Business logic
│   │   ├── answers.js
│   │   ├── attempts.js
│   │   ├── history.js
│   │   ├── import-paper.js
│   │   ├── paper-validation.js
│   │   ├── papers.js
│   │   ├── questions.js
│   │   ├── results.js
│   │   └── scoring.js
│   ├── app.js                      # Express app and middleware setup
│   ├── config.js                   # Environment and DB configuration
│   └── server.js                   # Starts server and handles shutdown
│
├── prisma/
│   └── schema.prisma               # Prisma database models
│
├── supabase/
│   └── migrations/                 # Ordered SQL migrations
│
├── scripts/
│   ├── check-env.js                # Environment validation
│   ├── migrate.js                  # Apply SQL migrations
│   ├── validate-paper.js           # Validate paper JSON
│   └── import-paper.js             # Import paper data
│
├── data/                           # Source paper JSON
├── docs/                           # Setup, API, architecture, data format
├── .env.example                    # Backend environment template
├── package.json                    # Backend/root scripts
└── README.md
```

---

## Getting started

### Prerequisites

Install or prepare:

- Node.js **22.12 or later**.
- npm.
- A Supabase project with PostgreSQL and Email/Password Auth enabled.
- Git.

### 1. Clone the repository

```bash
git clone <repository-url>
cd cutoff
```

### 2. Install dependencies

Install the backend and frontend dependencies:

```bash
npm ci
npm --prefix client ci
```

The root installation also generates the Prisma Client through the project's `postinstall` script.

### 3. Configure environment variables

Create the backend environment file:

```bash
cp .env.example .env
```

Create the frontend environment file:

```bash
cp client/.env.example client/.env.local
```

Fill in the values described in [Environment variables](#environment-variables) and [Supabase setup](docs/setup.md).

### 4. Check the configuration

```bash
npm run check:env
```

### 5. Apply database migrations

```bash
npm run db:migrate
```

This applies the ordered SQL files in `supabase/migrations/` and records which migrations have already run.

### 6. Import the included paper

```bash
npm run papers:import
```

This imports the paper data in `data/2026-session-2/`.

### 7. Start the application

```bash
npm run dev
```

Open the frontend at:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000

The public landing page can load without Supabase credentials, but authentication and student features require a correctly configured Supabase project, database migrations, and paper data.

### Production build

Build the React frontend:

```bash
npm run build
```

Start the Express server in production:

```bash
NODE_ENV=production npm start
```

When `client/dist` exists, Express serves the built frontend and API from the same origin.

---

## Environment variables

### Backend — root `.env`

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection used by the application through Prisma |
| `DIRECT_URL` | Direct PostgreSQL connection used by the migration script; falls back to `DATABASE_URL` |
| `SUPABASE_URL` | Supabase project URL used by the backend |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key used for server-side token verification |
| `PORT` | Express port; defaults to `3000` |
| `CLIENT_URL` | Allowed frontend origin for CORS; defaults to `http://localhost:5173` |
| `DATABASE_CA_FILE` | Optional path to the PostgreSQL server CA certificate |
| `TRUST_PROXY` | Optional Express trust-proxy setting |

### Frontend — `client/.env.local`

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL used by the browser client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key used by the browser client |
| `VITE_API_URL` | Optional API base URL; leave empty to use the Vite proxy locally and same-origin API in production |


For exact Supabase dashboard settings and connection-string guidance, read [docs/setup.md](docs/setup.md).

---

## Database and paper data

### Database model

The application uses a normalized set of 16 tables in the private PostgreSQL schema named `cutoff`.

| Area | Models |
|---|---|
| Student and attempts | `User`, `Attempt`, `Answer`, `AnswerOption` |
| Papers and question mapping | `Test`, `TestQuestion` |
| Question classification | `Subject`, `Chapter`, `Topic`, `QuestionTopic` |
| Question content and keys | `Question`, `QuestionOption`, `CorrectOption`, `NumericalKey` |
| Images | `QuestionImage`, `OptionImage` |

The Prisma model definitions are in `prisma/schema.prisma`. The SQL migrations define database-specific constraints, triggers, access rules, and indexes.

A Cutoff profile uses the same UUID as the corresponding Supabase Auth user. The browser does not directly access the private `cutoff` schema; application data is accessed through the Express API.


---

## API overview

All API routes use the `/api` prefix. Health checks are public. Student routes require:

```http
Authorization: Bearer <Supabase access token>
```

### Health

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check whether the backend is running |
| `GET` | `/api/health/db` | Check database connectivity/readiness |

### Student and profile

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/me` | Get current profile and Auth email |
| `PATCH` | `/api/me` | Update the student's display name |

### Papers

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/papers` | List papers; supports year and search filters |
| `GET` | `/api/papers/:id` | Get paper details |

### Attempts and results

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/papers/:id/attempts` | Start or resume an active attempt |
| `GET` | `/api/attempts` | Get the student's recent attempt history |
| `GET` | `/api/attempts/:id` | Get attempt details, safe questions, and saved answers |
| `PUT` | `/api/attempts/:id/answers/:questionId` | Replace the response for a question |
| `POST` | `/api/attempts/:id/submit` | Submit an attempt |
| `GET` | `/api/attempts/:id/results` | Get submitted results, answer keys, and analytics |

See [docs/api.md](docs/api.md) for request payloads, response behavior, scoring rules, and API boundaries.

---

## Security and data integrity

- **Authentication:** Supabase Auth manages credentials and sessions. Express verifies the access token before student API requests.
- **Authorization:** The backend uses the verified Supabase user ID to check ownership. A user ID supplied in a request body does not determine ownership.
- **Private database schema:** The browser does not query the `cutoff` schema directly.
- **Answer-key protection:** Active test question responses do not include correct answers or explanations.
- **Transactional saves:** An answer and its selected options are saved together in a database transaction.
- **Concurrency control:** Saving and submitting lock the attempt row so concurrent operations cannot silently change a closed attempt.
- **Server-side timing:** The backend/database determines attempt expiry rather than trusting the browser clock.
- **Request protection:** Helmet, CORS configuration, JSON body-size limits, and API rate limiting are configured in the Express app.
- **Central error handling:** API errors are returned as JSON without exposing internal database details.
- **Trusted imports:** Paper and answer-key imports are run locally through repository scripts.

---

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Run backend and frontend together |
| `npm run dev:server` | Run the backend in watch mode |
| `npm run dev:client` | Run the Vite frontend |
| `npm start` | Start the Express server |
| `npm run build` | Build the React frontend |
| `npm run check:env` | Check required environment configuration |
| `npm run db:migrate` | Apply pending SQL migrations |
| `npm run data:validate -- <file>` | Validate a paper JSON file |
| `npm run data:import -- <file-or-folder>` | Import paper JSON |
| `npm run papers:import` | Import the included paper folder |
| `npm run format` | Format source and documentation |
| `npm run format:check` | Check formatting without changing files |

---

## Documentation

Additional project documentation:

- [Architecture](docs/architecture.md) — application design and answer lifecycle.
- [Setup](docs/setup.md) — Supabase project, environment variables, and database setup.
- [Student API](docs/api.md) — endpoints, payloads, scoring, and API boundaries.
- [Paper format](docs/paper-format.md) — how to prepare, validate, and import paper data.

---

## Current scope and limitations

The current capstone scope focuses on an individual student's practice and performance review.

- Paper catalogue and attempt history currently return up to 100 records; pagination is needed before expanding beyond that scope.
- Multiple-select questions use exact-set scoring; partial credit is not implemented.
- The application does not currently provide ranks, percentiles, predictions, leaderboards, or historical benchmark claims.
- The paper validator checks data structure; it does not verify scientific correctness or copyright permissions.
- Automated cross-paper question deduplication is not implemented.
- Only the included 2 April 2026 evening paper is bundled in the current data set.

---

## Team

| Contributor |
|---|---|
| Krishna | 
| Tahseen | 
| Atharv | 
| Srijan | 

---

**Cutoff — Make practice count.**
