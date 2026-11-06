# Location Manager Spec

Full-stack app where authenticated users manage their own locations: add them manually or via ZIP upload, and view them on an interactive map. Source brief: `JustNaik Technical Assessments.md`.

## Stack

| Area | Choice |
| --- | --- |
| Repo | pnpm workspaces: `client/`, `server/`, `packages/shared/` |
| Frontend | Vite, React, TypeScript, TanStack Router, TanStack Query |
| UI | Tailwind CSS, Kumo (`@cloudflare/kumo`) |
| Map | Leaflet, react-leaflet, OpenStreetMap tiles |
| Backend | Node.js, Express, TypeScript, Drizzle ORM |
| Database | PostgreSQL (Docker locally, Neon in production) |
| Auth | JWT (`jose`) in httpOnly cookie, argon2id |
| Validation | zod (schemas shared by client and server) |
| Upload | multer, fflate |
| Tests | Vitest, Supertest |

## Pages and Navigation

| Route | Access | Purpose |
| --- | --- | --- |
| `/register` | Public | Create account |
| `/login` | Public | Sign in |
| `/map` | Protected | Map, add-location form, markers |
| `/upload` | Protected | ZIP upload |

- Protected routes redirect unauthenticated visitors to `/login?redirect=<path>`; after login, return to `redirect` (default `/map`).
- Authenticated visitors to `/login` or `/register` are redirected to `/map`.
- `/` redirects to `/map`.
- Protected pages share a layout with a sidebar: Map, Upload, Logout. The sidebar collapses on mobile.
- Any API `401` clears the auth state and redirects to `/login`.

## Features

### Auth

- Register with email + password (password min 8 chars, email unique, case-insensitive). On success the user is logged in.
- Login with email + password. The error message is generic ("Invalid email or password").
- Logout clears the cookie and cached client data.
- Session: 7-day JWT. If a valid token is more than 3.5 days old, the server re-issues it on any authenticated request.
- Cookie: `token`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production, `Max-Age` 7 days.
- Auth endpoints are rate-limited.

### Data Privacy

- Every location query is scoped by `userId` from the verified JWT. The client never sends `userId`.
- Accessing another user's location returns `404` (not `403`), so the API doesn't reveal that the location exists.

### Map

- Form fields: name (1–100 chars, trimmed), latitude (−90..90), longitude (−180..180), icon (optional).
- Icon: one of `pin`, `home`, `work`, `food`, `cafe`, `shop`, `park`, `nature`, `animals`, `temple`, `mosque`, `landmark`. When a location is created without one, the server sets `suggestLocationIcon(name)` (shared package; rules in `DESIGN.md` → Icons), which falls back to `pin`. Renaming doesn't change the icon.
- On submit the marker appears without a page reload. The map flies to it and opens its popup.
- Clicking an empty map spot fills the latitude/longitude fields and shows a faded preview marker.
- Clicking a marker shows a popup with the name, an edit button, and a delete button. Delete asks for confirmation in a dialog.
- Edit puts the add-location form into edit mode, prefilled. Map-click-to-fill works in edit mode too. Save updates the marker in place; Cancel returns to add mode. Markers aren't draggable.
- Build order: edit is built after all required features are done and tested.
- Initial view: if the user has no locations, centre on Kuala Lumpur (`3.139, 101.6869`) at zoom 11. Otherwise fit bounds to all markers.
- After an upload, the next map view fits bounds to all markers.

### File Upload

- Accepts one `.zip` file, max 5 MB.
- After ignoring directory entries, `__MACOSX/` entries and `.DS_Store` files, the ZIP must contain exactly one file, and it must have a `.txt` extension. Any other file alongside it is an error. The file may sit in a subfolder.
- Text file: UTF-8, max 1 MB uncompressed. The size is checked from entry metadata before decompressing (zip-bomb guard).
- On success: success toast for 3 s, then the locations query is invalidated so the markers appear on the map. The toast offers a "View on map" link.
- On any error: error toast for 3 s with the reason.
- Upload is all-or-nothing. Any invalid row rejects the whole file and nothing is saved.
- Each uploaded location gets the icon suggested by its name. The TXT format has no icon field.

#### TXT Format

```text
Name, Latitude, Longitude
Suria KLCC,3.157324409,101.7121981
Zoo Negara,3.21054160,101.75920504
```

Parsing rules:

| Case | Behaviour |
| --- | --- |
| UTF-8 BOM | Stripped before parsing |
| Header row | Optional. The first non-blank line is skipped if its last two fields aren't numbers |
| Whitespace around fields | Trimmed |
| Blank lines, `\r\n` line endings | Ignored / normalised |
| Name contains commas (`Pavilion, Bukit Bintang,3.149,101.713`) | The last two fields are lat/lng; the rest (rejoined) is the name |
| Fewer than 3 fields | Row error |
| Non-numeric or out-of-range lat/lng | Row error |
| Empty name or name > 100 chars | Row error |
| No data rows | Error `NO_LOCATIONS` |

Row errors are reported with line numbers from the original file (blank and header lines still count; first 5 shown), e.g. `Line 3: latitude 300 is out of range (−90 to 90)`.

### Loading and Error States

- Buttons show a loading state and are disabled while their request is pending.
- The map page shows a loader until locations load. An empty state appears when the user has no locations.
- Form validation errors are shown inline, using the shared zod schemas.
- Network/server errors are shown as an error toast or inline banner. A failed locations fetch offers a retry.

## API

Base path `/api`. JSON unless noted. Every route except register/login requires a valid cookie.

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ email, password }` | `201 { user }` + cookie |
| POST | `/auth/login` | `{ email, password }` | `200 { user }` + cookie |
| POST | `/auth/logout` | — | `204`, cookie cleared |
| GET | `/auth/me` | — | `200 { user }` |
| GET | `/locations` | — | `200 { locations }` |
| POST | `/locations` | `{ name, latitude, longitude, icon? }` | `201 { location }` |
| PATCH | `/locations/:id` | `{ name?, latitude?, longitude?, icon? }` (at least one field) | `200 { location }` |
| DELETE | `/locations/:id` | — | `204` |
| POST | `/locations/upload` | multipart, field `file` | `201 { count, locations }` |
| GET | `/health` | — | `200 { ok: true }` |

`user` = `{ id, email }`. `location` = `{ id, name, latitude, longitude, icon, createdAt }`.

Error shape (all errors):

```json
{ "error": { "code": "INVALID_ROWS", "message": "…", "details": ["Line 3: …"] } }
```

| Code | Status | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body fails zod schema |
| `UNAUTHENTICATED` | 401 | Missing/invalid/expired token |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `EMAIL_TAKEN` | 409 | Register with existing email |
| `NOT_FOUND` | 404 | Location missing or not owned |
| `FILE_REQUIRED` | 400 | No file in upload |
| `NOT_ZIP` | 400 | Extension or `PK\x03\x04` magic bytes don't match |
| `FILE_TOO_LARGE` | 413 | ZIP > 5 MB or TXT > 1 MB uncompressed |
| `INVALID_ZIP_CONTENTS` | 400 | Not exactly one `.txt` file |
| `NOT_UTF8` | 400 | TXT isn't valid UTF-8 |
| `INVALID_ROWS` | 400 | One or more rows invalid |
| `NO_LOCATIONS` | 400 | No data rows |
| `RATE_LIMITED` | 429 | Too many auth attempts |
| `INTERNAL_ERROR` | 500 | Unexpected error |

## Data Model

```ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(), // stored lowercase
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    icon: varchar("icon", { length: 20 }).$type<LocationIcon>().notNull().default("pin"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("locations_user_id_idx").on(t.userId)],
);
```

Duplicate locations are allowed. `icon` is validated by the shared zod enum, not a database constraint, so adding an icon needs no migration. Rows that existed before the column was added have `pin`.

## Project Structure

```text
client/
  src/
    routes/                   # TanStack Router file routes (_auth layout guards protected pages)
    features/auth|locations|upload/
    components/               # shared UI (layout, sidebar)
    lib/api.ts                # fetch wrapper, error parsing
server/
  drizzle/                    # generated SQL migrations
  drizzle.config.ts
  src/
    db/schema.ts              # Drizzle schema
    app.ts                    # express app (exported for tests)
    index.ts                  # starts the server
    routes/ middleware/ services/
    services/upload/          # zip extraction + txt parser (pure, unit-tested)
  Dockerfile
packages/shared/              # zod schemas + inferred types
docker/postgres-init.sql      # creates the locations_test database
docker-compose.yml            # postgres (+ server)
```

## Environment

| Var | Where | Example |
| --- | --- | --- |
| `DATABASE_URL` | server | `postgresql://postgres:postgres@localhost:5432/locations` |
| `TEST_DATABASE_URL` | server tests | `postgresql://postgres:postgres@localhost:5432/locations_test` |
| `JWT_SECRET` | server | random 32+ bytes |
| `PORT` | server | `3000` |
| `NODE_ENV` | server | `development` / `production` |

In local development, Vite proxies `/api` to `http://localhost:3000`.

## Testing

- Unit: TXT parser (every case in the parsing rules table), ZIP validation (zero, two, or non-txt files; `__MACOSX` ignored; oversize), and icon suggestion (rule order, word matching).
- Integration (Supertest + test DB): auth middleware (no cookie, bad token, sliding re-issue) and per-user scoping (user B can't list, edit, or delete user A's locations).
- Test DB: a real PostgreSQL database `locations_test` on the Docker Postgres, created by `docker/postgres-init.sql`. Vitest `globalSetup` runs the Drizzle migrations once; tables are truncated between tests; test files run sequentially (`fileParallelism: false`).
- Running: `docker compose up -d db`, then `pnpm test`.

## Deployment (not implemented)

To deploy: Cloudflare Pages (+ Pages Function) proxying `/api/*` to Google Cloud Run (`API_ORIGIN`), and Neon hosts PostgreSQL. Deploying would need these changes:

- **Proxy:** `client/functions/api/[[path]].ts` forwards method, headers (incl. cookie) and body to `API_ORIGIN`, and sets `X-Forwarded-For` from `CF-Connecting-IP`.
- **Client IP:** a `TRUST_PROXY` hop count (2: Cloudflare + Google) passed to `app.set("trust proxy", …)`. Without it every visitor shares one rate-limit bucket.
- **Migrations:** run `DATABASE_URL=<neon url>?sslmode=require pnpm db:migrate` before each deploy.
- **Shutdown:** on `SIGTERM`, stop accepting connections, finish in-flight requests, close the DB pool (Cloud Run allows ~10 s).
- **Config:** Cloud Run sets `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `TRUST_PROXY` (`PORT` is provided). Pages builds with `pnpm --filter ./client build` into `client/dist`, with `API_ORIGIN` set.
- **Limit:** the rate limiter is in-memory, so it is per instance; more than one instance needs a shared store (e.g. Redis).

## Deliverables

- GitHub repo with README: setup (Docker and non-Docker), usage with the sample ZIP, and a link to design decisions.
- Dockerised backend.

---

## ADRs

### ADR-1: Vite SPA, not Next.js
- **Decision:** Vite + React SPA.
- **Why:** The backend must be Express anyway. Next.js would add a second server, and Leaflet breaks during SSR (it needs `window`).
- **Trade-off:** No SSR/SEO, which a private app doesn't need.

### ADR-2: TanStack Query for server state, no global store
- **Decision:** All server data (user, locations) lives in TanStack Query. Zustand is added only if cross-page UI state appears.
- **Why:** With cookie auth, "logged in" is just the `/auth/me` query. Redux/Zustand would duplicate server state.
- **Trade-off:** Auth state is async (needs a loading state on first load).

### ADR-3: Express + Drizzle + PostgreSQL
- **Decision:** Drizzle ORM on PostgreSQL.
- **Why:** Schema in plain TS and SQL-like typed queries. No generated client or codegen step. Small footprint, faster cold starts. First-class Neon support.

### ADR-4: JWT in httpOnly cookie behind a same-origin proxy
- **Decision:** Store the JWT in an `HttpOnly; SameSite=Lax` cookie. In production a Pages Function proxies `/api/*` to Cloud Run; in development the Vite proxy does the same.
- **Why:** XSS can't read the token, so it can't be exfiltrated (damage is limited to the open tab). Same-origin keeps the cookie first-party (no third-party cookie blocking) and removes the need for CORS.
- **Trade-off:** Needs a `/auth/me` endpoint, a logout endpoint and the proxy function (~15 lines, Workers free tier). `SameSite=Lax` is relied on for CSRF protection, with no CSRF tokens.

### ADR-5: 7-day sliding session, no refresh tokens
- **Decision:** A single 7-day JWT, re-issued when older than 3.5 days.
- **Why:** Active users never get logged out, with no refresh-token table, rotation or 401-retry logic.
- **Trade-off:** Tokens can't be revoked before expiry, and a stolen token works for up to 7 days (mitigated by httpOnly).

### ADR-6: In-memory upload, fflate, hard limits
- **Decision:** multer memory storage (5 MB). fflate's filter checks entry names and uncompressed size before decompressing (1 MB TXT cap). Magic bytes are checked.
- **Why:** No temp files to clean up. Guards against zip bombs and spoofed mimetypes. fflate is pure JS and fast.
- **Trade-off:** Whole file in memory, which is fine at 5 MB.

### ADR-7: All-or-nothing upload
- **Decision:** Any invalid row rejects the whole file (single DB transaction). Line-numbered errors are reported, first 5 shown.
- **Why:** Predictable. Re-uploading a fixed file never creates duplicates.
- **Trade-off:** One bad row blocks a large file.

### ADR-8: Lenient TXT parsing
- **Decision:** Header optional, fields trimmed, blank lines and CRLF tolerated. The last two fields are lat/lng, so names may contain commas.
- **Why:** Real-world files are messy, and names like "Pavilion, Bukit Bintang" are common.
- **Trade-off:** A malformed row can be read as a name with commas; range and number validation catches most such cases.

### ADR-9: Real PostgreSQL for integration tests
- **Decision:** Integration tests run against a `locations_test` database on the Docker Postgres, not an in-process substitute (PGlite).
- **Why:** Tests exercise the production driver (`node-postgres`), transactions and error codes. No test-only driver seam. Docker is already required to run the app.
- **Trade-off:** `pnpm test` needs the Postgres container running.
