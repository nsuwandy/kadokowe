import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

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
});

export async function POST(request: Request) {
  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const email = parsed.email.trim().toLowerCase();
  const locale = parsed.locale === "id" ? "ID" : "EN";

  try {
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
