import { z } from "zod";

/**
 * Start a Project — FR-6.1 to FR-6.7.
 *
 * FR-6.7 is the constraint that shapes this schema: nothing beyond contact
 * details and project type may be mandatory. A visitor who has an event and a
 * vague budget is exactly who this form is for, and demanding a quantity they
 * have not decided is how you lose them.
 */
/**
 * Attachment limits — FR-6.4, NFR-3.6.
 *
 * Shared so the form and the route cannot disagree. They did: the route
 * dropped anything oversized and the form still reported "your brief has
 * reached us", so a client could send a 12 MB deck and be told it arrived.
 * A silent discard on the only conversion path is worse than a rejection.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOADS = 5;
export const ALLOWED_UPLOAD_TYPES = new Set([
  "application/pdf", "image/png", "image/jpeg", "image/svg+xml",
  "application/zip", "application/msword", "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/postscript",
]);

export type UploadProblem =
  | { kind: "count" }
  | { kind: "size"; file: string }
  | { kind: "type"; file: string };

/**
 * The single decision about whether an attachment set is acceptable, so the
 * form and the route cannot drift apart. Returns the first problem found, or
 * null when everything is storable.
 */
export function checkUploads(
  files: { name: string; size: number; type: string }[],
): UploadProblem | null {
  if (files.length > MAX_UPLOADS) return { kind: "count" };
  const big = files.find((f) => f.size > MAX_UPLOAD_BYTES);
  if (big) return { kind: "size", file: big.name };
  // An empty type means the browser could not identify the file. The route
  // keeps those and derives an extension, so the form must not reject them.
  const wrong = files.find((f) => f.type && !ALLOWED_UPLOAD_TYPES.has(f.type));
  if (wrong) return { kind: "type", file: wrong.name };
  return null;
}

export const ENQUIRY_TYPES = [
  "EVENT",
  "CAMPAIGN",
  "CORPORATE_GIFT",
  "EMPLOYEE_GIFT",
  "VIP_GIFT",
  "PRODUCT_LAUNCH",
  "OTHER",
] as const;

export const enquirySchema = z.object({
  type: z.enum(ENQUIRY_TYPES).optional(),
  quantity: z.string().max(100).optional().or(z.literal("")),
  targetBudget: z.string().max(100).optional().or(z.literal("")),
  neededBy: z.string().max(40).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),

  // Required: without these there is no one to reply to.
  name: z.string().min(1, "required").max(120),
  email: z.string().email("invalid").max(254),

  company: z.string().max(160).optional().or(z.literal("")),
  phone: z.string().max(60).optional().or(z.literal("")),

  sourcePage: z.string().max(200).optional(),
  productSlug: z.string().max(160).optional(),
  locale: z.enum(["en", "id"]).default("en"),

  /**
   * Honeypot — must stay empty (FR-6.11).
   *
   * Deliberately permissive at the schema level. Constraining it to max(0)
   * would reject a filled honeypot as a validation error, which tells a bot
   * its submission was rejected and invites a retry with variations. The
   * route accepts and silently discards instead, so the bot sees success and
   * moves on.
   */
  companyWebsite: z.string().max(500).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const TYPE_LABELS: Record<
  (typeof ENQUIRY_TYPES)[number],
  { en: string; id: string }
> = {
  EVENT: { en: "Event", id: "Acara" },
  CAMPAIGN: { en: "Campaign", id: "Kampanye" },
  CORPORATE_GIFT: { en: "Corporate Gift", id: "Hadiah Korporat" },
  EMPLOYEE_GIFT: { en: "Employee Gift", id: "Hadiah Karyawan" },
  VIP_GIFT: { en: "VIP Gift", id: "Hadiah VIP" },
  PRODUCT_LAUNCH: { en: "Product Launch", id: "Peluncuran Produk" },
  OTHER: { en: "Something else", id: "Lainnya" },
};
