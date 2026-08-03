# manuelaX

Premium content platform. **Editors upload all photos and videos in Sanity Studio.** This repository never ships media assets.

## Phase 1 (current)

- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS v4 + shadcn-style UI primitives
- Dark / light theme (`next-themes`)
- Navbar, footer, branded home layout
- Prisma + Auth.js skeleton (SQLite locally — no Docker)
- Sanity schemas with **upload fields only** (no seeded media)
- Studio at `/studio` (requires Sanity project id)

## Requirements

- Node.js 20+
- pnpm recommended (`corepack enable` then `corepack prepare pnpm@9.15.9 --activate`)
- npm works for Phase 1 if pnpm is unavailable on PATH

## Setup

```bash
cd f:\manuelaX
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000

### Sanity (uploads)

1. Create a project at https://www.sanity.io/manage
2. Copy project id into `.env` as `NEXT_PUBLIC_SANITY_PROJECT_ID`
3. Restart `npm run dev`
4. Open http://localhost:3000/studio
5. Upload thumbnails/videos only through Studio

### Database note

Phase 1 uses **SQLite** so Windows development needs Node only (no Docker).  
Production target remains **PostgreSQL (Neon/Supabase)** — switch Prisma `provider` + `DATABASE_URL` before Ubuntu deploy.

## Architecture decisions

| Decision | Why |
|---|---|
| Media only via Sanity | Editors own uploads; frontend never embeds binaries |
| SQLite in Phase 1 | Zero Docker on Windows; same Prisma models map to Postgres later |
| Route groups `(site)` vs `studio` | Studio is full-bleed without marketing chrome |
| Auth stub | Adapter + roles ready; credentials verification in Phase 3 |

## Folder map

```
app/            routes (site, studio, api)
components/     UI + layout
features/       feature modules (later phases)
hooks/          shared hooks
services/       server/domain services
lib/            auth, db, sanity, utils
sanity/         CMS schemas
prisma/         database schema + migrations
types/          shared types
emails/         transactional templates (Phase 3+)
```
