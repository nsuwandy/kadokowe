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
 * Build a WhatsApp deep link carrying page context (FR-1.4).
 *
 * WhatsApp is both a contact channel and the site's primary traffic source
 * (SRS §2.8), so the message is pre-filled with where the visitor came from —
 * it saves them explaining, and tells Kadokowe which page prompted the
 * message.
 */
export function whatsappLink(context?: string) {
  if (!context) return CONTACT.whatsappUrl;
  const text = encodeURIComponent(`Hi Kadokowe, I'm enquiring about ${context}.`);
  return `${CONTACT.whatsappUrl}?text=${text}`;
}
