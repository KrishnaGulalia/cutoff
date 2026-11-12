# Supabase setup

## 1. Create the project

Create a Supabase project and keep its database password. Email/password Auth is
the only sign-in method needed for this MVP. Keep email confirmation enabled.
No service-role key or custom JWT secret is required by this application.

## 2. Fill the environment files

The root `.env` is for Express only:

```dotenv
DATABASE_URL=postgresql://postgres.PROJECT:ENCODED_PASSWORD@POOLER_HOST:6543/postgres
DIRECT_URL=postgresql://postgres.PROJECT:ENCODED_PASSWORD@POOLER_HOST:5432/postgres
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
PORT=3000
CLIENT_URL=http://localhost:5173
DATABASE_CA_FILE=
```

Copy the PostgreSQL URLs from the project's **Connect** panel. Express uses
`DATABASE_URL` for Prisma queries. This project uses Supabase's transaction
endpoint on port 6543. The migration command uses `DIRECT_URL`, configured
with the session endpoint on port 5432. Both URLs must point to the same project.
A direct PostgreSQL connection also works on networks that can reach it.
URL-encode special characters in the database password.

The Prisma PostgreSQL adapter verifies the server certificate. Set
`DATABASE_CA_FILE` to the path of the project's CA certificate when needed.
Keep credentials in the ignored environment files. Commit only blank examples.

The `client/.env.local` file is for Vite:

```dotenv
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_API_URL=
```

Use the same project URL and publishable key in both files. A legacy `anon` key
can also be used in the publishable-key field. Never put a secret/service-role key
or DATABASE_URL in a `VITE_` variable. Vite variables are visible to browsers.
Leave VITE_API_URL empty for the local proxy and same-origin production build.

## 3. Set Auth URLs

In Auth URL configuration:

- Site URL: `http://localhost:5173`
- Allowed redirect: `http://localhost:5173/**`

Confirmation returns to `/app`; password recovery returns to `/reset-password`.
Use the same hostname consistently; localhost and 127.0.0.1 are different origins.
When deployed, replace/add your real HTTPS URLs. For reliable production email,
configure your own SMTP provider and test delivery before inviting students.

## 4. Create the tables

```bash
npm run check:env
npm run db:migrate
npm run seed:demo
npm run dev
```

Migrations run in order and are recorded in `public.cutoff_migrations`.
Running the migration command again skips applied files. It does not drop or
reset an existing database. Use a fresh project if `cutoff` already contains an
incompatible experimental schema; do not delete shared data to force setup.

The tables are visible under schema **cutoff** in Supabase's table editor.
Keep that schema out of the Data API's exposed schemas. RLS and revoked browser
privileges are defense in depth; Express still checks ownership on every request.

The optional demo import runs once. Repeating it reports that the paper exists.
The normal app starts with an honest empty library if no data has been imported.

## 5. Check the live journey

1. Open http://localhost:5173 and create an account.
2. Confirm the email and sign in.
3. Open the demo paper, select an answer, wait for “All changes saved”, and refresh.
4. Resume, submit, and check the result and explanation.
5. Sign out. Check that `/app` returns to login.
6. Request a password-reset email and complete the reset link.
7. Confirm another account cannot access the first account's attempt URL.

`GET /api/health` checks the server; `/api/health/db` checks that the database
and application schema are reachable. Neither endpoint exposes connection details.

## Official references

- [Database connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Server token verification](https://supabase.com/docs/reference/javascript/auth-getuser)
