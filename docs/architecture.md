# Cutoff architecture

React + Vite → Express → Prisma Client → PostgreSQL on Supabase.
React signs in through Supabase Auth. Express verifies the bearer token with
Supabase before any student request. Passwords belong to Supabase Auth only.

The database uses the normalized 16-table coursework model. The deliberate
Auth change is `cutoff.users.user_id`: a UUID referencing `auth.users(id)`.
The profile has a name and timestamps; email and password are managed by Auth.

The browser cannot read the private `cutoff` schema. Express checks ownership,
locks an attempt before saves/submission, and calculates results after submission.
Only a trusted local import script can write questions or keys. Each import is
atomic; published paper content is immutable through the app.

The MVP includes email auth, paper browsing, timed attempts, answer saving,
resume, review flags, submission, question review, history and grouped analytics.

## Following one answer from the browser to the database

1. Supabase Auth signs the student in. Express verifies the token and uses the student's UUID to check who owns the attempt.
2. Prisma maps JavaScript models to tables. For example, `db.test.findUnique({ where: { test_id: BigInt(testId) } })` reads one row from `cutoff.tests`. The ID comes back to the browser as a string so large IDs keep their precision.
3. When the student changes an answer, `tx.answer.upsert()` creates the answer on the first save and updates it on later saves. Prisma groups the answer and its selected options in one transaction.
4. Saving and submitting both lock the attempt row through Prisma. If they arrive together, one finishes before the other checks the attempt status. PostgreSQL supplies the clock for the deadline.
5. When the student opens a submitted result, the server reads the answer key and calculates the score. During the exam the question query leaves the key and explanation out.

The model definitions live in `prisma/schema.prisma`. The migration command applies the existing SQL through Prisma and records each file once. SQL defines database-specific rules such as row locks, triggers and the index allowing one active attempt per student and paper.
