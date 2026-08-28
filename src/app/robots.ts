import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** NFR-6.2. Admin and API are excluded — neither belongs in an index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/newsletter/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
