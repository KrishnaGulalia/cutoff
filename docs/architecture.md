# Cutoff architecture

React + Vite → Express → PostgreSQL on Supabase.
React signs in through Supabase Auth. Express verifies the bearer token with
Supabase before any student request. Passwords belong to Supabase Auth only.

Use plain JavaScript, named functions, ordinary SQL and small React components.
The database uses the normalized 16-table coursework model. The deliberate
Auth change is `cutoff.users.user_id`: a UUID referencing `auth.users(id)`.
The profile has a name and timestamps; email and password are managed by Auth.

The browser cannot read the private `cutoff` schema. Express checks ownership,
locks an attempt before saves/submission, and calculates results after submission.
Only a trusted local import script can write questions or keys. Each import is
atomic; published paper content is immutable through the app.

The MVP includes email auth, paper browsing, timed attempts, answer saving,
resume, review flags, submission, question review, history and grouped analytics.
Real historical papers, deployment and production email delivery follow later.
Demo content is original practice material, clearly labelled, never presented as JEE data.

The old six-model Prisma starter is replaced by versioned SQL migrations.
The coursework repository remains a separate submission; its Auth differences
must be reconciled deliberately before final coursework submission.
