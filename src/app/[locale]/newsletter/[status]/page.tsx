import { notFound } from "next/navigation";
import { isLocale, type AppLocale } from "@/lib/i18n";
import { localePath } from "@/lib/nav";
import { Wrap, Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

const STATUSES = ["confirmed", "unsubscribed", "invalid"] as const;
type Status = (typeof STATUSES)[number];

export function generateStaticParams() {
  return STATUSES.flatMap((status) =>
    ["en", "id"].map((locale) => ({ locale, status })),
  );
}

/** Landing pages for the double opt-in and unsubscribe flows (FR-15.2, 15.3). */
export default async function NewsletterStatusPage({
  params,
}: PageProps<"/[locale]/newsletter/[status]">) {
  const { locale, status } = await params;
  if (!isLocale(locale)) notFound();
  if (!STATUSES.includes(status as Status)) notFound();

  const l = locale as AppLocale;
  const t = (en: string, id: string) => (l === "id" ? id : en);

  const copy: Record<Status, { title: string; body: string }> = {
    confirmed: {
      title: t("You're in.", "Anda terdaftar."),
      body: t(
        "Ideas, trends and projects will land in your inbox — not often, and only when we have something worth sharing.",
        "Ide, tren, dan proyek akan tiba di kotak masuk Anda — tidak sering, dan hanya ketika ada yang layak dibagikan.",
      ),
    },
    unsubscribed: {
      title: t("You're unsubscribed.", "Langganan dihentikan."),
      body: t(
        "You won't hear from us again. No hard feelings — the door stays open.",
        "Anda tidak akan menerima email lagi dari kami. Tidak masalah — pintu kami tetap terbuka.",
      ),
    },
    invalid: {
      title: t("That link has expired.", "Tautan ini sudah tidak berlaku."),
      body: t(
        "Confirmation links can only be used once. Sign up again and we'll send a fresh one.",
        "Tautan konfirmasi hanya bisa digunakan sekali. Daftar lagi dan kami akan mengirim yang baru.",
      ),
    },
  };

  const c = copy[status as Status];

  return (
    <Section>
      <Wrap>
        <div className="mx-auto flex max-w-[52ch] flex-col items-start gap-5 py-16">
          <h1 className="text-xl-display font-bold tracked-tight balance">
            {c.title}
          </h1>
          <p className="font-editorial text-lede text-muted">{c.body}</p>
          <Button href={localePath("/insights", l)} variant="ghost">
            {t("Read Insights", "Baca Wawasan")}
          </Button>
        </div>
      </Wrap>
    </Section>
  );
}
