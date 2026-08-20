import Script from "next/script";

/**
 * Web analytics — NFR-6.5, a Must.
 *
 * Traffic is the metric Kadokowe asked to track (SRS §8.6). Renders nothing
 * unless NEXT_PUBLIC_GA_ID is set, so development and preview builds do not
 * pollute the production property with their own traffic — the usual way a
 * young site's numbers become meaningless.
 *
 * `afterInteractive` rather than `beforeInteractive`: analytics must never sit
 * on the critical path of a first paint that NFR-1.2 caps at 2.5 seconds over
 * mobile, which is how most visitors arrive via WhatsApp.
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
