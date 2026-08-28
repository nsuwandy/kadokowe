import { Resend } from "resend";
import { SITE } from "./site";

/**
 * Transactional email.
 *
 * Campaigns are deliberately not sent from here — FR-15.6 puts composition
 * and delivery in the email service provider's own interface. This module
 * handles only the messages the site itself must send: enquiry
 * acknowledgements, internal notifications, and newsletter confirmations.
 *
 * When RESEND_API_KEY is unset the send is logged rather than attempted, so
 * local development and CI work without credentials and a missing key never
 * takes down a form submission.
 */

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.MAIL_FROM ?? "Kadokowe <onboarding@resend.dev>";
const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Everything interpolated into these templates comes from a public form, so
 * it is escaped rather than trusted. An unescaped brand name is a script tag
 * in whatever mail client the client happens to read this in.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Attachment = { filename: string; content: Buffer };
type Mail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Attachment[];
};

async function send({ to, subject, html, replyTo, attachments }: Mail) {
  if (!resend) {
    console.info(`[email skipped — no RESEND_API_KEY] to=${to} subject=${subject}`);
    return { skipped: true as const };
  }
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    replyTo,
    attachments,
  });
  if (error) throw new Error(error.message);
  return { skipped: false as const };
}

/** Shared shell so every message looks like it came from the same company. */
function shell(body: string) {
  return `<div style="font-family:Helvetica,Arial,sans-serif;color:#0f0c0d;line-height:1.6;max-width:560px">
    <p style="font-size:15px;letter-spacing:.14em;font-weight:700;margin:0 0 24px">
      KADO<span style="color:#bf0001">KOWE</span>
    </p>
    ${body}
    <p style="margin-top:32px;padding-top:16px;border-top:1px solid #e2dfdb;font-size:12px;color:#7c766f">
      Kadokowe — More than gifts, we craft brand stories.
    </p>
  </div>`;
}

export async function sendConfirmationEmail({
  email,
  token,
  locale,
}: {
  email: string;
  token: string;
  locale: "en" | "id";
}) {
  const url = `${SITE.url}/api/newsletter/confirm?token=${token}`;
  const copy =
    locale === "id"
      ? {
          subject: "Konfirmasi langganan Kadokowe",
          lead: "Satu langkah lagi.",
          body: "Klik tombol di bawah untuk mengonfirmasi bahwa Anda ingin menerima ide, tren, dan proyek dari Kadokowe.",
          cta: "Konfirmasi langganan",
          ignore: "Jika Anda tidak mendaftar, abaikan email ini — tidak ada yang akan dikirim.",
        }
      : {
          subject: "Confirm your Kadokowe subscription",
          lead: "One more step.",
          body: "Click below to confirm you'd like ideas, trends and projects from Kadokowe.",
          cta: "Confirm subscription",
          ignore: "If you didn't sign up, ignore this email — nothing will be sent.",
        };

  return send({
    to: email,
    subject: copy.subject,
    html: shell(`
      <h1 style="font-size:22px;margin:0 0 12px">${copy.lead}</h1>
      <p style="margin:0 0 24px">${copy.body}</p>
      <p style="margin:0 0 24px">
        <a href="${url}" style="display:inline-block;background:#bf0001;color:#fff;text-decoration:none;padding:14px 24px;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">${copy.cta}</a>
      </p>
      <p style="font-size:13px;color:#7c766f;margin:0">${copy.ignore}</p>
    `),
  });
}

export async function sendEnquiryAcknowledgement({
  email,
  name,
  locale,
}: {
  email: string;
  name: string;
  locale: "en" | "id";
}) {
  const copy =
    locale === "id"
      ? {
          subject: "Kami menerima brief Anda — Kadokowe",
          lead: `Terima kasih, ${name}.`,
          body: "Brief Anda sudah sampai kepada kami. Tim kami akan meninjau dan kembali dengan pilihan — biasanya dalam satu hari kerja.",
        }
      : {
          subject: "We've got your brief — Kadokowe",
          lead: `Thank you, ${name}.`,
          body: "Your brief has reached us. We'll review it and come back with options — usually within one working day.",
        };

  return send({
    to: email,
    subject: copy.subject,
    html: shell(`
      <h1 style="font-size:22px;margin:0 0 12px">${copy.lead}</h1>
      <p style="margin:0">${copy.body}</p>
    `),
  });
}

export async function sendEnquiryNotification({
  enquiryId,
  name,
  company,
  email,
  phone,
  type,
  quantity,
  budget,
  neededBy,
  description,
  products,
}: {
  enquiryId: string;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  type?: string | null;
  quantity?: string | null;
  budget?: string | null;
  neededBy?: string | null;
  description?: string | null;
  products: string[];
}) {
  const to = process.env.ENQUIRY_NOTIFY_TO;
  if (!to) {
    console.info("[enquiry notification skipped — no ENQUIRY_NOTIFY_TO]");
    return { skipped: true as const };
  }

  const row = (k: string, v?: string | null) =>
    v ? `<tr><td style="padding:4px 12px 4px 0;color:#7c766f;font-size:13px">${k}</td><td style="padding:4px 0;font-size:13px">${v}</td></tr>` : "";

  return send({
    to,
    replyTo: email,
    subject: `New project enquiry — ${company || name}`,
    html: shell(`
      <h1 style="font-size:20px;margin:0 0 16px">New project enquiry</h1>
      <table style="border-collapse:collapse;margin-bottom:20px">
        ${row("Name", name)}
        ${row("Company", company)}
        ${row("Email", email)}
        ${row("Phone", phone)}
        ${row("Planning", type)}
        ${row("Quantity", quantity)}
        ${row("Budget/item", budget)}
        ${row("Needed by", neededBy)}
        ${row("Products", products.length ? products.join(", ") : null)}
      </table>
      ${description ? `<p style="margin:0 0 8px;color:#7c766f;font-size:13px">Project</p><p style="margin:0 0 20px">${description}</p>` : ""}
      <p style="font-size:12px;color:#7c766f;margin:0">Reference: ${enquiryId}</p>
    `),
  });
}


/**
 * A submitted cart — FR-6.x.
 *
 * The quotation request goes out as an attachment rather than as a table in
 * the body, because it is the same document the buyer downloaded. Kadokowe
 * and the customer discussing two different renderings of one basket is how a
 * conversation opens with a disagreement about what was actually asked for.
 *
 * Reply-to is the buyer, so answering the notification answers them.
 */
export async function sendCartNotification({
  reference,
  brand,
  name,
  email,
  phone,
  message,
  lines,
  total,
  pdf,
  attachments,
}: {
  reference: string;
  brand: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  lines: { name: string; quantity: number; packaging: string | null }[];
  total: string;
  pdf: Buffer;
  attachments: number;
}) {
  const to = process.env.ENQUIRY_NOTIFY_TO;
  if (!to) {
    console.info(`[cart notification skipped — no ENQUIRY_NOTIFY_TO] ${reference}`);
    return { skipped: true as const };
  }

  const rows = lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 12px 6px 0">${escapeHtml(l.name)}</td>` +
        `<td style="padding:6px 12px 6px 0;text-align:right">${l.quantity}</td>` +
        `<td style="padding:6px 0;color:#6b6664">${escapeHtml(l.packaging ?? "Product only")}</td></tr>`,
    )
    .join("");

  return send({
    to,
    replyTo: email,
    subject: `Quotation request ${reference} — ${brand}`,
    html: `
      <h2 style="margin:0 0 4px">Quotation request ${escapeHtml(reference)}</h2>
      <p style="margin:0 0 16px;color:#6b6664">The full request is attached as a PDF.</p>
      <p style="margin:0 0 4px"><strong>${escapeHtml(brand)}</strong></p>
      <p style="margin:0 0 16px">
        ${escapeHtml(name)} · <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
        ${phone ? ` · ${escapeHtml(phone)}` : ""}
      </p>
      <table style="border-collapse:collapse;font-size:14px">${rows}</table>
      <p style="margin:16px 0 0"><strong>Total:</strong> ${escapeHtml(total)}</p>
      ${message ? `<p style="margin:16px 0 0;white-space:pre-wrap">${escapeHtml(message)}</p>` : ""}
      ${attachments > 0 ? `<p style="margin:16px 0 0;color:#6b6664">${attachments} brand file${attachments === 1 ? "" : "s"} uploaded with this request.</p>` : ""}
      <p style="margin:24px 0 0;color:#6b6664;font-size:12px">${SITE.url}/admin/enquiries</p>
    `,
    attachments: [{ filename: `kadokowe-request-${reference}.pdf`, content: pdf }],
  });
}
