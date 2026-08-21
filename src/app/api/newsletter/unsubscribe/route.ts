import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { unsubscribeAtProvider } from "@/lib/newsletter-provider";

/**
 * One-click unsubscribe — FR-15.3.
 *
 * Takes effect on the first request with no confirmation step and no login.
 * The token is long-lived precisely so this works from any campaign email
 * without a session; making someone sign in to leave a list they never signed
 * into is the pattern the requirement exists to prevent.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const back = (status: string) =>
    NextResponse.redirect(`${SITE.url}/newsletter/${status}`);

  if (!token) return back("invalid");

  const subscriber = await db.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!subscriber) return back("invalid");

  await db.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  });

  // FR-15.4 — mirrored to the provider so a campaign composed there cannot
  // reach someone who has left. Local status is written first and is
  // authoritative: if this call fails the person is still unsubscribed.
  await unsubscribeAtProvider(subscriber.email);

  return back("unsubscribed");
}

/** RFC 8058 one-click unsubscribe: mail clients POST rather than follow a link. */
export async function POST(request: Request) {
  return GET(request);
}
