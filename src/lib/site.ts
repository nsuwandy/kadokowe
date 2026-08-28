/** Site-wide constants. Contact details come from the company profile. */

const rawNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "628113370378")
  // wa.me accepts digits only: no +, spaces or dashes. Stripping them here
  // means the variable can be pasted in whatever shape it was copied.
  .replace(/[^\d]/g, "");

/**
 * Format an Indonesian mobile number for display: 628113370378 becomes
 * +62 811-3370-378.
 *
 * Derived from the same value as the link rather than written out beside it.
 * The two were separate constants, so overriding the number changed every
 * WhatsApp button while five places on the site — footer, contact, Start a
 * Project, the privacy policy and the telephone field in structured data —
 * went on displaying the old one. That mismatch is invisible until a customer
 * says they messaged and nobody replied.
 */
function formatIdMobile(digits: string): string {
  if (!digits.startsWith("62") || digits.length < 10) return `+${digits}`;
  const national = digits.slice(2);
  const head = national.slice(0, 3);
  const rest = national.slice(3);
  const mid = rest.slice(0, rest.length - 3);
  const tail = rest.slice(-3);
  return `+62 ${head}-${mid}-${tail}`;
}

export const CONTACT = {
  email: "kreasikadokowe@gmail.com",
  phoneDisplay: formatIdMobile(rawNumber),
  whatsappNumber: rawNumber,
  whatsappUrl: `https://wa.me/${rawNumber}`,
} as const;

/**
 * The company profile PDF — FR-8.7.
 *
 * A URL rather than a file in the repository. The profile supplied is 28.7 MB,
 * which would sit in git history permanently and, more to the point, is a
 * punishing download on the mobile connections SRS §2.8 says most visitors
 * arrive on. Hosting it on Cloudinary — already in the stack, and able to
 * serve it compressed — costs nothing extra and can be replaced without a
 * deploy. The link hides itself when this is unset, so an unconfigured site
 * offers nothing broken.
 */
export const COMPANY_PROFILE_URL = process.env.NEXT_PUBLIC_COMPANY_PROFILE_URL || null;

export const SITE = {
  name: "Kadokowe",
  taglineEn: "More Than Gifts, We Craft Brand Stories.",
  taglineId: "Lebih Dari Sekadar Hadiah, Kami Merangkai Cerita Merek.",
  /**
   * Normalised without a trailing slash, because six call sites build URLs by
   * concatenating a leading-slash path onto it. A value pasted from a browser
   * address bar usually carries one, and the result is a double slash in
   * canonical tags, share URLs and the newsletter confirmation link — none of
   * which fails loudly. Fixed here rather than at each consumer.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
} as const;

/**
 * The message WhatsApp opens with — FR-1.4.
 *
 * Each one ends on a colon rather than a full stop, and that is deliberate.
 * WhatsApp drops the cursor at the end of the prefilled text, so a message
 * that reads as finished invites a contentless "hi" that costs two more
 * exchanges before anyone knows what is wanted. A line that visibly stops
 * mid-thought asks the visitor to say what they are planning while they are
 * still in the moment of wanting to.
 *
 * They are written in the visitor's language. WhatsApp is the site's primary
 * traffic source (SRS §2.8) and most of that traffic is Indonesian; opening
 * their keyboard on an English sentence they then have to talk around is a
 * small rudeness at exactly the wrong moment.
 */
const WHATSAPP_MESSAGES = {
  general: {
    en: "Hi Kadokowe! I'd like to talk about a merchandise project. Here's what I'm planning:",
    id: "Halo Kadokowe! Saya ingin berdiskusi tentang proyek merchandise. Ini rencana saya:",
  },
  project: {
    en: "Hi Kadokowe! I'd like to start a project. Here's what I'm planning:",
    id: "Halo Kadokowe! Saya ingin memulai proyek. Ini rencana saya:",
  },
  subject: {
    en: "Hi Kadokowe! I'm interested in {subject}. Here's what I'm planning:",
    id: "Halo Kadokowe! Saya tertarik dengan {subject}. Ini rencana saya:",
  },
} as const;

export type WhatsAppIntent = keyof typeof WHATSAPP_MESSAGES;

/**
 * An override for the message, per language.
 *
 * Read as two literal `process.env.NEXT_PUBLIC_*` expressions rather than by
 * a computed key, because Next inlines these at build time by matching the
 * literal name — a dynamic lookup resolves to undefined and falls silently
 * back to the default, which is the worst of both outcomes.
 *
 * The two languages fall back independently. Setting only the English one
 * leaves Indonesian visitors the written-in Indonesian message rather than an
 * English sentence they then have to talk around, which is the point of
 * having both.
 *
 * NOTE: NEXT_PUBLIC_ values are baked in when the site is built. Changing one
 * on the host does nothing until the site is redeployed.
 */
const MESSAGE_OVERRIDE: Record<"en" | "id", string | null> = {
  en: process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE_EN?.trim() || null,
  id: process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE_ID?.trim() || null,
};

/**
 * Build a WhatsApp deep link with the message already written.
 *
 * The previous version took an optional context and returned a bare link
 * without one — and all three callers passed nothing, so every WhatsApp button
 * on the site opened an empty chat. The message is no longer optional.
 */
export function whatsappLink(
  locale: "en" | "id" = "en",
  options?: { intent?: WhatsAppIntent; subject?: string },
) {
  const { intent, subject } = options ?? {};
  const lang = locale === "id" ? "id" : "en";

  // An override is used on every button, whatever the page. Someone who has
  // written their own opening line means it to be the opening line, not one
  // of three variants they cannot see the others of.
  const override = MESSAGE_OVERRIDE[lang];
  if (override) return `${CONTACT.whatsappUrl}?text=${encodeText(override)}`;

  const key: WhatsAppIntent = subject ? "subject" : (intent ?? "general");
  const message = WHATSAPP_MESSAGES[key][lang].replace("{subject}", subject ?? "");
  return `${CONTACT.whatsappUrl}?text=${encodeText(message)}`;
}

/**
 * encodeURIComponent leaves ! ' ( ) * literal, which is legal in a query
 * string and works in a browser — but these links get copied into QR
 * generators, shorteners and analytics tools, and an unescaped apostrophe is
 * exactly what a naive parser truncates the message at. Cheap to close.
 */
function encodeText(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
