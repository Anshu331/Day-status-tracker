# Day Status Tracker

Small full-stack app for logging how each day of the year went.

- `/manage` (login required) - a grid with days 1-31 as rows and Jan-Dec as columns. Click a cell to add, edit or delete that day. Dates that don't exist (Feb 30, Apr 31, Feb 29 in non-leap years) are disabled.
- `/` (public) - a month calendar. Pick a day to see its entry. Anyone can view; only signed-in users get the edit form.

Stack: Next.js 15 + React 19 + Tailwind, Express 5 + TypeScript, PostgreSQL on Neon (`pg`), JWT cookie auth, Zod, Vitest.

## Running locally

Needs Node 20+ and a Postgres database (I used a free Neon project; any Postgres 13+ works).

```bash
npm install
npm run setup    # creates backend/.env and frontend/.env.local, generates a JWT secret
```

Put your connection string in `backend/.env`:

```
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=verify-full
```

Then:

```bash
npm run dev
```

The app runs on http://localhost:3000 and the API on http://localhost:4000. Tables are created on startup, and if there are no users yet an `admin` / `Admin@12345` account is created from `SEED_ADMIN_*`.

To add another user:

```bash
npm run user:create -- --username alice --password "some-password"
```

Other scripts: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and `npm start`.

## API

Responses are `{ "data": ... }` on success and `{ "error": { "code", "message" } }` on failure.

```
POST   /api/auth/login        { username, password } -> sets session cookie
POST   /api/auth/logout
GET    /api/auth/me                                       (auth)
GET    /api/entries?from=YYYY-MM-DD&to=YYYY-MM-DD         max 366 days
GET    /api/entries/:date                                 404 if empty
PUT    /api/entries/:date     { status, note? }           (auth) 201 created / 200 updated
DELETE /api/entries/:date                                 (auth)
GET    /api/health
```

`status` is one of `great`, `good`, `okay`, `bad`, `off`; `note` is optional, up to 1000 characters.

## Design choices

**Stack.** Next.js handles the UI and Express is a separate REST API, so the API can be tested and deployed on its own. I used PostgreSQL because the data is relational and the schema can enforce valid dates and statuses. Neon gives a hosted Postgres with no local install.

**Backend.** Each module (`auth`, `entries`) is split into routes, controller, service and repository, wired together in `container.ts`. `createApp()` has no side effects, so tests can build the real app against a test database. Input is validated with Zod, and errors go through a single error handler.

**Database.** There are two tables, `users` and `day_entries`, with the date as the primary key of `day_entries`. Status and note length are also enforced with CHECK constraints. `PUT` is a single `INSERT ... ON CONFLICT DO UPDATE`, and `xmax = 0` tells whether the row was inserted, which is how the API picks 201 or 200. Dates are read with `to_char` and passed around as `YYYY-MM-DD` strings, so timezones can't shift a day. Migrations run on startup in a transaction with an advisory lock.

**Auth.** The JWT is stored in an httpOnly, SameSite=Lax cookie (Secure in production). Next.js proxies `/api/*` to Express, so the browser only talks to one origin and CORS isn't needed. Passwords use bcrypt, and login is rate limited per IP. The Next middleware only redirects logged-out users away from `/manage`; the API checks the session on every write.

**Short months.** The grid always has 31 rows. Cells for dates that don't exist are shown greyed out and can't be clicked, which keeps the table layout fixed. Feb 29 is only enabled in leap years. The API rejects these dates too, so the rule doesn't depend on the UI.

**Frontend.** Folders are organised by feature (viewer, data-input, entries, auth). TanStack Query handles fetching and cache invalidation. The layout is responsive: the viewer stacks on mobile, and the 12-month grid scrolls sideways with a sticky header and day column. The selected date and year are kept in the URL (`/?date=2026-10-08`, `/manage?year=2025`). The calendar works with the keyboard (arrow keys and PageUp/PageDown). Anything based on "today" renders after mount to avoid hydration mismatches.

**Tests.** The backend has 50 tests covering auth, CRUD, validation (leap years, invalid dates, unknown fields), rate limiting and migrations. They run against PGlite (Postgres in WASM) through the same `pg` driver, so no database setup is needed.

## Assumptions

- There is one shared entry per date. Any logged-in user can edit it, and the last editor is shown.
- A day's data is a status from a fixed list plus an optional note.
- The grid shows one year at a time, for years 1900-2100.
- There is no sign-up page; users are created with `npm run user:create`.
- Weeks start on Sunday, and sessions last 8 hours (`JWT_TTL_SECONDS`).
