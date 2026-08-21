import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { rateLimit, clientIp, LIMITS } from "@/lib/rate-limit";

/**
 * Newsletter signup — FR-15.2, FR-15.7, FR-15.8.
 *
 * Double opt-in is not decoration here. Sending campaigns to recipients in
 * Indonesia engages Law No. 27 of 2022 on Personal Data Protection, which
 * requires demonstrable consent and a means of withdrawing it — so the
 * consent timestamp, the locale it was given in, and the originating page are
 * all recorded, and nothing is mailed until the address is confirmed.
 */

const Body = z.object({
  email: z.string().email().max(254),
  locale: z.enum(["en", "id"]).default("en"),
  sourcePage: z.string().max(200).optional(),
  // FR-15.8 — the honeypot has to be checked here, not only in the form. A
  // bot posting straight to this route never runs the form's JavaScript, so
  // a client-side check guards the one path an attacker does not take.
  // Permissive on purpose: rejecting at parse time returns 400, which tells
  // the bot to try again with the field removed.
  companyWebsite: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  // NFR-3.5 — signup sends a confirmation email to an address the submitter
  // chose, which makes an open endpoint a way to send mail to strangers over
  // Kadokowe's domain. Throttling protects the sending reputation, not just
  // the database.
  const ip = clientIp(request.headers);
  const allowed = rateLimit(`newsletter:${ip}`, LIMITS.newsletter);
  if (!allowed.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfterSeconds) } },
    );
  }

  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const email = parsed.email.trim().toLowerCase();
  const locale = parsed.locale === "id" ? "ID" : "EN";

  try {
    // Accept and discard, so a bot sees the same success a person does and
    // has no signal to retry differently.
    if (parsed.companyWebsite) {
      return NextResponse.json({ ok: true });
    }

    const existing = await db.newsletterSubscriber.findUnique({
      where: { email },
    });

    // Already confirmed: do nothing, but respond exactly as for a new signup.
    // Distinguishing the cases would confirm list membership to anyone who
    // can type an address (FR-15.8).
    if (existing?.status === "CONFIRMED") {
      return NextResponse.json({ ok: true });
    }

    const confirmToken = randomUUID();

    const subscriber = await db.newsletterSubscriber.upsert({
      where: { email },
      update: {
        confirmToken,
        status: "UNCONFIRMED",
        consentLocale: locale,
        sourcePage: parsed.sourcePage,
      },
      create: {
        email,
        confirmToken,
        status: "UNCONFIRMED",
        consentLocale: locale,
        sourcePage: parsed.sourcePage,
      },
    });

    await sendConfirmationEmail({
      email,
      token: confirmToken,
      locale: parsed.locale,
    });

    return NextResponse.json({ ok: true, id: subscriber.id });
  } catch (error) {
    console.error("newsletter signup failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
