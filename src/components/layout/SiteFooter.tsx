import Link from "next/link";
import { NAV, label, localePath } from "@/lib/nav";
import type { AppLocale } from "@/lib/i18n";
import { Wrap } from "@/components/ui/Section";
import { CONTACT } from "@/lib/site";

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
            <div className="mb-4 font-display text-[1.0625rem] font-bold tracking-[0.14em] text-paper">
              KADO<span className="text-red">KOWE</span>
            </div>
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
                  href={CONTACT.whatsappUrl}
                  className="text-plate-c transition-colors hover:text-paper"
                >
                  {CONTACT.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-[#2e2829] pt-6 text-xs text-muted">
          <span>© {new Date().getFullYear()} Kadokowe</span>
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
