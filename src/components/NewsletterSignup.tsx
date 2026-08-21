"use client";

import { useState } from "react";
import type { AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * Newsletter signup — FR-15.1, FR-15.2, FR-15.8.
 *
 * Presented as "Ideas Worth Sharing" rather than a generic subscribe box,
 * because the section it sits in is arguing that Kadokowe is worth listening
 * to.
 *
 * The success message is identical whether the address is new, already
 * subscribed, or previously unsubscribed (FR-15.8). Saying "you are already
 * subscribed" would confirm membership of the list to anyone who can type an
 * address, which is a disclosure the visitor did not consent to.
 */
export function NewsletterSignup({
  locale,
  sourcePage,
  tone = "warm",
}: {
  locale: AppLocale;
  sourcePage?: string;
  tone?: "warm" | "ink";
}) {
  const t = (en: string, id: string) => (locale === "id" ? id : en);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  // FR-15.8 — forwarded so the server decides; a check that only runs in the
  // browser guards the path a bot never takes.
  const [companyWebsite, setCompanyWebsite] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, sourcePage, companyWebsite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "failed");
      setState("done");
      setMessage(
        t(
          "Check your inbox — confirm the link and you're in.",
          "Cek kotak masuk Anda — konfirmasi tautannya dan Anda terdaftar.",
        ),
      );
    } catch {
      setState("error");
      setMessage(
        t(
          "That didn't go through. Try again, or email us directly.",
          "Pendaftaran gagal. Coba lagi, atau kirim email langsung kepada kami.",
        ),
      );
    }
  }

  const dark = tone === "ink";

  return (
    <div
      className={cn(
        "flex flex-col gap-5 px-8 py-10 md:px-14 md:py-14",
        dark ? "bg-ink text-warm" : "bg-warm",
      )}
    >
      <h2
        className={cn(
          "text-lg-display font-bold tracked-tight",
          dark && "text-paper",
        )}
      >
        {t("Ideas worth sharing.", "Ide yang layak dibagikan.")}
      </h2>
      <p
        className={cn(
          "max-w-[52ch] font-editorial text-[1.0625rem] italic",
          dark ? "text-plate-c" : "text-muted",
        )}
      >
        {t(
          "Gifting strategies, merchandise trends, inspiring projects and new discoveries — from Kadokowe to your inbox.",
          "Strategi hadiah, tren merchandise, proyek inspiratif, dan temuan baru — dari Kadokowe ke kotak masuk Anda.",
        )}
      </p>

      {state === "done" ? (
        <p
          className={cn(
            "font-display text-sm font-semibold",
            dark ? "text-paper" : "text-red",
          )}
          role="status"
        >
          {message}
        </p>
      ) : (
        <form onSubmit={submit} className="flex w-full max-w-xl flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              {t("Your email address", "Alamat email Anda")}
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("Your email address", "Alamat email Anda")}
              className={cn(
                "flex-1 border px-4 py-3.5 text-[0.9375rem] outline-none",
                dark
                  ? "border-[#2e2829] bg-ink text-warm placeholder:text-muted focus:border-red"
                  : "border-line bg-paper focus:border-red",
              )}
            />
            {/* Honeypot — bots fill it, people never see it (FR-15.8). */}
            <input
              type="text"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute h-0 w-0 opacity-0"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="bg-red px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink disabled:opacity-60"
            >
              {state === "sending"
                ? t("Sending…", "Mengirim…")
                : t("Get Inspired →", "Dapatkan Inspirasi →")}
            </button>
          </div>
          {state === "error" && (
            <p className="text-sm text-red" role="alert">
              {message}
            </p>
          )}
          <p className={cn("text-xs", dark ? "text-muted" : "text-muted")}>
            {t(
              "We'll email you to confirm. Unsubscribe in one click, any time.",
              "Kami akan mengirim email konfirmasi. Berhenti berlangganan dengan satu klik, kapan saja.",
            )}
          </p>
        </form>
      )}
    </div>
  );
}
