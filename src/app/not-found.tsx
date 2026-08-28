import Link from "next/link";

/**
 * Global 404 — FR-1.6.
 *
 * Sits above the [locale] root layout, so it cannot use the site chrome or
 * the locale param and renders its own minimal document. English only: an
 * unmatched URL carries no reliable locale to honour.
 */
export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#0f0c0d",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "44ch" }}>
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#bf0001",
              margin: "0 0 1rem",
            }}
          >
            404
          </p>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: "0 0 1rem",
            }}
          >
            That page isn&apos;t here.
          </h1>
          <p style={{ color: "#7c766f", lineHeight: 1.6, margin: "0 0 2rem" }}>
            It may have moved, or the link may be wrong. The Product Library is a
            good place to pick the thread back up.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <Link
              href="/products"
              style={{
                background: "#bf0001",
                color: "#fff",
                textDecoration: "none",
                padding: "1rem 1.75rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Explore products
            </Link>
            <Link
              href="/"
              style={{
                border: "1px solid #0f0c0d",
                color: "#0f0c0d",
                textDecoration: "none",
                padding: "1rem 1.75rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
