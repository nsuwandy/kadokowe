import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const STATUSES = ["NEW", "CONTACTED", "PROPOSAL_SENT", "WON", "CLOSED"] as const;

/** FR-6.9 — a single enquiry, with status and internal notes. */
export default async function EnquiryDetail({
  params,
}: PageProps<"/admin/enquiries/[id]">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const enquiry = await db.enquiry.findUnique({
    where: { id },
    include: { products: { include: { product: { select: { nameEn: true, slug: true } } } } },
  });
  if (!enquiry) notFound();

  async function update(formData: FormData) {
    "use server";
    const me = await currentAdmin();
    if (!me) redirect("/admin/login");
    await db.enquiry.update({
      where: { id },
      data: {
        status: String(formData.get("status")) as never,
        notes: String(formData.get("notes") ?? "") || null,
      },
    });
    revalidatePath(`/admin/enquiries/${id}`);
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin");
  }

  const rows: [string, string | null][] = [
    ["Name", enquiry.name],
    ["Company", enquiry.company],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone],
    ["Planning", enquiry.type?.replace(/_/g, " ").toLowerCase() ?? null],
    ["Quantity", enquiry.quantity],
    ["Budget per item", enquiry.targetBudget],
    ["Needed by", enquiry.neededBy?.toLocaleDateString("en-GB") ?? null],
    ["Came from", enquiry.sourcePage],
    ["Language", enquiry.locale],
  ];

  return (
    <div className="flex max-w-[900px] flex-col gap-6">
      <Link href="/admin/enquiries" className="text-xs font-semibold text-red hover:underline">
        ← All enquiries
      </Link>

      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="text-2xl font-bold">{enquiry.company || enquiry.name}</h1>
        <span className="text-sm text-muted">
          {enquiry.createdAt.toLocaleString("en-GB")}
        </span>
        <a href={`mailto:${enquiry.email}`} className="ml-auto bg-red px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink">
          Reply by email
        </a>
      </div>

      <dl className="grid gap-px border border-line bg-line sm:grid-cols-2">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1 bg-paper p-4">
            <dt className="text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-muted">{k}</dt>
            <dd className="text-sm">{v}</dd>
          </div>
        ))}
      </dl>

      {enquiry.products.length > 0 && (
        <section className="bg-paper p-5">
          <h2 className="mb-2 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted">
            Products they asked about
          </h2>
          <ul className="flex flex-wrap gap-2">
            {enquiry.products.map((p) => (
              <li key={p.productId}>
                <Link href={`/ideas/${p.product.slug}`} target="_blank" className="border border-line px-3 py-1.5 text-xs font-semibold hover:border-ink">
                  {p.product.nameEn} ↗
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {enquiry.description && (
        <section className="bg-paper p-5">
          <h2 className="mb-2 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted">
            The project
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{enquiry.description}</p>
        </section>
      )}

      <form action={update} className="flex flex-col gap-4 bg-paper p-5">
        <label className="flex flex-col gap-2">
          <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted">Status</span>
          <select name="status" defaultValue={enquiry.status} className="border border-line px-4 py-2.5 text-sm">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ").toLowerCase()}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted">
            Internal notes
          </span>
          <textarea name="notes" rows={4} defaultValue={enquiry.notes ?? ""} className="border border-line px-4 py-3 text-sm outline-none focus:border-red" />
        </label>
        <button className="self-start bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-paper hover:bg-red">
          Save
        </button>
      </form>
    </div>
  );
}
