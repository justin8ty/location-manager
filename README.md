# JustNaik Places Manager

Manage your own locations on an interactive map: add them by hand or by uploading a ZIP file.

Stack: React (Vite, TanStack Router + Query, Tailwind, react-leaflet), Express, PostgreSQL (Drizzle), JWT in an httpOnly cookie. Dockerised backend is implemented.

Specification and design decisions (ADRs): [SPEC.md](./SPEC.md).

## Setup

Requires Node.js 24+, pnpm 12 and Docker.

```bash
pnpm install
cp .env.example .env
```

Before proceed, set JWT_SECRET to a random string in `.env`. Generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.

Then start the database and API in Docker and run:

```bash
docker compose up -d --build
pnpm db:migrate
pnpm --filter ./client dev
```

Open http://localhost:5173.

The API container runs in production mode, so the session cookie is `Secure`. Chrome and Firefox accept it on `http://localhost`; Safari may not.

## Usage

1. Register, or log in.
2. On **Map**, browse your places: search them, filter by category, and click a marker to see, edit or delete it.
3. Add a place with the form, which fills in coordinates when you click the map. On a phone, use the **Add place** tab: pan the map under the crosshair and tap **Add here**.
4. On **Import**, upload a ZIP containing one `.txt` file of locations. You can try uploading this file: [`samples/locations.zip`](./samples/locations.zip); the format is in [SPEC.md](./SPEC.md#txt-format).
5. Log out from the rail (the tab bar on mobile).

## Mobile

This is optional as it requires extra configuration. The app is mobile optimized, so you can try it on a phone over [Tailscale](https://tailscale.com) (HTTPS is needed, because the session cookie is `Secure`):

1. Enable HTTPS certificates for your tailnet in the Tailscale admin console (DNS).
2. Add your computer's name, such as `my-pc.tailnet-name.ts.net`, to `server.allowedHosts` in `client/vite.config.ts`.
3. With the app running, run `tailscale serve --bg 5173`.
4. On the phone, which must be on the same tailnet, open `https://my-pc.tailnet-name.ts.net`.

Stop sharing with `tailscale serve off`.

## Dev

```bash
pnpm test          # needs `docker compose up -d db`
pnpm lint
pnpm typecheck
```

Changing server code? Run `docker compose up -d db` and `pnpm dev` for hot reload, instead of rebuilding the API container.
