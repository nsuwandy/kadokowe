/** Site-wide constants. Contact details come from the company profile. */

const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "628113370378";

export const CONTACT = {
  email: "kreasikadokowe@gmail.com",
  phoneDisplay: "+62 811-3370-378",
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
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
