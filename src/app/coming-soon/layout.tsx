import { Poppins, Lora } from "next/font/google";
import "../globals.css";

/**
 * Root layout for the holding page.
 *
 * A third root layout alongside [locale] and /admin. The holding page sits
 * outside the locale segment — the proxy sends every public request here
 * before locale routing runs — so it cannot inherit that layout's <html>, and
 * there is no shared root layout to inherit from.
 *
 * The brand faces are loaded because the point of a holding page is that it
 * looks like the company, not like a default.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
