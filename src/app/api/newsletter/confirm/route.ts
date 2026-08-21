import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { syncSubscriber } from "@/lib/newsletter-provider";

/**
 * Confirms a double opt-in subscription — FR-15.2.
 *
 * The token is single-use and cleared on confirmation, so a forwarded or
 * logged link cannot be replayed to re-subscribe an address that has since
 * unsubscribed.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const back = (status: string) =>
    NextResponse.redirect(`${SITE.url}/newsletter/${status}`);

  if (!token) return back("invalid");

  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { confirmToken: token },
  });
  if (!subscriber) return back("invalid");

  await db.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
      consentAt: new Date(),
      confirmToken: null,
    },
  });

  // FR-15.4 — the provider gets the address only once consent is confirmed,
  // so an unconfirmed signup can never be mailed from a campaign. The sync is
  // best-effort and stamped, so a provider outage leaves a record to
  // reconcile rather than silently losing the subscriber.
  const synced = await syncSubscriber(
    subscriber.email,
    subscriber.consentLocale === "ID" ? "id" : "en",
  );
  if (synced) {
    await db.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { providerSyncedAt: new Date() },
    });
  }

  return back("confirmed");
}
