import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/** FR-6.12 — export for offline follow-up. */
export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await db.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: { products: { include: { product: { select: { nameEn: true } } } } },
  });

  // Escape every field: project descriptions routinely contain commas,
  // quotes and newlines, any of which would otherwise break the file.
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const header = [
    "created", "status", "name", "company", "email", "phone", "type",
    "quantity", "budget", "needed_by", "source_page", "language",
    "products", "description", "notes",
  ];

  const body = rows.map((e) =>
    [
      e.createdAt.toISOString(), e.status, e.name, e.company, e.email, e.phone,
      e.type, e.quantity, e.targetBudget,
      e.neededBy?.toISOString().slice(0, 10), e.sourcePage, e.locale,
      e.products.map((p) => p.product.nameEn).join(" | "),
      e.description, e.notes,
    ].map(esc).join(","),
  );

  return new NextResponse([header.join(","), ...body].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kadokowe-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
