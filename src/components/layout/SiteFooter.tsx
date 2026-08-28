import Image from "next/image";
import Link from "next/link";
import { NAV, label, localePath } from "@/lib/nav";
import type { AppLocale } from "@/lib/i18n";
import { Wrap } from "@/components/ui/Section";
import { CONTACT, COMPANY_PROFILE_URL, whatsappLink } from "@/lib/site";

/**
 * Address and social links are administrator-managed optional fields, hidden
 * while empty (FR-1.6). They are empty at launch by client decision, so the
 * footer must read as complete without them rather than leaving a gap.
 */
export function SiteFooter({ locale }: { locale: AppLocale }) {
  const t = (en: string, id: string) => (locale === "id" ? id : en);

  return (
    <footer className="bg-ink py-14 text-plate-c md:py-20">
      <Wrap>
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {/* The white lockup, for the ink ground. A real vector this time,
                so it is served as SVG and stays crisp at any size — and
                unoptimized, because running an SVG through the image pipeline
                rasterises it for no gain. */}
            <Image
              src="/kadokowe-wordmark-white.svg"
              alt="Kadokowe"
              width={131}
              height={24}
              unoptimized
              className="mb-4 h-7 w-auto"
            />
            <p className="max-w-[32ch] font-editorial text-[1.0625rem] italic text-plate-c">
              {t(
                "More than gifts. We craft brand stories.",
                "Lebih dari sekadar hadiah. Kami merangkai cerita merek.",
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-warm">
              {t("Explore", "Jelajahi")}
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              {NAV.filter((i) => !i.disabled).map((item) => (
                <li key={item.href}>
                  <Link
                    href={localePath(item.href, locale)}
                    className="text-plate-c transition-colors hover:text-paper"
                  >
                    {label(item, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-warm">
              {t("Contact", "Kontak")}
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-plate-c transition-colors hover:text-paper"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink(locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-plate-c transition-colors hover:text-paper"
                >
                  {CONTACT.phoneDisplay}
                </a>
              </li>
              {/* FR-8.7 — hidden entirely when no profile is configured,
                  rather than offered as a link that goes nowhere. */}
              {COMPANY_PROFILE_URL && (
                <li>
                  <a
                    href={COMPANY_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-plate-c transition-colors hover:text-paper"
                  >
                    {t("Company profile (PDF)", "Profil perusahaan (PDF)")}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-[#2e2829] pt-6 text-xs text-muted">
          {/* Set beside the copyright rather than on a line of its own: the
              bottom bar is a two-part balance, and a third row for a build
              credit would give it more weight than a build credit should
              have. Localised like everything else down here — an English-only
              line is precisely the thing that would look out of place on the
              Indonesian site. */}
          <span>
            © {new Date().getFullYear()} Kadokowe ·{" "}
            {t("Made by", "Dibuat oleh")} Nicolas Suwandy
          </span>
          <div className="flex gap-6">
            <Link
              href={localePath("/privacy", locale)}
              className="transition-colors hover:text-paper"
            >
              {t("Privacy", "Privasi")}
            </Link>
            <Link
              href={localePath("/terms", locale)}
              className="transition-colors hover:text-paper"
            >
              {t("Terms", "Ketentuan")}
            </Link>
          </div>
        </div>
      </Wrap>
    </footer>
  );
}
