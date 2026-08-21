# Assets

Original files supplied by Kadokowe. **Nothing here is served by the website** —
this is the source shelf. Files reach visitors one of two ways:

| Route | For | How |
|---|---|---|
| `web/public/` | Small, fixed files the site requests by path | Copy the file in; reference it as `/name.ext` |
| Cloudinary | Everything in the catalogue — products, projects, articles, client logos | Upload through the admin; the site stores the public ID |

Keeping the originals separate matters because what gets served is almost never
what was supplied: a 4000px logo master becomes a 512px icon, and a 6MB
photograph becomes a Cloudinary delivery URL. Losing the master because someone
optimised it in place is the failure this folder prevents.

## What goes where

```
assets/
  logo/           Wordmark and mark, master files (.ai, .svg, .eps, large .png)
  brand/          Guidelines, colour and type specs, usage rules
  client-logos/   Client marks for the homepage "Trusted by" strip
  photography/    Product and production shoots — originals, gitignored
```

`photography/` is excluded from git deliberately. A shoot runs to hundreds of
megabytes, git keeps every version forever, and the delivered copies live in
Cloudinary anyway. Keep the originals in the client's own storage; this folder
is a working area, not the archive.

Everything else here is small and version-worthy — a logo that changes should
change in git, so it is obvious which one the site was built against.

## Status: the supplied logo is not usable yet

`logo/kadokowe-wordmark-supplied.jpeg` arrived as a JPEG with a painted-on
transparency checkerboard, which would render as a literal grey grid behind the
logo. An SVG or a real transparent PNG is needed before it can go anywhere near
the site — see `logo/NEEDED.md` for what to request and one casing discrepancy
worth settling first.

## Using the logo

The header currently sets the wordmark as **live text**, not an image:

```tsx
KADO<span className="text-red">KOWE</span>
```

That is deliberate — it stays crisp at any size, needs no file, costs no
request, and is searchable and readable by screen readers. Swap it for an image
only if the supplied wordmark differs from Poppins in a way that matters. If it
does, put an SVG in `public/` and replace the text in
`src/components/layout/SiteHeader.tsx`, keeping an `aria-label` on the link so
the company name is still announced.

## The favicon

There isn't one yet — the site currently shows the framework default, which is
worth fixing before launch. Next builds the tags automatically from files placed
in `src/app/`:

| File | Becomes |
|---|---|
| `src/app/icon.png` | The browser-tab icon (512×512 works) |
| `src/app/apple-icon.png` | The iOS home-screen icon (180×180) |

Drop the files in and they are picked up on the next build; no code change is
needed. The mark alone reads better than the full wordmark at 16px.

## Share images

Product, project and article links pull their share image from Cloudinary, so
those need nothing here. What is missing is the fallback for pages with no image
of their own — the homepage, About, Contact. A single 1200×630 image in
`public/og-default.jpg`, wired into `src/lib/share.ts`, covers all of them.
