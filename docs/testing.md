# Testing Cutoff

## Fast checks

```bash
npm test
npm run build
npm run format:check
```

Unit tests cover exact-set scoring, numeric zero and inclusive ranges, skipped
answers, negative marks, empty accuracy, grouped names, and malformed inputs.

## Database integration

Create a disposable **local** PostgreSQL database whose name starts with
`cutoff_test`. The test runner refuses remote or differently named databases.
It creates a minimal `auth.users` table and browser roles locally so the real SQL
migrations can be exercised. Do not point it at your Supabase project.

```bash
createdb cutoff_test_app
TEST_DATABASE_URL=postgresql://YOUR_LOCAL_USER@127.0.0.1:5432/cutoff_test_app npm run test:integration
```

Use a local role permitted to create the test roles. The tests use unique fixture
IDs and may be rerun without deleting existing test data. This is test data only.

The API suite tests ownership, authentication rejection, catalogue filters, safe
question delivery, concurrent starts, full answer replacement and rollback,
scoring, repeat attempts, timeout persistence, read restrictions, and submission
waiting for a save transaction. It uses real PostgreSQL, not mocked SQL.

## Browser checks

```bash
npx playwright install chromium
TEST_DATABASE_URL=postgresql://YOUR_LOCAL_USER@127.0.0.1:5432/cutoff_test_app npm run test:e2e
```

Playwright starts an isolated API on 3001 and Vite on 5175. It uses a test-only
injected token verifier and fixture session. Production `src/server.js` always
uses Supabase verification. No environment switch disables real authentication.

The browser suite checks desktop/mobile layouts, signup navigation, choosing
answers, autosave, refresh/resume, multiple selections, review flags, zero input,
submission, analytics, review filters, and recovery from failed saves.
Screenshots and traces are saved under ignored `test-results/`.

These tests do **not** establish that live Supabase confirmation/reset emails work.
Follow the live journey in `docs/setup.md` once credentials are configured.

## End-to-end email and practice check

On 19 November 2026 the built React app and Express API were also tested with
Supabase Auth (GoTrue), PostgreSQL and a Mailpit inbox running locally. A fresh
student followed the confirmation email, opened the starter paper, saved an
answer, reloaded and submitted it. The result showed the expected accuracy.
The same student signed out, followed a recovery email and signed in with the new
password. The old password was rejected. A protected attempt-history link
returned the student to their history after sign-in.

The hosted Supabase project passed the Auth settings and database health checks.
External email delivery from that project still needs a test with a real inbox.
