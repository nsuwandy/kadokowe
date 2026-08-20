import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";

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

  return back("confirmed");
}
