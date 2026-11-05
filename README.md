# Location Manager

Manage your own locations on an interactive map: add them by hand or by uploading a ZIP file.

Stack: React (Vite, TanStack Router + Query, Tailwind, react-leaflet), Express, PostgreSQL (Drizzle), JWT in an httpOnly cookie.

## Setup

Requires Node.js 24+, pnpm 12 and Docker.

```bash
pnpm install
cp .env.example .env     # set JWT_SECRET to a random string of 32+ characters
```

Then run the app one of two ways, and open http://localhost:5173.

### Option A: Docker backend

```bash
docker compose up -d --build
pnpm db:migrate
pnpm --filter ./client dev
```

The API container runs in production mode, so the session cookie is `Secure`. Chrome and Firefox accept it on `http://localhost`; Safari may not.

### Option B: run locally

```bash
docker compose up -d db
pnpm db:migrate
pnpm dev
```

Without Docker, create `locations` and `locations_test` databases on your own PostgreSQL server, point `DATABASE_URL` and `TEST_DATABASE_URL` in `.env` at them, and skip the first command.

## Usage

1. Register, or log in.
2. On **Map**, add locations with the form, or click the map to fill in coordinates. Click a marker to see, edit or delete it.
3. On **Upload**, upload a ZIP containing one `.txt` file of locations. Try [`samples/locations.zip`](./samples/locations.zip); the format is in [SPEC.md](./SPEC.md#txt-format).
4. Log out from the sidebar.

## Dev

```bash
pnpm test          # needs `docker compose up -d db`
pnpm lint
pnpm typecheck
```

Specification and design decisions (ADRs): [SPEC.md](./SPEC.md).
