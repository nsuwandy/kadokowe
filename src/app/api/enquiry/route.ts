import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enquirySchema, TYPE_LABELS } from "@/lib/enquiry-schema";
import { sendEnquiryAcknowledgement, sendEnquiryNotification } from "@/lib/email";

/**
 * Project enquiry — FR-6.8 to FR-6.11.
 *
 * The enquiry is persisted before any email is attempted. Mail is the part
 * most likely to fail — a provider outage, a bad key, a rate limit — and
 * losing a lead because a notification bounced would defeat the point of the
 * site's only conversion. Delivery problems are logged; the visitor still
 * gets a confirmation.
 */
export async function POST(request: Request) {
  let input;
  try {
    input = enquirySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // Honeypot: accept and discard so a bot sees success and does not retry.
  if (input.companyWebsite) {
    return NextResponse.json({ ok: true });
  }

  try {
    const product = input.productSlug
      ? await db.product.findUnique({
          where: { slug: input.productSlug },
          select: { id: true, nameEn: true },
        })
      : null;

    const enquiry = await db.enquiry.create({
      data: {
        type: input.type,
        quantity: input.quantity || null,
        targetBudget: input.targetBudget || null,
        neededBy: input.neededBy ? new Date(input.neededBy) : null,
        description: input.description || null,
        name: input.name,
        email: input.email.trim().toLowerCase(),
        company: input.company || null,
        phone: input.phone || null,
        sourcePage: input.sourcePage || null,
        locale: input.locale === "id" ? "ID" : "EN",
        // FR-6.10 — a product-page enquiry keeps its product automatically.
        products: product
          ? { create: [{ product: { connect: { id: product.id } } }] }
          : undefined,
      },
    });

    // Fire both, but never let a mail failure surface as a failed submission.
    const results = await Promise.allSettled([
      sendEnquiryAcknowledgement({
        email: input.email,
        name: input.name,
        locale: input.locale,
      }),
      sendEnquiryNotification({
        enquiryId: enquiry.id,
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone,
        type: input.type ? TYPE_LABELS[input.type].en : null,
        quantity: input.quantity,
        budget: input.targetBudget,
        neededBy: input.neededBy,
        description: input.description,
        products: product ? [product.nameEn] : [],
      }),
    ]);

    for (const r of results) {
      if (r.status === "rejected") {
        console.error("enquiry email failed", enquiry.id, r.reason);
      }
    }

    return NextResponse.json({ ok: true, id: enquiry.id });
  } catch (error) {
    console.error("enquiry submission failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
