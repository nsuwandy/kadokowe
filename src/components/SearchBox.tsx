"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { localePath } from "@/lib/nav";
import type { AppLocale } from "@/lib/i18n";

/**
 * Idea Library search — FR-3.7.
 *
 * Navigates to a real URL rather than filtering in place, so a search result
 * is shareable and indexable like every other view in the library. Someone who
 * finds the right set of products should be able to send that link to a
 * colleague, which is how a B2B enquiry usually gets made.
 */
export function SearchBox({
  locale,
  defaultValue = "",
  autoFocus = false,
}: {
  locale: AppLocale;
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const t = (en: string, id: string) => (locale === "id" ? id : en);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(
      q
        ? `${localePath("/ideas/search", locale)}?q=${encodeURIComponent(q)}`
        : localePath("/ideas", locale),
    );
  }

  return (
    <form onSubmit={submit} role="search" className="flex w-full">
      <label htmlFor="idea-search" className="sr-only">
        {t("Search the Idea Library", "Cari di Pustaka Ide")}
      </label>
      <div className="flex w-full items-center border border-line bg-paper focus-within:border-red">
        <Search size={16} className="ml-4 shrink-0 text-muted" aria-hidden />
        <input
          id="idea-search"
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t(
            "Search products, tags or materials…",
            "Cari produk, tag, atau bahan…",
          )}
          className="w-full bg-transparent px-3 py-3.5 text-[0.9375rem] outline-none"
        />
        <button
          type="submit"
          className="shrink-0 self-stretch bg-ink px-6 font-display text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-red"
        >
          {t("Search", "Cari")}
        </button>
      </div>
    </form>
  );
}
