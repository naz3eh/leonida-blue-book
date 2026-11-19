# Leonida Blue Book

An unofficial, community-sourced price guide for stolen cars in GTA 6. Players report what they saw in game: the value the WAINK car-scanner app showed, what a fence paid, or what the fence Randy asked for. The site shows the median and range per car and source.

Rockstar has published no official prices, so every number here is a player report and is labeled that way. All amounts are in-game cash. There is no real-money trading of any kind.

Unofficial fan project. Not affiliated with Rockstar Games or Take-Two Interactive.

## Stack

Next.js 15 (App Router, React 19, strict TypeScript), Tailwind CSS 4 and shadcn/ui, Neon Postgres with Drizzle ORM, Vercel Blob for screenshots, Cloudflare Turnstile, Upstash Redis rate limiting, Zod, Vitest and Playwright. Package manager: pnpm.

## How the numbers work

- Each car has separate stats for WAINK, fence and Randy reports.
- Fewer than 3 visible reports for a source: "Not enough reports yet" and the count, no median.
- 3 or more: the median is shown. With 3 or 4 reports, low and high are the plain min and max.
- 5 or more: low and high leave out values outside 1.5 × IQR. The median always uses every visible report.
- Car pages default to the last 30 days, with an all-time toggle.
- New car names go into a pending queue and appear publicly after an admin approves them.

## Local setup

Requirements: Node 20+, pnpm 9+, and a Postgres database (local Docker or a Neon branch).

```bash
pnpm install
cp .env.example .env.local      # then fill in the values below
pnpm db:migrate                 # creates the tables
pnpm dev                        # http://localhost:3000
```

A local Postgres in Docker:

```bash
docker run -d --name lbb-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine
# DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
```

For local development you can use Cloudflare's test Turnstile keys (site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`), leave the Upstash variables empty (the rate limit then counts rows in Postgres), and set `LOCAL_UPLOADS=1` to keep screenshots in `.local-uploads/` instead of Vercel Blob.

## Environment variables

Every variable below is listed in `.env.example`.

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled Postgres connection string. Set by the Neon integration. |
| `DATABASE_URL_UNPOOLED` | no | Direct Neon connection string. `pnpm db:migrate` prefers it when set. Set by the Neon integration. |
| `NEXT_PUBLIC_SITE_URL` | yes | Public URL without a trailing slash, e.g. `https://leonida-blue-book.vercel.app`. Used for canonical and OG image URLs. |
| `BLOB_READ_WRITE_TOKEN` | yes on Vercel | Vercel Blob token for screenshot uploads. Set when you connect a Blob store. Without it (and without `LOCAL_UPLOADS`) the screenshot field is hidden. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | yes | Cloudflare Turnstile site key. |
| `TURNSTILE_SECRET_KEY` | yes | Cloudflare Turnstile secret key, verified on the server. |
| `UPSTASH_REDIS_REST_URL` | yes on Vercel | Upstash Redis REST URL for the 5-reports-per-hour limit. `KV_REST_API_URL` is accepted too. |
| `UPSTASH_REDIS_REST_TOKEN` | yes on Vercel | Upstash Redis REST token. `KV_REST_API_TOKEN` is accepted too. |
| `IP_HASH_SALT` | yes | Long random string. IPs are stored only as SHA-256(ip + salt); raw IPs are never saved. |
| `ADMIN_TOKEN` | yes | Long random string (12+ characters) used to sign in at `/admin`. |
| `LOCAL_UPLOADS` | no | Local development only. `1` saves screenshots to `.local-uploads/` when `BLOB_READ_WRITE_TOKEN` is empty. Leave unset on Vercel. |

Generate the two random strings with `openssl rand -hex 32`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright end-to-end tests (see below) |
| `pnpm db:generate` | Generate a new migration after editing `db/schema.ts` |
| `pnpm db:migrate` | Apply migrations in `db/migrations` to `DATABASE_URL_UNPOOLED` or `DATABASE_URL` |

## End-to-end tests

The Playwright suite runs against a production build with Turnstile's always-pass test keys and a throwaway Postgres database. It truncates the `cars` and `reports` tables first, so never point it at real data.

```bash
docker exec lbb-pg createdb -U postgres lbb_test
pnpm exec playwright install chromium
pnpm build
E2E_DATABASE_URL=postgres://postgres:postgres@localhost:5432/lbb_test pnpm test:e2e
```

`E2E_DATABASE_URL` defaults to the URL above. Set `E2E_UPSTASH_REDIS_REST_URL` and `E2E_UPSTASH_REDIS_REST_TOKEN` to test against a real Upstash database instead of the Postgres fallback.

## Deploy to Vercel

1. **Import the repo.** In Vercel, choose Add New → Project, import `naz3eh/leonida-blue-book`, keep the detected Next.js preset, and leave the build and install commands at their defaults (`pnpm` is picked up from `pnpm-lock.yaml`). Don't deploy yet, or let the first deploy fail; you'll redeploy after adding storage.
2. **Add Neon.** Project → Storage → Create Database → Neon (Marketplace). Connect it to the project for all environments. This sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. **Add Upstash Redis.** Project → Storage → Create Database → Upstash for Redis (Marketplace), and connect it. The integration sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which the app reads. If you set up Upstash yourself instead, add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the Upstash console.
4. **Create a Blob store.** Project → Storage → Create Database → Blob, and connect it. This sets `BLOB_READ_WRITE_TOKEN`. Screenshots are uploaded as public blobs.
5. **Create Turnstile keys.** In the Cloudflare dashboard, Turnstile → Add widget, mode Managed, and add your Vercel domain (e.g. `leonida-blue-book.vercel.app`, plus any custom domain). Copy the site key and secret key.
6. **Add the other variables** in Project → Settings → Environment Variables (Production, and Preview if you use it):
   - `NEXT_PUBLIC_SITE_URL` = your production URL, no trailing slash
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = Turnstile site key
   - `TURNSTILE_SECRET_KEY` = Turnstile secret key
   - `IP_HASH_SALT` = output of `openssl rand -hex 32`
   - `ADMIN_TOKEN` = output of `openssl rand -hex 32`
   - Leave `LOCAL_UPLOADS` unset.
7. **Migrations run on deploy.** Production builds use the `vercel-build` script (`scripts/vercel-build.sh`), which runs `pnpm db:migrate` before `next build`. The build fails with a clear message if `DATABASE_URL` is missing. Preview builds skip migrations. To migrate by hand instead:
   ```bash
   pnpm install
   pnpm dlx vercel link
   pnpm dlx vercel env pull .env.local --environment=production
   pnpm db:migrate
   ```
8. **Deploy.** Deployments → Redeploy (or push to `main`). Then open `/admin`, sign in with `ADMIN_TOKEN`, and approve cars as reports come in.

## License

MIT. See `LICENSE`.
