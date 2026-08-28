import { SITE, CONTACT } from "./site";

/**
 * Structured data — NFR-6.4.
 *
 * Organization, Product and Article, which is what the requirement names.
 * Emitted as JSON-LD in a script tag rather than as microdata attributes so
 * the markup stays about layout and the data can be assembled from the same
 * values the page already has.
 *
 * Product deliberately carries no `offers`. The brief is explicit that
 * Kadokowe is not a shop and that price must never lead (FR-4.3), and an
 * offers block would put a price in the search result — the one place the
 * positioning is hardest to undo. Google will show a Product card without it.
 */
type Json = Record<string, unknown>;

export function organizationSchema(): Json {
  return {
    "@context": "https://schema.org",
    // Organization *and* LocalBusiness: the business is national in reach but
    // physically in Surabaya, and a search for a supplier in a named city is
    // answered from local signals. The previous schema gave the country and
    // nothing else, which is no help at all to a query naming a city.
    "@type": ["Organization", "LocalBusiness"],
    name: SITE.name,
    url: SITE.url,
    description: SITE.taglineEn,
    email: CONTACT.email,
    telephone: CONTACT.phoneDisplay,
    address: {
      "@type": "PostalAddress",
      // A street address belongs here too. Without one Google will not treat
      // this as a verified local business, and no amount of markup
      // substitutes for a Google Business Profile — see the note in README.
      addressLocality: "Surabaya",
      addressRegion: "Jawa Timur",
      addressCountry: "ID",
    },
    areaServed: [
      { "@type": "City", name: "Surabaya" },
      { "@type": "Country", name: "Indonesia" },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: CONTACT.phoneDisplay,
      email: CONTACT.email,
      areaServed: "ID",
      availableLanguage: ["en", "id"],
    },
  };
}

export function productSchema({
  name,
  description,
  image,
  url,
  material,
}: {
  name: string;
  description?: string | null;
  image?: string | null;
  url: string;
  material?: string | null;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(material ? { material } : {}),
    url,
    brand: { "@type": "Brand", name: SITE.name },
  };
}

export function articleSchema({
  headline,
  description,
  image,
  url,
  publishedAt,
}: {
  headline: string;
  description?: string | null;
  image?: string | null;
  url: string;
  publishedAt?: Date | null;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(publishedAt ? { datePublished: publishedAt.toISOString() } : {}),
    url,
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}

/**
 * Render JSON-LD.
 *
 * `<` is escaped because the payload carries administrator-authored copy: a
 * product description containing "</script>" would otherwise close the tag
 * and everything after it becomes markup.
 */
export function JsonLd({ data }: { data: Json }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
