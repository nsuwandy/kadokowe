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
| `npm test` | Unit checks for upload limits, term ordering, galleries and rate limits |
| `npm run admin:set` | Create an admin account, or reset a password |
| `npm run db:status` | What is actually in the database — run it before debugging "the site is empty" |
| `npm run db:seed` | Seed taxonomy, the five real case studies, articles and 12 sample products |
| `npm run db:seed -- --skip-products` | The same without the sample catalogue — use this on production |
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

`/admin`, English only, not linked from the public site. There is no public
registration and no password reset in the UI — accounts are managed from the
command line:

```bash
npm run admin:set -- you@kadokowe.com "Your Name"
```

It prompts for the password twice without echoing it (an argument would land
in shell history), requires at least 12 characters, and stores a bcrypt hash
at cost 12. Running it against an address that already exists resets that
password, so it is also the recovery route if one is forgotten.

| Section | Does |
|---|---|
| Products | Create, edit, delete; four-axis tagging; visibility |
| Import | Bulk CSV — how the catalogue grows without a developer |
| Our Work | Six optional story sections, ordering, related products |
| Insights | Rich text editor, categories, the FR-8.8 cross-links |
| Page copy | Override wording on key pages; homepage hero images |
| Categories | The four browse axes — rename, reorder, add |
| Preview | Draft and scheduled items open on the real page via "Preview ↗" |
| Newsletter | Subscribers, search, CSV export, provider sync state |
| Enquiries | Status, notes, attachments, CSV export |
| Newsletter | Subscribers with consent evidence, CSV export |

Two behaviours worth knowing:

**Budget tier is derived from price**, never tagged. Set an indicative price
and the tier follows; any budget term you tick is discarded. This keeps a
product out of a filter its own price contradicts.

**Clearing a page-copy field restores the original**, it does not blank the
page. The wording written into the code is the default; the database only
holds what you have deliberately changed.

## Still to build for Phase 1a

Every requirement in the spec is now implemented. What remains is
configuration and content, not code:

- **Cloudinary** — until an account and upload preset are set, every image is
  a labelled placeholder and the image fields fall back to pasting a public ID.
  `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is what switches real delivery on
- **The company profile PDF** — `NEXT_PUBLIC_COMPANY_PROFILE_URL`. The supplied
  file is 28.7 MB, which is too large to serve to a phone; compress it before
  uploading. The footer link stays hidden until this is set
- **Resend** — without a key, email logs to the console instead of sending
- **Newsletter provider** — subscribers are captured but nothing sends
- **Neon** — the local `prisma dev` database does not survive a reboot
- **Deployment** and a domain
- **The launch catalogue** — 150–250 products with copy, and photography

Kadokowe Quarterly is Phase 1b. Idea Board is Phase 2. Client portal is
Phase 3.

### Not yet verified

Being honest about the gap between "implemented" and "proven":

- **No cross-browser pass.** Everything has been exercised in one Chromium
  preview. Safari on iOS matters most here — SRS §3.2 has links arriving over
  WhatsApp.
- **No performance measurement** against NFR-1.2's 2.5s mobile LCP. The build
  prerenders 126 pages, which is the right shape, but nothing has been timed on
  a real connection.
- **Automated tests cover four pure functions**, not pages, actions or routes.
  The admin forms in particular are verified by hand.
- **Rate limiting is per-instance.** Counters live in memory, so they do not
  survive a cold start or apply across instances. It stops sustained guessing
  down one connection, which is the case that matters, and should move to a
  shared store when there is somewhere to put it.
- **Article scheduling is accurate to the hour**, because the Insights pages
  are prerendered and revalidate hourly.
- **`prisma migrate dev` needs `SHADOW_DATABASE_URL`** pointed at a second,
  separate database. Without it Prisma puts the shadow beside the working
  database and no migration can be created at all.

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

### First deploy, in order

The order matters — DNS last, because pointing a domain at a project that
cannot boot just makes the failure public.

1. **Neon** — create the database. Create a *second* one for
   `SHADOW_DATABASE_URL`; `prisma migrate dev` needs it and Neon does not
   always let Prisma make its own. Take the pooled connection string for
   `DATABASE_URL`.
2. **Cloudinary** — account, then an unsigned upload preset for the admin
   image picker. Both the public cloud name and the API key/secret are needed:
   the key and secret are what upload enquiry attachments, which no longer
   touch the filesystem.
3. **Resend** — API key, and verify the sending domain or confirmation emails
   land in spam.
4. **Import the repo into Vercel.** Set every variable from `.env.example`.
   `NEXT_PUBLIC_SITE_URL` must be the final `https://` origin — it builds
   canonical tags, share URLs, the sitemap and the newsletter confirmation
   link, so a stale value means subscribers confirm against localhost.
5. **Migrate**: `npx prisma migrate deploy` with `DATABASE_URL` pointed at Neon.
6. **Create the administrator**: `npm run admin:set -- you@kadokowe.com "Name"`,
   same environment.
7. **Deploy**, and check the `*.vercel.app` URL end to end before going near
   the domain.
8. **Point the domain.** Add it in Vercel, copy the records Vercel shows into
   the registrar's DNS. Leave MX records alone or you break the client's email.

### Holding page

The domain usually goes live before the catalogue does, and an empty
catalogue is a worse first impression than no site at all. Set
`COMING_SOON=1` in Vercel and every public route shows a holding page
instead; unset it and redeploy to launch.

The admin stays reachable throughout, so content can be loaded behind the
curtain. `COMING_SOON_BYPASS` is a shared token — send the client
`https://kadokowe.com/?preview=TOKEN` and they see the real site from then
on. It is a curtain, not access control: anyone with the link gets through,
and what it protects is the first impression, not the data.

### After the first deploy

- Turn on **daily backups with 30-day retention** in Neon (NFR-4.2), then
  write and actually rehearse the restore (NFR-4.3). An untested restore is
  a hope, not a procedure.
- Measure LCP and CLS on a real connection (NFR-1.2, NFR-1.5).
- Check it on iOS Safari. Nothing has been tested outside one Chromium build,
  and links reach buyers over WhatsApp.
