"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Labels are what the operator calls things, not what the schema calls them. */
const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/home", label: "Homepage" },
  { href: "/admin/about", label: "About" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/products/grid", label: "Bulk table" },
  { href: "/admin/products/import", label: "Import CSV" },
  { href: "/admin/products/photos", label: "Photos" },
  { href: "/admin/packaging", label: "Packaging" },
  { href: "/admin/craft", label: "Custom Made" },
  { href: "/admin/projects", label: "Our Work" },
  { href: "/admin/articles", label: "Insights" },
  { href: "/admin/pages", label: "Page copy" },
  { href: "/admin/taxonomy", label: "Categories" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/subscribers", label: "Newsletter" },
];

export function AdminNav() {
  const pathname = usePathname();

  // Longest match wins. Several tabs live under /admin/products, and a plain
  // startsWith lights up both "Products" and the sub-page the operator is
  // actually on — which reads as though they are somewhere they are not.
  const current = LINKS.reduce<string | null>((best, l) => {
    const hit = l.exact ? pathname === l.href : pathname.startsWith(l.href);
    if (!hit) return best;
    return best === null || l.href.length > best.length ? l.href : best;
  }, null);

  return (
    <nav className="mx-auto max-w-[1280px] px-6">
      <ul className="flex flex-wrap gap-1">
        {LINKS.map((l) => {
          const active = current === l.href;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-block border-b-2 px-3 py-3 text-[0.8125rem] font-semibold transition-colors",
                  active
                    ? "border-red text-red"
                    : "border-transparent text-muted hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
