"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AppLocale } from "@/lib/i18n";
import { ENQUIRY_TYPES, TYPE_LABELS } from "@/lib/enquiry-schema";
import { cn } from "@/lib/cn";

/**
 * Start a Project — FR-6.1 to FR-6.7.
 *
 * FR-6.7 governs the whole component: only name and email are required. This
 * form exists for the visitor who has an event and a rough budget and no
 * product in mind, so asking them to commit to a quantity they have not
 * decided is how the conversion is lost. Everything else is optional and
 * looks optional.
 */
export function EnquiryForm({ locale }: { locale: AppLocale }) {
  const t = (en: string, id: string) => (locale === "id" ? id : en);
  const searchParams = useSearchParams();
  const productSlug = searchParams.get("product") ?? undefined;

  const [type, setType] = useState<string | undefined>();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;

    const form = new FormData(e.currentTarget);
    const files = form.getAll("uploads").filter(
      (f): f is File => f instanceof File && f.size > 0,
    );
    const payload = {
      type,
      quantity: String(form.get("quantity") ?? ""),
      targetBudget: String(form.get("targetBudget") ?? ""),
      neededBy: String(form.get("neededBy") ?? ""),
      description: String(form.get("description") ?? ""),
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      company: String(form.get("company") ?? ""),
      phone: String(form.get("phone") ?? ""),
      companyWebsite: String(form.get("companyWebsite") ?? ""),
      sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
      productSlug,
      locale,
    };

    const next: Record<string, string> = {};
    if (!payload.name.trim()) next.name = t("Please tell us your name.", "Mohon isi nama Anda.");
    if (!/^\S+@\S+\.\S+$/.test(payload.email))
      next.email = t("We need a valid email to reply.", "Kami perlu email yang valid untuk membalas.");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setState("sending");
    try {
      let res: Response;
      if (files.length > 0) {
        // Multipart when there are attachments; the route accepts both so a
        // brief-less enquiry keeps the cheaper JSON path.
        const body = new FormData();
        body.append("payload", JSON.stringify(payload));
        for (const f of files) body.append("uploads", f);
        res = await fetch("/api/enquiry", { method: "POST", body });
      } else {
        res = await fetch("/api/enquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error("failed");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="border-t-2 border-red bg-warm px-8 py-14">
        <h2 className="mb-4 text-lg-display font-bold tracked-tight">
          {t("Thank you — we've got it.", "Terima kasih — sudah kami terima.")}
        </h2>
        <p className="max-w-[52ch] font-editorial text-lede italic text-muted">
          {t(
            "Your brief has reached us. We'll review it and come back with options — usually within one working day.",
            "Brief Anda sudah sampai. Kami akan meninjau dan kembali dengan pilihan — biasanya dalam satu hari kerja.",
          )}
        </p>
      </div>
    );
  }

  const field = "w-full border border-line bg-paper px-4 py-3.5 text-[0.9375rem] outline-none focus:border-red";
  const label = "text-[0.6875rem] font-bold uppercase tracking-[0.15em]";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col">
      {productSlug && (
        <p className="mb-8 border-l-2 border-red bg-warm px-5 py-4 text-[0.8125rem] text-muted">
          {t("About: ", "Mengenai: ")}
          <strong className="text-ink">{productSlug.replace(/-/g, " ")}</strong>
        </p>
      )}

      <fieldset className="mb-8 flex flex-col gap-3">
        <legend className={label}>
          {t("What are you planning?", "Apa yang Anda rencanakan?")}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ENQUIRY_TYPES.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={type === key}
              onClick={() => setType(type === key ? undefined : key)}
              className={cn(
                "border px-4 py-3.5 text-left text-[0.8125rem] font-semibold transition-colors",
                type === key
                  ? "border-red bg-red text-paper"
                  : "border-line bg-paper hover:border-ink",
              )}
            >
              {t(TYPE_LABELS[key].en, TYPE_LABELS[key].id)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={label} htmlFor="quantity">
            {t("Approximate quantity", "Perkiraan kuantitas")}
          </label>
          <input id="quantity" name="quantity" className={field} placeholder="e.g. 1,500" />
        </div>
        <div className="flex flex-col gap-2">
          <label className={label} htmlFor="targetBudget">
            {t("Target budget per item", "Target anggaran per unit")}
          </label>
          <input id="targetBudget" name="targetBudget" className={field} placeholder="e.g. Rp 25,000" />
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-2">
        <label className={label} htmlFor="neededBy">
          {t("When do you need it?", "Kapan Anda membutuhkannya?")}
        </label>
        <input id="neededBy" name="neededBy" type="date" className={field} />
        <p className="text-xs text-muted">
          {t(
            "Rush is normal here. Ready stock can ship in five to seven days.",
            "Pesanan kilat itu biasa bagi kami. Stok siap dapat dikirim dalam lima hingga tujuh hari.",
          )}
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-2">
        <span className={label}>
          {t("Upload brand or brief", "Unggah merek atau brief")}
        </span>
        <input
          type="file"
          name="uploads"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.svg,.ai,.zip"
          className="w-full border border-dashed border-line bg-warm px-4 py-4 text-sm file:mr-4 file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-xs file:font-semibold"
        />
        <p className="text-xs text-muted">
          {t(
            "Optional — a logo, brand guide, or an existing brief. Anything that saves you explaining.",
            "Opsional — logo, panduan merek, atau brief yang sudah ada. Apa pun yang menghemat penjelasan Anda.",
          )}
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-2">
        <label className={label} htmlFor="description">
          {t("Tell us about the project", "Ceritakan tentang proyeknya")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className={cn(field, "resize-y leading-relaxed")}
          placeholder={t(
            "The campaign, the audience, anything you've already ruled out…",
            "Kampanye, audiens, apa pun yang sudah Anda kesampingkan…",
          )}
        />
      </div>

      <hr className="mb-8 border-line" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={label} htmlFor="name">
            {t("Your name", "Nama Anda")} *
          </label>
          <input
            id="name"
            name="name"
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={cn(field, errors.name && "border-red")}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-red" role="alert">
              {errors.name}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className={label} htmlFor="company">
            {t("Company", "Perusahaan")}
          </label>
          <input id="company" name="company" className={field} />
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={label} htmlFor="email">
            {t("Email", "Surel")} *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={cn(field, errors.email && "border-red")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-red" role="alert">
              {errors.email}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className={label} htmlFor="phone">
            {t("Phone or WhatsApp", "Telepon atau WhatsApp")}
          </label>
          <input id="phone" name="phone" className={field} />
        </div>
      </div>

      {/* Honeypot — invisible to people, irresistible to bots (FR-6.11). */}
      <input
        type="text"
        name="companyWebsite"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0"
      />

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full bg-red px-7 py-4 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink disabled:opacity-60"
      >
        {state === "sending"
          ? t("Sending…", "Mengirim…")
          : t("Let's Create Something.", "Mari Ciptakan Sesuatu.")}
      </button>

      {state === "error" && (
        <p className="mt-4 text-sm text-red" role="alert">
          {t(
            "That didn't send. Try again, or message us on WhatsApp.",
            "Pengiriman gagal. Coba lagi, atau hubungi kami via WhatsApp.",
          )}
        </p>
      )}
    </form>
  );
}
