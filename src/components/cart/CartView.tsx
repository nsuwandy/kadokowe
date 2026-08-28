"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/useCart";
import { cartTotals, type ResolvedLine, type CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/price";
import type { AppLocale } from "@/lib/i18n";

/**
 * The cart, and the brief it becomes — FR-6.x.
 *
 * Two states in one screen rather than two pages: the list, and the few
 * questions that turn it into something Kadokowe can quote. A separate
 * checkout page would be one more place to abandon, and the questions here
 * are short enough not to need one.
 */
export function CartView({
  locale,
  resolve,
  labels,
}: {
  locale: AppLocale;
  resolve: (lines: CartLine[], locale: AppLocale) => Promise<ResolvedLine[]>;
  labels: Record<string, string>;
}) {
  const { lines, setQuantity, remove, clear, count } = useCart();
  const [fetched, setFetched] = useState<ResolvedLine[] | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string } | null>(null);

  // An empty cart is derived, not stored: there is nothing to ask the server
  // about, and holding the answer in state would mean writing it from an
  // effect for no reason.
  const resolved = lines.length === 0 ? [] : fetched;

  // Prices are asked for again on every change, so what is shown is what the
  // catalogue currently says rather than what it said when the tab was opened.
  useEffect(() => {
    if (lines.length === 0) return;
    let cancelled = false;
    resolve(lines, locale).then((r) => {
      if (!cancelled) setFetched(r);
    });
    return () => {
      cancelled = true;
    };
  }, [lines, locale, resolve]);

  const totals = resolved ? cartTotals(resolved) : null;

  async function submit(form: FormData) {
    setError(null);
    setSending(true);
    try {
      const payload = {
        brand: String(form.get("brand") ?? ""),
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        message: String(form.get("message") ?? ""),
        companyWebsite: String(form.get("companyWebsite") ?? ""),
        locale,
        lines,
      };
      const body = new FormData();
      body.append("payload", JSON.stringify(payload));
      for (const file of form.getAll("uploads")) {
        if (file instanceof File && file.size > 0) body.append("uploads", file);
      }

      const res = await fetch("/api/cart/checkout", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(
          data.error === "upload" ? labels.errorUpload
          : data.error === "rate_limited" ? labels.errorRate
          : labels.errorGeneric,
        );
        return;
      }

      // Hand over the PDF before clearing, so a failure here cannot lose the
      // basket as well as the download.
      download(data.pdf, data.filename);
      setDone({ reference: data.reference });
      clear();
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-start gap-5 border-l-2 border-red bg-paper px-7 py-8">
        <h2 className="text-lg-display font-bold tracked-tight">{labels.sentHeading}</h2>
        <p className="max-w-[60ch] text-sm text-muted">
          {labels.sentBody} <strong className="text-ink">{done.reference}</strong>.
        </p>
        <Link href="/products" className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-red hover:underline">
          {labels.keepBrowsing} →
        </Link>
      </div>
    );
  }

  if (resolved === null) {
    return <p className="text-sm text-muted">{labels.loading}</p>;
  }

  if (resolved.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="font-editorial text-lede italic text-muted">{labels.empty}</p>
        <Link href="/products" className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-red hover:underline">
          {labels.browse} →
        </Link>
      </div>
    );
  }

  const field =
    "w-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-red";
  const labelCls = "text-[0.6875rem] font-bold uppercase tracking-[0.14em]";

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
      {/* ------------------------------------------------------------ list */}
      <div className="flex flex-col">
        <ul className="flex flex-col border-t border-line">
          {resolved.map((line, i) => (
            <li key={`${line.slug}-${line.packagingId ?? "none"}`} className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-line py-5">
              <div className="min-w-[16rem] flex-1">
                <Link href={`/products/${line.slug}`} className="font-semibold hover:text-red">
                  {line.name}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {line.packagingName ?? labels.productOnly}
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted">
                {labels.qty}
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => setQuantity(i, Number(e.target.value) || 1)}
                  className="w-20 border border-line px-2 py-1.5 text-sm tabular-nums outline-none focus:border-red"
                />
              </label>

              <div className="w-32 text-right text-sm tabular-nums">
                {line.quoteOnly || line.unitPrice === null ? (
                  <span className="text-red">{labels.quoted}</span>
                ) : (
                  formatPrice(
                    line.unitPrice * line.quantity,
                    line.unitPriceMax === null ? null : line.unitPriceMax * line.quantity,
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`${labels.removeLine} ${line.name}`}
                className="text-xs text-muted hover:text-red"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-baseline justify-between gap-4 py-5">
          <span className="text-xs text-muted">
            {count} {count === 1 ? labels.unit : labels.units}
          </span>
          {totals?.quoteOnly ? (
            <div className="text-right">
              <span className="text-md-display font-bold text-red">{labels.quoted}</span>
              <p className="mt-1 max-w-[42ch] text-xs text-muted">{labels.quotedWhy}</p>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted">
                {labels.indicativeTotal}
              </span>
              <p className="text-md-display font-bold tabular-nums">
                {formatPrice(totals?.total ?? null, totals?.totalMax ?? null)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------- checkout */}
      <form
        action={submit}
        className="flex h-fit flex-col gap-4 bg-paper p-7 lg:sticky lg:top-24"
      >
        <h2 className="text-sm font-semibold">{labels.checkoutHeading}</h2>
        <p className="-mt-2 text-xs text-muted">{labels.checkoutIntro}</p>

        {error && (
          <p role="alert" className="border-l-2 border-red px-4 py-2.5 text-sm">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{labels.brand} *</span>
          <input name="brand" required maxLength={160} className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{labels.yourName} *</span>
          <input name="name" required maxLength={160} className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{labels.email} *</span>
          <input name="email" type="email" required maxLength={200} className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{labels.phone}</span>
          <input name="phone" maxLength={60} className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{labels.message}</span>
          <textarea name="message" rows={4} maxLength={4000} className={field} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>{labels.files}</span>
          <span className="text-xs text-muted">{labels.filesHint}</span>
          <input
            type="file"
            name="uploads"
            multiple
            className="w-full border border-dashed border-line bg-warm px-4 py-4 text-sm file:mr-4 file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-xs file:font-semibold"
          />
        </label>

        {/* Honeypot. Off-screen rather than hidden, so a bot filling every
            field it can see still trips it. */}
        <div className="absolute left-[-9999px]" aria-hidden>
          <label>
            Company website
            <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <button
          disabled={sending}
          className="mt-2 bg-red px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink disabled:opacity-60"
        >
          {sending ? labels.sending : labels.send}
        </button>
        <p className="text-xs text-muted">{labels.sendNote}</p>
      </form>
    </div>
  );
}

/** Hand the generated PDF to the browser without a round trip to fetch it. */
function download(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next tick: revoking immediately races the download in
  // Safari, which has not finished reading the blob when click() returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
