import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * FR-15.4/15.5 — the subscriber list stays Kadokowe's asset, exportable
 * independently of whichever provider sends the campaigns.
 */
export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const header = ["email", "status", "consented_at", "consent_language", "source_page", "created", "unsubscribed_at"];
  const body = rows.map((s) =>
    [s.email, s.status, s.consentAt?.toISOString(), s.consentLocale, s.sourcePage, s.createdAt.toISOString(), s.unsubscribedAt?.toISOString()]
      .map(esc).join(","),
  );

  return new NextResponse([header.join(","), ...body].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kadokowe-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
