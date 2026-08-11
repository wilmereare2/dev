# manuelaX — Project Handoff

**Prepared for:** [Client name]  
**Delivery date:** [Date]  
**From:** [Your company / name]

---

## What you’re receiving

A complete adult creator platform, ready for review and staging. It includes:

- Member browsing, age verification, accounts, and settings
- Creator profiles, uploads, and dashboard
- Messaging (direct messages and groups)
- Promotions and member posts with paywall access control
- Platform subscriptions and creator monetization (PPV, tips, creator subscriptions)
- Admin tools for users, content moderation, and promotions

The **application code is complete** for this phase. What remains before public launch are **your** business accounts, domain, and content — not additional development from us.

---

## What you need to provide (not included in this delivery)

We do **not** need your payment or domain details to complete this handoff. You will configure these when you are ready:

| Item | When | Your action |
|------|------|-------------|
| **Domain name** | When you approve the site | Purchase domain, point DNS to your host |
| **Hosting** | Before staging/live | e.g. Vercel, VPS, or your preferred provider |
| **Database** | Before first deploy | PostgreSQL (Neon, Supabase, RDS, etc.) |
| **CCBill merchant account** | Before accepting real payments | Sign up with CCBill; create payment forms |
| **Email (SMTP)** | Before production | For password reset and verification emails |
| **Sanity CMS** | For catalog content | Create project; upload videos/images in Studio |
| **Veriff (optional)** | If required in your market | ID-based age verification |

---

## Demo mode — review the site now (no payments required)

For walkthroughs before your domain or CCBill account exists, run the site in **demo billing mode**:

- Age verification works with date of birth (no ID vendor required for demo)
- Users can register, message, and explore the full UI
- PPV, tips, and subscriptions **complete instantly in demo mode** (no real cards charged)

**Important:** Demo mode is for testing only. Turn it off and configure CCBill before accepting real money from customers.

Technical setup: see `.env.example` in the project (`BILLING_DEV_MODE=true`).

---

## Launch sequence (recommended order)

1. **Review** — Run the site locally or on a staging URL; walk through features with your team.
2. **Domain** — Purchase your domain when you are satisfied with the build.
3. **Staging** — Deploy to hosting; set `NEXT_PUBLIC_APP_URL` to your staging or production URL.
4. **Content** — Add catalog and creator content via Sanity Studio (`/studio`).
5. **Email** — Configure SMTP so users can reset passwords and verify email.
6. **Payments** — Complete CCBill setup; add credentials to environment variables; disable demo mode.
7. **Webhooks** — Register with CCBill (and Veriff if used):
   - `https://your-domain.com/api/webhooks/ccbill`
   - `https://your-domain.com/api/webhooks/veriff` (optional)
8. **Final QA** — Run through checkout, age gate, and messaging on staging.
9. **Go live** — Point production domain to the live deployment.

---

## What is intentionally not in this release

Please plan separately for:

- **Creator payout withdrawals** (bank transfers / revenue share automation)
- **2257 / performer record-keeping** (US compliance — legal/process, not yet in software)
- **Blog** — placeholder page only
- **Catalog population** — empty until you add content in Sanity

These are normal follow-on items for a commercial launch, not defects in the delivered build.

---

## Support & documentation

- **README.md** — Technical setup, environment variables, scripts
- **`.env.example`** — All configuration keys (no secrets); copy to `.env.local`
- **Tests** — Run `npm run test` (37 automated checks for billing, age gate, access control)

For questions about deployment or environment configuration, contact:  
**[Your support email / contact]**

---

## Sign-off

| | Client | Delivery team |
|---|--------|----------------|
| **Name** | | |
| **Date** | | |
| **Notes** | | |

*By signing, the client confirms receipt of the codebase and documentation for the agreed scope. Payment gateway credentials and domain registration remain the client’s responsibility.*
