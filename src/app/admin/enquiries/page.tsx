import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const STATUSES = ["NEW", "CONTACTED", "PROPOSAL_SENT", "WON", "CLOSED"] as const;

/** FR-6.9, FR-10.7 — enquiry list with status filtering and CSV export. */
export default async function AdminEnquiries({
  searchParams,
}: PageProps<"/admin/enquiries">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const status = String(params?.status ?? "");
  const where: Prisma.EnquiryWhereInput = status ? { status: status as never } : {};

  const [enquiries, counts] = await Promise.all([
    db.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { products: { include: { product: { select: { nameEn: true } } } } },
    }),
    db.enquiry.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Enquiries</h1>
        <a
          href="/api/admin/enquiries.csv"
          download
          className="ml-auto border border-line bg-paper px-4 py-2.5 text-xs font-semibold hover:border-ink"
        >
          Export CSV ↓
        </a>
      </div>

      <nav className="flex flex-wrap gap-2">
        <Link
          href="/admin/enquiries"
          className={!status ? "bg-ink px-4 py-2 text-xs font-semibold text-paper" : "border border-line bg-paper px-4 py-2 text-xs font-semibold hover:border-ink"}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/enquiries?status=${s}`}
            className={status === s ? "bg-ink px-4 py-2 text-xs font-semibold text-paper" : "border border-line bg-paper px-4 py-2 text-xs font-semibold hover:border-ink"}
          >
            {s.replace(/_/g, " ").toLowerCase()} ({countFor(s)})
          </Link>
        ))}
      </nav>

      {enquiries.length === 0 ? (
        <p className="bg-paper px-6 py-12 text-center text-sm text-muted">
          Nothing here. Enquiries submitted on the website land in this list.
        </p>
      ) : (
        <ul className="divide-y divide-line bg-paper">
          {enquiries.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/enquiries/${e.id}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-6 py-4 hover:bg-warm">
                <span className="font-semibold">{e.company || e.name}</span>
                <span className="text-sm text-muted">{e.email}</span>
                {e.type && (
                  <span className="text-xs text-muted">{e.type.replace(/_/g, " ").toLowerCase()}</span>
                )}
                {e.products.length > 0 && (
                  <span className="text-xs text-muted">
                    about {e.products.map((p) => p.product.nameEn).join(", ")}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-3">
                  {e.status === "NEW" && (
                    <span className="bg-red px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-paper">New</span>
                  )}
                  {e.status !== "NEW" && (
                    <span className="text-[0.625rem] uppercase tracking-[0.12em] text-muted">
                      {e.status.replace(/_/g, " ").toLowerCase()}
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
    </div>
  );
}
