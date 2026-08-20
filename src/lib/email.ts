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

type Mail = { to: string; subject: string; html: string; replyTo?: string };

async function send({ to, subject, html, replyTo }: Mail) {
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
