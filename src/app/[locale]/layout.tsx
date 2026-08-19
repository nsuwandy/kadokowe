import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";

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
    <>
      <SiteHeader locale={typed} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={typed} />
      <WhatsAppFloat locale={typed} />
    </>
  );
}
