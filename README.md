# manuelaX

Adult creator platform built with Next.js 15, PostgreSQL, Sanity CMS, and CCBill billing.

## Stack

- **App:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4
- **Auth:** Auth.js (credentials, email verification, 2FA)
- **Database:** PostgreSQL via Prisma
- **CMS:** Sanity Studio at `/studio` (catalog media uploads)
- **Billing:** CCBill (platform subscriptions + creator PPV/tips/subscriptions)
- **Age gate:** Self-attestation in dev; optional strict Veriff ID verification in production

## Requirements

- Node.js 20+
- PostgreSQL (`DATABASE_URL`)
- pnpm recommended (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)

## Setup

```bash
npm install
cp .env.example .env   # if present — otherwise configure .env manually
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000

### Sanity

1. Create a project at https://www.sanity.io/manage
2. Set `NEXT_PUBLIC_SANITY_PROJECT_ID` (and dataset) in `.env`
3. Open http://localhost:3000/studio to manage catalog content

### Local billing (no CCBill)

```env
BILLING_DEV_MODE=true
```

Enables instant platform and creator checkout for development.

### Production billing (CCBill)

```env
CCBILL_ACCOUNT=...
CCBILL_SUBACCOUNT=...
CCBILL_SALT=...
CCBILL_FLEXFORM_ID=...
CCBILL_WEBHOOK_SECRET=...
CCBILL_CREATOR_ONETIME_FLEXFORM_ID=...   # PPV + tips
CCBILL_CREATOR_SUB_FLEXFORM_ID=...       # creator subscriptions
```

Webhooks: `POST /api/webhooks/ccbill`

### Age verification (optional strict mode)

```env
AGE_VERIFICATION_PROVIDER=veriff
AGE_VERIFICATION_API_KEY=...
AGE_VERIFICATION_WEBHOOK_SECRET=...
# AGE_VERIFICATION_STRICT=true
# AGE_VERIFICATION_ALLOW_SELF_ATTESTATION=true
```

Webhook: `POST /api/webhooks/veriff`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build:app` | Production build (no migrate) |
| `npm run build` | Build + migrate deploy |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |

## Key routes

| Route | Purpose |
|-------|---------|
| `/` | Home |
| `/verify-age` | Age gate |
| `/messages` | Direct + group chat |
| `/promotions` | Member posts + deals |
| `/posts/[id]` | Gated member content |
| `/creator/[slug]` | Creator profile |
| `/subscriptions` | Platform plans |
| `/creator-dashboard` | Creator tools |
| `/admin` | Moderation + users |

## Folder map

```
app/            App Router pages + API routes
components/     Shared UI
features/       Feature modules (chat, creator, compliance, …)
services/       Server/domain logic
lib/            Auth, billing helpers, compliance rules
prisma/         Schema + migrations
sanity/         CMS schemas
```

## Tests

```bash
npm run test
```

Covers age rules, access control, billing webhooks, and checkout intent parsing.

## Client handoff (no payment credentials required for delivery)

You can deliver this project **without** CCBill credentials or a live domain. The client configures those **after** they purchase the domain and open a merchant account.

### What you deliver

- Full source code + PostgreSQL migrations
- `.env.example` — template only; **no secrets**
- Working local/staging demo with `BILLING_DEV_MODE=true` (simulated checkout)
- Age gate via date-of-birth (no Veriff keys required for demo)

### What the client configures later

| When | Client action |
|------|----------------|
| **Before first deploy** | PostgreSQL database, `AUTH_SECRET`, email SMTP, Sanity project |
| **When domain is purchased** | Set `NEXT_PUBLIC_APP_URL`, DNS → hosting (Vercel/VPS), SSL |
| **When ready to accept money** | CCBill merchant account + flex forms + webhook URLs; set `BILLING_DEV_MODE=false` |
| **Optional (compliance)** | Veriff age verification keys; 2257/KYC processes (not in app yet) |

### Demo mode for client review (recommended)

```env
DATABASE_URL=...
AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
BILLING_DEV_MODE=true
```

With this setup the client can:

- Browse the site after age verification (DOB)
- Register, log in, use messages, creator dashboard
- Test PPV / tips / subscriptions — payments complete instantly in demo mode
- Review UI/UX without real card processing

**Important:** Set `BILLING_DEV_MODE=false` and configure CCBill **before** accepting real payments. Creator payment buttons stay disabled in production until CCBill creator flex forms are set.

### Domain placeholder

Until the client owns a domain, use:

- **Local:** `http://localhost:3000`
- **Staging:** Vercel/Netlify preview URL (e.g. `https://manuelax-staging.vercel.app`)

Update `NEXT_PUBLIC_APP_URL` once the production domain is live. Webhooks (CCBill, Veriff) must use the final HTTPS URL.

### Pre-launch checklist for the client

1. Purchase domain + point DNS to host
2. Provision PostgreSQL + run `npx prisma migrate deploy`
3. Create Sanity project + add catalog content in `/studio`
4. Configure transactional email (`EMAIL_SERVER`, `EMAIL_FROM`)
5. Open CCBill account; create flex forms; add env vars; register webhooks
6. Turn off demo billing: remove or set `BILLING_DEV_MODE=false`
7. Run staging QA (see conversation / project docs)
8. Go live
