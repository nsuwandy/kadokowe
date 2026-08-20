import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/** FR-10.x dashboard — what needs attention, before what exists. */
export default async function AdminDashboard() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const [newEnquiries, totalEnquiries, products, drafts, subscribers, projects, articles] =
    await Promise.all([
      db.enquiry.count({ where: { status: "NEW" } }),
      db.enquiry.count(),
      db.product.count({ where: { visibility: "PUBLISHED" } }),
      db.product.count({ where: { visibility: "DRAFT" } }),
      db.newsletterSubscriber.count({ where: { status: "CONFIRMED" } }),
      db.project.count({ where: { visibility: "PUBLISHED" } }),
      db.article.count({ where: { visibility: "PUBLISHED" } }),
    ]);

  const recent = await db.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { products: { include: { product: { select: { nameEn: true } } } } },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back{admin.name ? `, ${admin.name}` : ""}.</h1>
        <p className="mt-1 text-sm text-muted">
          {newEnquiries > 0
            ? `${newEnquiries} new ${newEnquiries === 1 ? "enquiry" : "enquiries"} waiting.`
            : "No new enquiries right now."}
        </p>
      </div>

      <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "New enquiries", value: newEnquiries, href: "/admin/enquiries", accent: newEnquiries > 0 },
          { label: "Published products", value: products, href: "/admin/products" },
          { label: "Product drafts", value: drafts, href: "/admin/products?visibility=DRAFT" },
          { label: "Newsletter subscribers", value: subscribers, href: "/admin/subscribers" },
        ].map((s) => (
          <li key={s.label} className="bg-paper">
            <Link href={s.href} className="flex flex-col gap-1 p-6 hover:bg-warm">
              <span className={`text-3xl font-bold tabular-nums ${s.accent ? "text-red" : ""}`}>
                {s.value}
              </span>
              <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">
                {s.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="bg-paper">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">Latest enquiries</h2>
          <Link href="/admin/enquiries" className="text-xs font-semibold text-red hover:underline">
            See all {totalEnquiries}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            Nothing yet. Enquiries from the website land here.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/enquiries/${e.id}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-6 py-4 hover:bg-warm">
                  <span className="font-semibold">{e.company || e.name}</span>
                  <span className="text-sm text-muted">{e.email}</span>
                  {e.products.length > 0 && (
                    <span className="text-xs text-muted">
                      about {e.products.map((p) => p.product.nameEn).join(", ")}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-3">
                    {e.status === "NEW" && (
                      <span className="bg-red px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-paper">
                        New
                      </span>
                    )}
                    <span className="text-xs tabular-nums text-muted">
                      {e.createdAt.toLocaleDateString("en-GB")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted">
        {projects} published projects · {articles} published articles
      </p>
    </div>
  );
}
