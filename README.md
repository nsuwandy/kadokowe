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

## Still to build for Phase 1a

Admin area with bulk product import (FR-10), Insights article bodies, and the
homepage teasers for Custom Made and Ready Stock. Kadokowe Quarterly is
Phase 1b.
