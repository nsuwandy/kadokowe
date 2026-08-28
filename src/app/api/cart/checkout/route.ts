import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkUploads } from "@/lib/enquiry-schema";
import { sendCartNotification } from "@/lib/email";
import { storeEnquiryFile } from "@/lib/uploads";
import { rateLimit, clientIp, LIMITS } from "@/lib/rate-limit";
import { resolveCart } from "@/app/[locale]/cart/actions";
import { buildCartPdf } from "@/lib/cart-pdf";
import { cartTotals } from "@/lib/cart";
import { formatPrice } from "@/lib/price";

/**
 * Cart checkout — FR-6.x.
 *
 * A checkout here submits a brief, not an order. It writes an Enquiry with a
 * line per product, generates the request as a PDF, sends that PDF to
 * Kadokowe and hands the same file back for the buyer to keep.
 *
 * The enquiry is written before anything is emailed, for the same reason the
 * project enquiry is: mail is the part most likely to fail, and losing a lead
 * because a notification bounced would defeat the point of the whole flow.
 */

const schema = z.object({
  brand: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  locale: z.enum(["en", "id"]).default("en"),
  /** Honeypot — a real person never fills this. */
  companyWebsite: z.string().max(200).optional().or(z.literal("")),
  lines: z
    .array(
      z.object({
        slug: z.string().min(1).max(200),
        quantity: z.number().int().min(1).max(1_000_000),
        packagingId: z.string().max(64).nullable(),
      }),
    )
    .min(1)
    .max(40),
});

/** Short, sayable over the phone, and unique enough for a day's traffic. */
function reference(id: string): string {
  return `KDK-${id.slice(-6).toUpperCase()}`;
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const allowed = rateLimit(`cart:${ip}`, LIMITS.enquiry);
  if (!allowed.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(allowed.retryAfterSeconds) } },
    );
  }

  let input: z.infer<typeof schema>;
  const uploads: string[] = [];

  try {
    const form = await request.formData();
    input = schema.parse(JSON.parse(String(form.get("payload") ?? "{}")));

    const files = form
      .getAll("uploads")
      .filter((f): f is File => f instanceof File && f.size > 0);

    // Validated before anything touches storage, and rejected rather than
    // dropped: answering "ok" while discarding a brand guideline tells the
    // buyer their files arrived when they did not.
    const problem = checkUploads(files);
    if (problem) {
      return NextResponse.json({ error: "upload", problem: problem.kind }, { status: 400 });
    }
    for (const file of files) uploads.push(await storeEnquiryFile(file));
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // Accept and discard, so a bot sees success and does not retry.
  if (input.companyWebsite) return NextResponse.json({ ok: true });

  // Prices come from the database, never from the request. A total the client
  // could name is a total the client could choose.
  const lines = await resolveCart(input.lines, input.locale);
  if (lines.length === 0) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  try {
    const enquiry = await db.enquiry.create({
      data: {
        name: input.name,
        email: input.email.trim().toLowerCase(),
        company: input.brand,
        phone: input.phone || null,
        description: input.message || null,
        sourcePage: "/cart",
        locale: input.locale === "id" ? "ID" : "EN",
        uploads,
        products: {
          create: lines.map((line) => ({
            product: { connect: { slug: line.slug } },
            quantity: line.quantity,
            packaging: line.packagingId
              ? { connect: { id: line.packagingId } }
              : undefined,
            unitPrice: line.unitPrice,
            unitPriceMax: line.unitPriceMax,
          })),
        },
      },
      select: { id: true, createdAt: true },
    });

    const ref = reference(enquiry.id);
    const pdf = await buildCartPdf({
      reference: ref,
      submittedAt: enquiry.createdAt,
      brand: input.brand,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      message: input.message || null,
      attachments: uploads,
      lines,
    });

    const totals = cartTotals(lines);
    // Never let a mail failure surface as a failed submission — the enquiry
    // is already saved and the buyer already has their document.
    const sent = await Promise.allSettled([
      sendCartNotification({
        reference: ref,
        brand: input.brand,
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        message: input.message || null,
        lines: lines.map((l) => ({
          name: l.name, quantity: l.quantity, packaging: l.packagingName,
        })),
        total: totals.quoteOnly
          ? "To be quoted"
          : formatPrice(totals.total, totals.totalMax) ?? "—",
        pdf: Buffer.from(pdf),
        attachments: uploads.length,
      }),
    ]);
    for (const result of sent) {
      if (result.status === "rejected") {
        console.error("Cart notification failed:", result.reason);
      }
    }

    return NextResponse.json({
      ok: true,
      reference: ref,
      filename: `kadokowe-request-${ref}.pdf`,
      pdf: Buffer.from(pdf).toString("base64"),
    });
  } catch (error) {
    console.error("Cart checkout failed:", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
