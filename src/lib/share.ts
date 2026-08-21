import type { Metadata } from "next";
import { SITE } from "./site";
import type { AppLocale } from "./i18n";

/**
 * Open Graph and Twitter Card metadata — NFR-6.6.
 *
 * This matters more here than on most sites. SRS §2.8 records that links
 * reach buyers over WhatsApp, and WhatsApp renders og:image and nothing else.
 * A product link pasted into a group chat without one is a bare URL next to
 * competitors' preview cards.
 *
 * Images are transformed to a 1200x630 JPEG on delivery rather than shipped
 * at source size: WhatsApp and Twitter both refuse large payloads, and a
 * portrait product shot cropped by the scraper loses the product. Cloudinary
 * does the crop with `c_fill,g_auto`, which keeps the subject.
 */
const OG_TRANSFORM = "c_fill,g_auto,w_1200,h_630,f_jpg,q_auto";

function cloudinaryOg(publicId: string): string | null {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return null;
  return `https://res.cloudinary.com/${cloud}/image/upload/${OG_TRANSFORM}/${publicId}`;
}

export function shareMetadata({
  title,
  description,
  image,
  path,
  locale,
  type = "website",
}: {
  title: string;
  description?: string | null;
  /** Cloudinary public ID. */
  image?: string | null;
  /** Locale-prefixed path, e.g. "/id/ideas/tote-bag". */
  path: string;
  locale: AppLocale;
  type?: "website" | "article";
}): Metadata {
  const url = `${SITE.url}${path}`;
  const remote = image ? cloudinaryOg(image) : null;
  // Falls back to the site card so a link is never bare, even before the
  // catalogue has photography.
  const images = remote ? [{ url: remote, width: 1200, height: 630, alt: title }] : undefined;

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: url },
    openGraph: {
      type,
      siteName: SITE.name,
      title,
      ...(description ? { description } : {}),
      url,
      locale: locale === "id" ? "id_ID" : "en_US",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      ...(description ? { description } : {}),
      ...(remote ? { images: [remote] } : {}),
    },
  };
}
