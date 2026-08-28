"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Labels are what the operator calls things, not what the schema calls them. */
const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/products/import", label: "Import" },
  { href: "/admin/products/photos", label: "Photos" },
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

  return (
    <nav className="mx-auto max-w-[1280px] px-6">
      <ul className="flex flex-wrap gap-1">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
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
