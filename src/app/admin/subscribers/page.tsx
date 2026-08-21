import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * FR-15.5 — subscriber list with consent evidence, searchable and exportable.
 *
 * Search is a plain GET so a filtered view can be bookmarked and shared, and
 * so it works before JavaScript loads. The status counts deliberately ignore
 * the search: they answer "how big is the list", which is not a question
 * about the current filter.
 */
export default async function AdminSubscribers({
  searchParams,
}: PageProps<"/admin/subscribers">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const q = String(params?.q ?? "").trim();
  const status = String(params?.status ?? "").trim().toUpperCase();

  const where = {
    ...(q ? { email: { contains: q, mode: "insensitive" as const } } : {}),
    ...(["CONFIRMED", "UNCONFIRMED", "UNSUBSCRIBED"].includes(status)
      ? { status: status as never }
      : {}),
  };

  const [subs, counts, matching] = await Promise.all([
    db.newsletterSubscriber.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 }),
    db.newsletterSubscriber.groupBy({ by: ["status"], _count: true }),
    db.newsletterSubscriber.count({ where }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Newsletter</h1>
        <a
          href={`/api/admin/subscribers.csv${
            q || status
              ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) })}`
              : ""
          }`}
          download
          className="ml-auto border border-line bg-paper px-4 py-2.5 text-xs font-semibold hover:border-ink"
        >
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

      <form method="get" className="flex flex-wrap items-end gap-3 bg-paper p-5">
        <label className="flex flex-1 flex-col gap-2" style={{ minWidth: "16rem" }}>
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
            Search by email
          </span>
          <input
            name="q"
            defaultValue={q}
            placeholder="part of an address"
            className="w-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-red"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-red"
          >
            <option value="">Any</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="UNCONFIRMED">Awaiting confirmation</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
          </select>
        </label>
        <button className="border border-ink bg-ink px-5 py-2.5 text-xs font-semibold text-paper hover:bg-red">
          Search
        </button>
        {(q || status) && (
          <Link href="/admin/subscribers" className="px-2 py-2.5 text-xs text-muted hover:text-red">
            Clear
          </Link>
        )}
        <span className="ml-auto self-center text-xs tabular-nums text-muted">
          {matching} {matching === 1 ? "subscriber" : "subscribers"}
          {subs.length < matching && ` — showing the first ${subs.length}`}
        </span>
      </form>

      {subs.length === 0 ? (
        <p className="bg-paper px-6 py-12 text-center text-sm text-muted">
          {q || status ? "No subscribers match that search." : "No subscribers yet."}
        </p>
      ) : (
        <div className="overflow-x-auto bg-paper">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["Email", "Status", "Consented", "From page", "Language", "Synced"].map((h) => (
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
                  <td className="px-5 py-3 text-xs tabular-nums text-muted">
                    {s.providerSyncedAt ? s.providerSyncedAt.toLocaleDateString("en-GB") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
