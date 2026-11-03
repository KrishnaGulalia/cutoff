# Cutoff

**A JEE Main test-taking and performance intelligence platform.**

Cutoff helps JEE aspirants attempt historical JEE Main papers in a
computer-based testing environment and understand their performance
through structured, question-level analytics.

> **Project status:** Under active development\
> **Repository:**
> [KrishnaGulalia/cutoff](https://github.com/KrishnaGulalia/cutoff)

------------------------------------------------------------------------

## Contents

-   [1. Product overview](#1-product-overview)
-   [2. Product goals](#2-product-goals)
-   [3. Student journey](#3-student-journey)
-   [4. Core features](#4-core-features)
-   [5. Technology stack](#5-technology-stack)
-   [6. System architecture](#6-system-architecture)
-   [7. Repository structure](#7-repository-structure)
-   [8. Team ownership](#8-team-ownership)
-   [9. Collaboration rules](#9-collaboration-rules)
-   [10. Question-data workflow](#10-question-data-workflow)
-   [11. Data model overview](#11-data-model-overview)
-   [12. Local development setup](#12-local-development-setup)
-   [13. Environment configuration](#13-environment-configuration)
-   [14. Database and Prisma workflow](#14-database-and-prisma-workflow)
-   [15. API conventions](#15-api-conventions)
-   [16. Security and engineering
    principles](#16-security-and-engineering-principles)
-   [17. Development roadmap](#17-development-roadmap)
-   [18. Definition of done](#18-definition-of-done)
-   [19. How to contribute](#19-how-to-contribute)
-   [20. Useful resources](#20-useful-resources)

------------------------------------------------------------------------

## 1. Product overview

JEE aspirants often attempt previous-year questions but may not get a
sufficiently detailed picture of their preparation from a raw score
alone.

Cutoff is being built to connect **historical JEE Main papers, realistic
test attempts and meaningful performance analysis** in one platform.

A student should be able to attempt a previous-year paper, review the
result and understand questions such as:

-   Which chapters and topics are strong or weak?
-   Is the student losing marks because of conceptual gaps, accuracy or
    time management?
-   How does performance differ across Physics, Chemistry and
    Mathematics?
-   Which questions consumed too much time?
-   How does performance change across multiple attempts?
-   How did the student perform across different difficulty levels?

Cutoff is a test-taking and analysis product. It is **not a
question-paper generator**.

## 2. Product goals

### Primary goals

1.  Provide a reliable JEE Main CBT-style test experience.
2.  Organise historical questions with consistent subject, chapter,
    topic and difficulty metadata.
3.  Evaluate attempts accurately using server-side scoring.
4.  Give students useful performance insights at test, subject, chapter,
    topic and question level.
5.  Support multiple attempts on the same paper so students can track
    progress.

### Product principles

-   **Accuracy before volume:** verified questions and answer keys
    matter more than importing a large unverified dataset.
-   **Useful analytics:** every metric should help a student understand
    or improve performance.
-   **Consistent data:** one shared taxonomy must be used across the
    entire question bank.
-   **Secure evaluation:** correct answers must not be exposed to the
    browser before submission.
-   **Incremental engineering:** build a dependable MVP before
    introducing advanced analytics or infrastructure.

## 3. Student journey

``` text
Register / Login
      |
      v
Student Dashboard
      |
      v
Select a Historical JEE Main Paper
      |
      v
Start Test
      |
      v
Attempt Questions
      |
      v
Save / Review / Navigate
      |
      v
Submit Test
      |
      v
Server-side Evaluation
      |
      v
Result Summary
      |
      v
Performance Analytics
```

A student may attempt the same paper more than once. The product should
preserve each attempt independently and allow comparison between
attempts.

## 4. Core features

### MVP

  -----------------------------------------------------------------------
  Area                                Scope
  ----------------------------------- -----------------------------------
  Accounts                            Registration, login and
                                      authenticated student access

  Paper catalogue                     Browse and select available
                                      historical papers

  Question bank                       Structured questions, options,
                                      answers, explanations and metadata

  CBT interface                       Timer, question navigation, answer
                                      selection, marking for review and
                                      submission

  Attempt management                  Create, save, resume and submit
                                      attempts

  Evaluation                          Correct, incorrect and unattempted
                                      counts; marks and score

  Results                             Test-level result summary

  Basic analytics                     Subject, chapter, topic, accuracy
                                      and time-based analysis

  Multiple attempts                   Preserve and review separate
                                      attempts for the same paper
  -----------------------------------------------------------------------

### Later possibilities

These are future directions, not commitments for the first release:

-   Compare first, latest and best attempts.
-   Topic and chapter trends across multiple papers.
-   Historical topic frequency and paper-difficulty trends.
-   More detailed time-management insights.
-   Question-level learning recommendations.
-   Statistical measurement and personalised recommendations.

## 5. Technology stack

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Frontend                React + Vite            Student interface, CBT
                                                  experience and
                                                  dashboards

  Backend                 Node.js + Express       APIs, business logic,
                                                  authentication and
                                                  evaluation

  Database                PostgreSQL              Persistent application
                                                  data

  ORM                     Prisma 6                Database queries,
                                                  schema and migrations

  Database hosting        Supabase PostgreSQL     Hosted PostgreSQL
                          (planned / migration in environment
                          progress)               

  API testing             Postman                 Endpoint verification

  Version control         Git + GitHub            Collaboration, code
                                                  review and project
                                                  history
  -----------------------------------------------------------------------

**Important:** Supabase is the planned PostgreSQL hosting platform. The
application architecture remains Express → Prisma → PostgreSQL. Supabase
Auth is not part of the current plan; authentication will be handled by
the backend.

## 6. System architecture

``` text
+------------------------------+
|       React + Vite           |
|  CBT UI / Dashboard / Results|
+--------------+---------------+
               |
          HTTP / JSON
               |
               v
+------------------------------+
|       Node.js + Express      |
|                              |
| Routes and Controllers       |
| Authentication               |
| Attempt Management            |
| Scoring and Analytics         |
| Validation and Business Logic|
+--------------+---------------+
               |
               v
+------------------------------+
|          Prisma ORM          |
+--------------+---------------+
               |
               v
+------------------------------+
|       PostgreSQL             |
| Users / Tests / Questions    |
| Attempts / Answers           |
+------------------------------+
```

### Architectural rules

1.  The React application communicates with the Express API. It must not
    connect directly to PostgreSQL.
2.  Prisma database access stays inside the backend.
3.  The backend is responsible for validating submissions and
    calculating scores.
4.  Correct answers and evaluation-only fields must not be included in
    test-delivery API responses.
5.  Keep the backend as a modular monolith for the MVP. Do not introduce
    microservices, Kafka, Redis or other infrastructure without a
    demonstrated requirement.
6.  Keep API contracts and question-data formats consistent across team
    members.

## 7. Repository structure

The backend currently follows this structure. The frontend and data
directories may evolve as the team integrates its work.

``` text
cutoff/
├── src/
│   ├── server.js
│   ├── app.js
│   ├── lib/
│   │   └── prisma.js
│   └── routes/
│       ├── health.routes.js
│       └── db.routes.js
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── data/                   # Proposed shared import-data location
│   ├── questions/
│   └── papers/
│
├── scripts/                # Validation and import scripts
├── docs/                   # Taxonomy, API contracts and team decisions
├── .env                    # Local secrets; never commit
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

Do not create duplicate folders or move existing files without
coordinating with the team.

## 8. Team ownership

Each person should have a clear primary area. Work that crosses
ownership boundaries should be coordinated through an issue or an agreed
API/data contract.

  -----------------------------------------------------------------------
  Team member             Primary ownership       Expected outputs
  ----------------------- ----------------------- -----------------------
  **Tahseen**             Backend, database and   Express APIs, Prisma
                          integration             schema, PostgreSQL,
                                                  authentication,
                                                  attempts, scoring,
                                                  import pipeline and
                                                  analytics
                                                  implementation

  **Krishna**             Frontend                React UI, CBT
                                                  interface, dashboard,
                                                  charts, API integration
                                                  and frontend testing

  **Atharv**              Historical question     Question and paper
                          extraction              data, source
                                                  references, images and
                                                  initial metadata

  **Srijan**              Data verification and   Question/answer
                          analytics research      verification,
                                                  classification checks,
                                                  duplicate checks,
                                                  formula research and
                                                  test cases
  -----------------------------------------------------------------------

### Ownership boundaries

-   Atharv prepares question data; Srijan verifies it.
-   Tahseen owns the canonical data format, validation scripts and
    database import process.
-   Krishna owns frontend presentation and consumes documented API
    contracts.
-   Any change to the question taxonomy, JSON format, database schema or
    API contract must be discussed before implementation.
-   No teammate should independently invent a new chapter/topic naming
    convention.

## 9. Collaboration rules

### Communication

Before starting work that affects another person's area:

1.  Create or identify a GitHub Issue.
2.  State the intended change and expected output.
3.  Mention affected files, APIs or data formats.
4.  Identify dependencies on other teammates.
5.  Agree on the contract before parallel implementation.

### Git workflow

Use a feature branch for each meaningful task.

Suggested branch naming:

``` text
feature/<short-description>
fix/<short-description>
docs/<short-description>
data/<short-description>
```

Examples:

``` text
feature/test-list-api
feature/cbt-question-navigation
data/jee-main-2025-jan-shift-1
fix/attempt-submission-validation
docs/question-taxonomy
```

Recommended workflow:

``` bash
git pull origin main
git checkout -b feature/your-task

# Make and test your changes
git add .
git commit -m "feat: add test listing endpoint"
git push -u origin feature/your-task
```

Then open a Pull Request (PR) into `main`.

### Pull Request rules

Every PR should include:

-   What changed and why.
-   Related GitHub Issue.
-   Files or modules affected.
-   How the change was tested.
-   Screenshots for meaningful UI changes.
-   Sample request/response for API changes.
-   Data validation summary for question-data changes.

Do not push unreviewed work directly to `main`. Keep PRs focused and
reasonably small. At least one relevant teammate should review changes
that affect shared contracts.

### Commit message convention

Use simple prefixes:

``` text
feat: add test listing endpoint
fix: prevent duplicate answer records
docs: update question data format
refactor: separate attempt service
test: add scoring edge cases
chore: update development scripts
```

### Shared decisions

Record important decisions in `docs/` or GitHub Issues, especially:

-   Chapter/topic taxonomy.
-   Question and paper JSON schemas.
-   API request and response formats.
-   Marking rules.
-   Attempt lifecycle.
-   Analytics formulas.
-   Database schema changes.

Avoid relying on private messages as the only record of a technical
decision.

## 10. Question-data workflow

Question data is a core product asset. It must be structured and
verified before it is imported into PostgreSQL.

### Workflow

``` text
Original JEE Main Paper + Official Answer Key
                    |
                    v
          Atharv: Data Extraction
                    |
                    v
       Structured questions.json
       Structured papers.json
                    |
                    v
          Srijan: Verification
                    |
                    v
       Verified / Correction Required
                    |
                    v
       Tahseen: Automated Validation
                    |
                    v
          Import through Prisma
                    |
                    v
             PostgreSQL
                    |
                    v
          Available in Cutoff
```

### Data ownership and status

Every question should have a stable ID and a verification status.
Suggested statuses:

-   `pending`: extracted but not fully verified.
-   `verified`: question, answer and classification checked.
-   `needs_correction`: an issue has been identified.

Only records that pass the agreed validation and verification rules
should be made available in production tests.

### Question format

The canonical format should be maintained in a shared schema/document
before large-scale extraction.

Illustrative structure:

``` json
{
  "question_id": "PHY-MECH-0001",
  "subject": "physics",
  "chapter": "mechanics",
  "topic": "kinematics",
  "subtopic": "relative motion",
  "question_type": "single_correct",
  "difficulty": "medium",
  "question": {
    "text": "Question statement...",
    "images": []
  },
  "options": [
    { "option_id": "A", "text": "Option A", "images": [] },
    { "option_id": "B", "text": "Option B", "images": [] }
  ],
  "answer": {
    "type": "single_correct",
    "correct_options": ["A"],
    "numerical_value": null,
    "accepted_range": null
  },
  "explanation": {
    "text": "Explanation...",
    "solution_steps": []
  },
  "tags": [],
  "source": {
    "source_type": "jee_main",
    "source_reference": "Year / date / shift / question reference"
  },
  "verification": {
    "status": "pending",
    "question_verified": false,
    "answer_verified": false,
    "classification_verified": false,
    "verified_by": null,
    "notes": null
  }
}
```

### Paper mapping format

A paper is a specific exam session/shift. It maps question IDs to their
positions and marking rules.

``` json
{
  "paper_id": "JEE-MAIN-2025-JAN-22-S1",
  "exam": "JEE Main",
  "year": 2025,
  "session": "January",
  "date": "2025-01-22",
  "shift": 1,
  "language": "English",
  "question_mappings": [
    {
      "question_id": "PHY-MECH-0001",
      "section": "A",
      "question_number": 1,
      "marks_correct": 4,
      "marks_incorrect": -1,
      "marks_unattempted": 0
    }
  ],
  "verification_status": "pending"
}
```

These examples are illustrative. The canonical schema and allowed values
must be agreed upon and validated before bulk data preparation. In
particular, numerical questions, multiple-correct marking rules, images
and source attribution must be handled consistently.

### Data quality checklist

Before a question is marked ready:

-   [ ] Stable, unique question ID exists.
-   [ ] Question text and images are complete.
-   [ ] Options are complete where applicable.
-   [ ] Correct answer matches the official answer key or an approved
    resolution.
-   [ ] Subject, chapter and topic follow the shared taxonomy.
-   [ ] Question type and difficulty are populated.
-   [ ] Source reference is recorded.
-   [ ] Duplicate check is complete.
-   [ ] Verification status is updated.
-   [ ] Paper mapping and question number are checked.

Do not put correct answers in public frontend payloads. Keep answer keys
in the backend/database and reveal evaluation details only when
appropriate after submission.

## 11. Data model overview

The initial relational model contains these entities:

  -----------------------------------------------------------------------
  Model                               Purpose
  ----------------------------------- -----------------------------------
  `User`                              Student account

  `Test`                              A historical JEE Main paper or test

  `Question`                          Reusable question content and
                                      metadata

  `TestQuestion`                      Maps questions to a test, including
                                      position and marking scheme

  `Attempt`                           One student's attempt at a test

  `Answer`                            The student's response to a
                                      question in an attempt
  -----------------------------------------------------------------------

### Key relationships

``` text
User 1 -------- * Attempt
Test 1 -------- * Attempt
Test 1 -------- * TestQuestion
Question 1 ---- * TestQuestion
Attempt 1 ----- * Answer
Question 1 ---- * Answer
```

A `Question` can be reused across papers. `TestQuestion` stores the
paper-specific position and marks. Each `Attempt` is independent, and an
`Answer` belongs to one attempt and one question.

The Prisma schema is the source of truth for the implemented database
structure. Any schema change must be made through a reviewed
migration---not by manually changing production tables.

## 12. Local development setup

### Prerequisites

Install:

-   Node.js 20.x
-   npm
-   PostgreSQL (for local development, if using a local database)
-   Git
-   Postman (or another API client)

Check versions:

``` bash
node --version
npm --version
git --version
```

### Clone the repository

``` bash
git clone https://github.com/KrishnaGulalia/cutoff.git
cd cutoff
```

### Install dependencies

``` bash
npm install
```

### Configure environment variables

Create a local `.env` file using `.env.example` as a reference. Never
commit `.env`.

At minimum, configure the database connection required by the current
Prisma setup.

### Generate Prisma Client

``` bash
npx prisma generate
```

### Apply migrations

For a local development database, use the existing migration history:

``` bash
npx prisma migrate dev
```

Do not run database reset commands on a shared or production database.

### Start the backend

The current backend entry point is:

``` bash
node src/server.js
```

If the repository's `package.json` provides a development script, use
that script instead. Check `package.json` for the exact available
scripts.

### Health checks

The existing routes include:

``` text
GET /
GET /api/health/db
```

Use Postman or `curl` to verify the routes. The database health endpoint
should report a successful database connection when the configured
PostgreSQL database is reachable.

> The frontend setup may have its own package directory and commands.
> Follow the frontend-specific instructions maintained by the frontend
> owner.

## 13. Environment configuration

Example placeholder file:

``` dotenv
# PostgreSQL connection string for the selected environment
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Add other variables only when they are actually required by the backend.
```

Keep real credentials in `.env` or the deployment platform's secret
manager.

### Rules

-   Never commit `.env`.
-   Never paste database passwords, JWT secrets or service-role keys
    into GitHub Issues or PRs.
-   Keep `.env.example` updated when new required variables are
    introduced.
-   Use separate credentials/configuration for local development and
    production.
-   Do not expose privileged Supabase credentials in frontend
    environment variables.
-   The exact connection URL and pooling configuration must follow the
    project's current Prisma and Supabase setup.

## 14. Database and Prisma workflow

Prisma schema and migration files should be committed to Git.

Common commands:

``` bash
# Generate Prisma Client after schema/dependency changes
npx prisma generate

# Create and apply a migration in local development
npx prisma migrate dev --name describe_change

# Check migration status
npx prisma migrate status

# Open Prisma Studio
npx prisma studio
```

### Database change workflow

1.  Discuss the proposed schema change.
2.  Update `prisma/schema.prisma`.
3.  Generate a migration locally.
4.  Review the generated SQL and migration diff.
5.  Test against a development database.
6.  Commit the schema and migration together.
7.  Have the relevant teammate review the PR.
8.  Apply migrations to shared/production environments through the
    approved deployment workflow.

For production/shared databases, use the appropriate deployment
migration command (typically `npx prisma migrate deploy`) rather than
`migrate dev`.

Never casually edit, delete or regenerate migration history that has
already been applied to a shared database.

## 15. API conventions

The backend exposes REST APIs through Express. Exact endpoint contracts
should be documented as they are implemented.

### Conventions

-   Use nouns for resource paths.
-   Use appropriate HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`).
-   Return JSON consistently.
-   Validate request parameters and bodies.
-   Use appropriate HTTP status codes.
-   Keep database queries and business logic out of route handlers as
    the backend grows.
-   Do not trust client-supplied scores, correctness flags or marks.
-   Do not expose internal errors, database credentials or answer keys.

### Example response shape

Success:

``` json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

Error:

``` json
{
  "success": false,
  "message": "A clear error message",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

These are proposed conventions. The team should use one agreed response
format consistently and document actual endpoint contracts in
`docs/API.md` or an equivalent API specification.

## 16. Security and engineering principles

-   Keep secrets out of source control.
-   Validate and sanitise incoming data.
-   Authenticate protected routes on the backend.
-   Authorise access to each student's own attempts and answers.
-   Prevent users from reading another user's private attempt data.
-   Do not send correct answers with the test-delivery response.
-   Calculate scores on the server using the paper's marking rules.
-   Prevent duplicate submissions and invalid attempt-state transitions.
-   Use database constraints and transactions where needed.
-   Avoid logging passwords, tokens or sensitive student data.
-   Use HTTPS in deployed environments.
-   Apply least-privilege database access.
-   Review Supabase Row Level Security and database roles as part of the
    deployment security design.

## 17. Development roadmap

The project is being developed in levels so the team can build and
verify each foundation before moving forward.

  -----------------------------------------------------------------------
  Level                   Focus                   Main outcome
  ----------------------- ----------------------- -----------------------
  1                       Project audit and       Existing backend and
                          foundation              development setup
                                                  understood and
                                                  stabilised

  2                       Database architecture   Reliable PostgreSQL
                          and Supabase            environment and
                                                  migration workflow

  3                       Question bank and data  Validated
                          pipeline                question/paper data and
                                                  repeatable import
                                                  process

  4                       Authentication and core Student accounts and
                          APIs                    test catalogue APIs

  5                       CBT attempt engine      Reliable test attempts,
                                                  answer saving and
                                                  submission

  6                       Scoring and analytics   Correct evaluation and
                                                  useful performance
                                                  insights

  7                       Frontend integration    End-to-end product
                          and deployment          ready for controlled
                                                  testing
  -----------------------------------------------------------------------

**Current working level:** Update this section as each level is
verified. Do not mark a level complete just because code has been
generated; it should be tested and reviewed.

## 18. Definition of done

A task is complete only when:

-   [ ] The agreed requirement is implemented.
-   [ ] The code follows the existing project conventions.
-   [ ] Relevant edge cases have been considered.
-   [ ] Tests or manual verification steps have been completed.
-   [ ] No secrets or local-only files are included.
-   [ ] Documentation/API contracts are updated where needed.
-   [ ] The PR has been reviewed and approved.
-   [ ] The change is merged into the agreed branch.

For question data, completion additionally requires the agreed
verification and validation checks.

## 19. How to contribute

We welcome contributions from the project team through focused issues
and pull requests.

1.  Check existing Issues and project discussions before starting.
2.  Claim or create an Issue with a clear scope.
3.  Confirm ownership and dependencies.
4.  Create a feature branch.
5.  Implement and test the change.
6.  Open a PR with context and verification evidence.
7.  Address review comments.
8.  Merge only after approval.

For a bug report, include:

-   What you expected to happen.
-   What actually happened.
-   Steps to reproduce.
-   Relevant logs with secrets removed.
-   Screenshots or API request/response where useful.

For a feature proposal, include:

-   The user problem.
-   Proposed behaviour.
-   Acceptance criteria.
-   Affected frontend, backend or data components.
-   Dependencies and open questions.

## 20. Useful resources

-   [Cutoff GitHub Repository](https://github.com/KrishnaGulalia/cutoff)
-   [Node.js Documentation](https://nodejs.org/docs/latest/api/)
-   [Express Documentation](https://expressjs.com/)
-   [Prisma Documentation](https://www.prisma.io/docs)
-   [PostgreSQL Documentation](https://www.postgresql.org/docs/)
-   [Supabase Documentation](https://supabase.com/docs)
-   [React Documentation](https://react.dev/)
-   [Vite Documentation](https://vite.dev/)

------------------------------------------------------------------------

## A note to the team

Cutoff is a shared product, not four independent assignments. Frontend,
backend, database and question data must work together.

**Agree on contracts before building against them. Verify data before
importing it. Review changes before merging them. Build the smallest
reliable version first.**

The goal is not just to make a demo that works once. The goal is to
build a dependable platform that JEE students can trust.
