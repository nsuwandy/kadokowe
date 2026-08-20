import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/** FR-15.5 — subscriber list with consent evidence. */
export default async function AdminSubscribers() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const [subs, counts] = await Promise.all([
    db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    db.newsletterSubscriber.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Newsletter</h1>
        <a href="/api/admin/subscribers.csv" download className="ml-auto border border-line bg-paper px-4 py-2.5 text-xs font-semibold hover:border-ink">
          Export CSV ↓
        </a>
      </div>

      <ul className="grid gap-px border border-line bg-line sm:grid-cols-3">
        {[
          ["Confirmed", countFor("CONFIRMED")],
          ["Awaiting confirmation", countFor("UNCONFIRMED")],
          ["Unsubscribed", countFor("UNSUBSCRIBED")],
        ].map(([label, n]) => (
          <li key={String(label)} className="flex flex-col gap-1 bg-paper p-6">
            <span className="text-3xl font-bold tabular-nums">{n}</span>
            <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">{label}</span>
          </li>
        ))}
      </ul>

      <p className="max-w-[70ch] border-l-2 border-red bg-paper px-5 py-4 text-sm text-muted">
        Only confirmed addresses may be mailed. Campaigns are written and sent in
        your email provider, not here — this list is the record of who consented,
        when, and from which page.
      </p>

      {subs.length === 0 ? (
        <p className="bg-paper px-6 py-12 text-center text-sm text-muted">No subscribers yet.</p>
      ) : (
        <div className="overflow-x-auto bg-paper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["Email", "Status", "Consented", "From page", "Language"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3">{s.email}</td>
                  <td className="px-5 py-3">
                    <span className={s.status === "CONFIRMED" ? "text-xs font-semibold text-red" : "text-xs text-muted"}>
                      {s.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs tabular-nums text-muted">
                    {s.consentAt ? s.consentAt.toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{s.sourcePage ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-muted">{s.consentLocale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
