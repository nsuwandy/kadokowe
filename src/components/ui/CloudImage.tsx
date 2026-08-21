"use client";

import { CldImage } from "next-cloudinary";

/**
 * Client boundary for Cloudinary delivery.
 *
 * next-cloudinary's CldImage calls useState internally and is not marked as a
 * client component by the package, so rendering it from a server component
 * throws. That failure was invisible for as long as no image existed: Plate
 * only reaches this branch when a public ID *and* a configured cloud name are
 * both present, which was never true in development. Configuring Cloudinary
 * would otherwise have turned every page carrying a photograph into a 500 on
 * the day the client set it up.
 *
 * Kept as a separate file so Plate itself stays a server component — it is
 * rendered on nearly every page, and pushing all of it to the client would
 * ship layout code that has no reason to run there.
 */
export function CloudImage({
  publicId,
  alt,
  sizes,
  priority,
  className,
}: {
  publicId: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <CldImage
      src={publicId}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
