# Kadokowe

Corporate website and Idea Library for Kadokowe, a strategic merchandising
partner. Built against **SRS v1.4** (`../Kadokowe_Website_SRS.docx`), which is
the source of record — requirement IDs referenced in code comments (`FR-3.15`,
`NFR-6.2`) point back to it.

## Running it

```bash
npm install
cp .env.example .env      # then fill in — see below
npx prisma dev            # local Postgres, prints a DATABASE_URL
npx prisma migrate dev    # apply the schema
npm run db:seed           # sample catalogue, the five real case studies
npm run dev
```

English is served at `/`, Indonesian at `/id`.

The local Postgres from `npx prisma dev` **does not survive a reboot**. If the
app cannot reach the database, start it again and re-copy the `DATABASE_URL` it
prints into `.env`.

## Environment

`.env.example` lists everything with notes. Nothing is required to boot except
`DATABASE_URL` — email degrades to console logging without `RESEND_API_KEY`,
and images fall back to labelled placeholder plates without Cloudinary
credentials, so a missing key never takes down a form or a page.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:seed` | Seed sample content |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:studio` | Browse the database |

## Layout

```
prisma/schema.prisma   Data model (SRS §9). Phase 2/3 entities included.
src/app/[locale]/      Public pages
src/app/api/           Enquiry and newsletter endpoints
src/components/        UI primitives and shared components
src/content/           Code-managed content: taxonomy, Custom Made,
                       Concept Collections, fixed page copy
src/lib/i18n.ts        Bilingual field resolution and fallback
src/proxy.ts           Locale routing (Next 16 calls this `proxy`,
                       not `middleware`)
```

## Things that will bite you

**Bilingual fields are paired columns**, `nameEn` / `nameId`, not a
translations table. Read them through `pick()` in `src/lib/i18n.ts` — it
falls back to English when Indonesian is missing, which is the normal steady
state for a large catalogue maintained by one person. Reading `record.nameId`
directly will render blanks.

**Concept Collections have no admin.** They live in
`src/content/concepts.ts` and default to `published: false`. These are real
client proposals and nothing strips client identity automatically, so read the
warning at the top of that file before publishing one.

**The product card has three prohibitions** (`src/components/ProductCard.tsx`):
no price as a primary element, no commerce action, idea-led line leads. It is
the most-repeated component on the site, so drift there propagates everywhere.
SRS §3.2 supplies the review test — *does this look like Kadokowe is selling
products?*

**`/ideas/{segment}` is a product; `/ideas/{segment}/{term}` is a filtered
view.** Position one genuinely serves both, which is why it is named
`[segment]` rather than `[slug]` or `[axis]`.

**Newsletter campaigns are not sent from here.** This app owns capture and
consent only (FR-15.6); composition and delivery belong to the email service
provider. Double opt-in, consent timestamps and one-click unsubscribe are
required because sending marketing email to recipients in Indonesia engages
Law No. 27 of 2022.

## Admin

`/admin`, English only, not linked from the public site. Create the first
account with a script that calls `hashPassword` from `src/lib/auth.ts` —
there is no public registration and no password reset yet.

Bulk import at `/admin/products/import` is how the catalogue grows without a
developer: paste or upload CSV, matched on `slug`, validated per row. A file
with bad rows imports the good ones and reports the rest by line number.
Download the template from that page for the exact column headings.

## Still to build for Phase 1a

- Editors for projects and articles (both lists are read-only)
- Insights article bodies — six articles have titles and standfirsts, no body
- Cloudinary account wired up (every image is a placeholder plate today)
- Resend key, so email actually sends rather than logging
- Neon database, deployment, analytics
- The launch catalogue itself: 150–250 products

Kadokowe Quarterly is Phase 1b. Idea Board is Phase 2. Client portal is
Phase 3.

## Deploying

Set every variable from `.env.example` in the host. Two that matter more than
they look:

- `DATABASE_POOL_MAX` — pool size *per process*, and prerendering runs one
  process per core. Too high fails the build with P1017. Start at 1 and raise
  it only against a pooled endpoint.
- `AUTH_SECRET` — at least 32 characters, or the admin refuses to start.
  `openssl rand -base64 32`.

Run `npx prisma migrate deploy` against the production database before the
first deploy.
