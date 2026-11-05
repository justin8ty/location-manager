# Location Manager

Manage your own locations on an interactive map. Specification and design decisions: [SPEC.md](./SPEC.md).

## Setup

Requires Node.js 24+, pnpm 12 and Docker.

```bash
pnpm install
cp .env.example .env        # set JWT_SECRET to a random string of 32+ characters
docker compose up -d db
pnpm db:migrate
pnpm dev                    # http://localhost:5173
```

Without Docker, create `locations` and `locations_test` databases on your own PostgreSQL server and point `DATABASE_URL` and `TEST_DATABASE_URL` in `.env` at them.

### Dockerized backend

```bash
docker compose up -d --build
pnpm db:migrate
pnpm --filter ./client dev
```

### Tests

```bash
docker compose up -d db
pnpm test
```

## Usage

1. Register, or log in.
2. On **Map**, add locations with the form, or click the map to fill in coordinates. Click a marker to see, edit or delete it.
3. On **Upload**, upload a ZIP containing one `.txt` file of locations. Try [`samples/locations.zip`](./samples/locations.zip); the format is in [SPEC.md](./SPEC.md#txt-format).
4. Log out from the sidebar.
