import type { Metadata } from "next";
import Image from "next/image";
import { CONTACT, SITE } from "@/lib/site";

/**
 * Holding page — shown on every public route while COMING_SOON is set.
 *
 * Deliberately outside the [locale] segment: the proxy sends every public
 * request here before locale routing runs, and the page has no navigation to
 * be bilingual about. Both languages sit on it together instead, which is
 * also how a holding page usually reads in Indonesia.
 *
 * It carries real contact routes rather than only an apology. Someone typing
 * the domain before launch is a prospect, and WhatsApp is where this business
 * actually converts (SRS §2.8) — a dead end would waste the visit.
 */
export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.taglineEn}`,
  description:
    "Kadokowe is a strategic merchandising partner. Our new site is on its way — talk to us in the meantime.",
  // Nothing here should be indexed, or search engines cache the holding page
  // as the site's description and keep serving it after launch.
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col justify-between bg-ink px-gutter py-12 text-warm">
      {/* Same white lockup as the footer — this page is on the same ink
          ground, and it is what a visitor sees while the curtain is up. */}
      <Image
        src="/kadokowe-wordmark-white.svg"
        alt="Kadokowe"
        width={131}
        height={24}
        unoptimized
        priority
        className="h-7 w-auto self-start"
      />

      <div className="flex max-w-[46rem] flex-col gap-7 py-16">
        <span className="eyebrow text-red">Coming soon · Segera hadir</span>

        <h1 className="balance text-mega font-bold tracked-tight">
          More Than Gifts.
          <br />
          <span className="font-editorial font-normal italic">
            We Craft Brand Stories.
          </span>
        </h1>

        <p className="max-w-[52ch] font-editorial text-lede italic text-plate-c">
          Our new site is being built. In the meantime, tell us what you are
          planning — a campaign, a deadline, a budget — and we will come back
          with ideas.
        </p>

        <p className="max-w-[52ch] text-[0.9375rem] leading-relaxed text-plate-c/80">
          Situs baru kami sedang dibangun. Sementara itu, sampaikan rencana
          Anda — kampanye, tenggat waktu, atau anggaran — dan kami akan kembali
          dengan ide.
        </p>

        <div className="mt-2 flex flex-wrap gap-4">
          <a
            href={CONTACT.whatsappUrl}
            className="bg-red px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            WhatsApp {CONTACT.phoneDisplay}
          </a>
          <a
            href={`mailto:${CONTACT.email}`}
            className="border border-[#3a3335] px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] transition-colors hover:border-warm"
          >
            {CONTACT.email}
          </a>
        </div>
      </div>

      <p className="text-xs text-muted">
        © {new Date().getFullYear()} Kadokowe · Surabaya, Indonesia
      </p>
    </main>
  );
}
