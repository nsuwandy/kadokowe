import { z } from "zod";

/**
 * Start a Project — FR-6.1 to FR-6.7.
 *
 * FR-6.7 is the constraint that shapes this schema: nothing beyond contact
 * details and project type may be mandatory. A visitor who has an event and a
 * vague budget is exactly who this form is for, and demanding a quantity they
 * have not decided is how you lose them.
 */
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
