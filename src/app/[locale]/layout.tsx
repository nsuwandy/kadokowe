import { notFound } from "next/navigation";
import { Poppins, Lora } from "next/font/google";
import type { Metadata } from "next";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { isLocale, htmlLang, type AppLocale } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { JsonLd, organizationSchema } from "@/lib/structured-data";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { publishedConcepts } from "@/content/concepts";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { Analytics } from "@/components/Analytics";

/**
 * Root layout for the public site.
 *
 * This is a root layout under a dynamic segment — the documented pattern for
 * internationalisation. It replaced a single app/layout.tsx that read the
 * locale from a request header to set `lang`, which forced every page dynamic
 * and made prerendering impossible. Reading the locale from the route param
 * instead lets pages be statically generated and gets `lang` right natively.
 *
 * The admin area has its own root layout, so navigating between the site and
 * /admin is a full page load. That is the correct trade here: they share no
 * chrome, and the admin has no business loading the public fonts.
 */

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.taglineEn}`,
    template: `%s — ${SITE.name}`,
  },
  // Names the city and the things people actually search for. The previous
  // description said who Kadokowe is without saying what it makes or where it
  // is, which reads well and matches nothing anyone types.
  description:
    "Corporate merchandise, custom gift boxes and branded packaging, made in Surabaya. Kadokowe is a strategic merchandising partner — strategy, design, sourcing and production under one roof.",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.taglineEn}`,
  },
  // NFR-6.6 — the site-level card. Detail pages override this with their own
  // title, description and image via src/lib/share.
  twitter: { card: "summary_large_image", title: `${SITE.name} — ${SITE.taglineEn}` },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typed = locale as AppLocale;

  return (
    <html
      lang={htmlLang(typed)}
      className={`${poppins.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* NFR-6.4 */}
        <JsonLd data={organizationSchema()} />
        {/* FR-13.6 — only the answer crosses into the browser, never the
            collections: the unpublished ones are real client proposals and
            `published: false` is the only thing keeping them off the site. */}
        <SiteHeader locale={typed} hasConcepts={publishedConcepts().length > 0} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={typed} />
        <WhatsAppFloat locale={typed} />
        <Analytics />
      </body>
    </html>
  );
}
