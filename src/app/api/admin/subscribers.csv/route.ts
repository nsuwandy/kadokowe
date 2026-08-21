import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * FR-15.4/15.5 — the subscriber list stays Kadokowe's asset, exportable
 * independently of whichever provider sends the campaigns.
 */
export async function GET(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  // The export honours whatever the list is currently filtered to. Exporting
  // the whole list after searching would quietly hand back something other
  // than what is on screen, which is how the wrong list gets emailed.
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = (url.searchParams.get("status") ?? "").trim().toUpperCase();
  const where = {
    ...(q ? { email: { contains: q, mode: "insensitive" as const } } : {}),
    ...(["CONFIRMED", "UNCONFIRMED", "UNSUBSCRIBED"].includes(status)
      ? { status: status as never }
      : {}),
  };

  const rows = await db.newsletterSubscriber.findMany({ where, orderBy: { createdAt: "desc" } });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const header = ["email", "status", "consented_at", "consent_language", "source_page", "created", "unsubscribed_at", "provider_synced_at"];
  const body = rows.map((s) =>
    [s.email, s.status, s.consentAt?.toISOString(), s.consentLocale, s.sourcePage, s.createdAt.toISOString(), s.unsubscribedAt?.toISOString(), s.providerSyncedAt?.toISOString()]
      .map(esc).join(","),
  );

  return new NextResponse([header.join(","), ...body].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kadokowe-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
