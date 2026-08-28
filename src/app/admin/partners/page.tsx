import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PartnersForm, type PartnerRow } from "@/components/admin/PartnersForm";
import { savePartners } from "./actions";

/** Our Partners, shown on About — FR-4.x. */
export default async function AdminPartners() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const partners = await db.partner.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, logo: true, url: true },
  });

  const rows: PartnerRow[] = partners.map((p) => ({
    id: p.id,
    name: p.name,
    logo: p.logo ?? "",
    url: p.url ?? "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Our Partners</h1>
        <p className="mt-2 max-w-[74ch] text-sm text-muted">
          Shown on the About page, in the order below. These are the partners
          and suppliers Kadokowe works with — distinct from the client strip on
          the homepage, which is drawn automatically from published projects.
        </p>
      </div>

      <PartnersForm action={savePartners} rows={rows} />
    </div>
  );
}
