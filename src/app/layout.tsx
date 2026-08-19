import type { Metadata } from "next";
import { headers } from "next/headers";
import { Poppins, Lora } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

/**
 * Poppins carries structure — navigation, headlines, labels, UI.
 * Lora carries voice — editorial statements and "Why We Like It".
 * SRS §11.3. The weights are limited to those actually used; loading the
 * full family would cost more than the design spends.
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
  description:
    "Kadokowe is a strategic merchandising partner. We turn campaigns, budgets and deadlines into merchandise that carries a brand story — strategy, design, sourcing and production under one roof.",
  openGraph: {
    type: "website",
    siteName: SITE.name,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Set by middleware; the root layout sits above the [locale] segment and so
  // cannot read the route param directly.
  const lang = (await headers()).get("x-kdw-locale") === "id" ? "id" : "en";

  return (
    <html
      lang={lang}
      className={`${poppins.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
