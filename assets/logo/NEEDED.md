# The supplied logo cannot be used on the site as it is

`kadokowe-wordmark-supplied.jpeg` — 1024×271, progressive JPEG, 3 components.
Currently held outside the project at `Kadokowe/brand-assets/`, because macOS
quarantine attributes make it unreadable to the build. See `../README.md`.

## What is wrong with it

**It has no transparency, and cannot have any.** JPEG carries no alpha channel
(confirmed: 3 components, not 4). The grey-and-white checkerboard visible around
the letterforms is not transparency — it is *pixels*, part of the image. Place
this file on the site and every visitor sees a grey grid behind the logo, on
every page, in the header.

**It is a lossy format for line art.** JPEG compresses by discarding detail at
hard edges, which is exactly what a wordmark is made of. Even cleaned up, it
would show halos against the white and warm-grey grounds the site uses.

**It is a raster at one size.** The header renders the wordmark small and the
footer larger; a single 1024px raster serves neither well, and nothing serves a
retina screen properly.

## What to ask for

In order of preference:

1. **SVG** — the original vector. Scales to any size, stays crisp, a few
   kilobytes, and the red can be recoloured in CSS if a dark background ever
   needs it. This is what a logo should be delivered as.
2. **PNG with a real alpha channel**, at 3× the largest displayed size, with the
   background genuinely transparent rather than painted to look it.

Ask for two lockups, since the site needs both:

- **The full wordmark**, as supplied — for the header and footer.
- **The mark alone** (the bow) — for the favicon and app icon, where the full
  wordmark is illegible at 16–32px.

The tagline "More Than Gifts, We Craft Brand Stories." is already set as live
text on the site, so it is not needed inside the logo file.

## One discrepancy to settle

The supplied logo sets the name in **lower case** — *kadokowe* — with the bow
replacing part of the *w*. The site currently renders it in **upper case** as
live text:

```tsx
KADO<span className="text-red">KOWE</span>
```

Those are two different wordmarks. The logo is the authority, so the header
should either use the supplied artwork or be reset in lower case to match.
Worth confirming with Kadokowe before changing, since the header is on every
page and the two are currently inconsistent.
