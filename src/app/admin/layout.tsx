import type { Metadata } from "next";
import Link from "next/link";
import { currentAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Kadokowe Admin",
  // FR-10.1 — not linked from the public site, and kept out of any index.
  robots: { index: false, follow: false },
};

/**
 * Admin shell.
 *
 * Deliberately plain. NFR-5.2 requires this be usable by a non-technical
 * operator after a short handover, and with no support agreement (decision
 * I16) the interface has to be legible without anyone to ask. Plain labels,
 * obvious controls, no cleverness.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await currentAdmin();

  // The login page renders inside this layout too, so an unauthenticated
  // visitor gets the bare shell rather than a redirect loop.
  if (!admin) {
    return <div className="min-h-screen bg-warm">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-warm">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 px-6 py-4">
          <Link href="/admin" className="font-display text-sm font-bold tracking-[0.14em]">
            KADO<span className="text-red">KOWE</span>
            <span className="ml-2 font-normal tracking-normal text-muted">admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-muted underline-offset-2 hover:underline"
            >
              View site ↗
            </Link>
            <span className="text-xs text-muted">{admin.email}</span>
            <form action="/api/admin/logout" method="post">
              <button className="text-xs font-semibold text-red hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="mx-auto max-w-[1280px] px-6 py-8">{children}</main>
    </div>
  );
}
