import sanitizeHtml from "sanitize-html";

/**
 * Sanitise article body HTML before rendering.
 *
 * Only an authenticated administrator can write this content, so this is
 * defence in depth rather than the primary control — but a single compromised
 * admin session should not become stored XSS for every visitor, and the cost
 * of being wrong about that is far higher than the cost of the filter.
 *
 * The allow-list matches exactly what the editor can produce. Anything else
 * arriving in the column did not come from the editor, which is reason enough
 * to drop it.
 */
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p", "br", "strong", "em", "s",
      "h2", "h3",
      "ul", "ol", "li",
      "blockquote",
      "a", "img",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    // No data: or javascript: sources — an image src is a URL, not a payload.
    allowedSchemes: ["http", "https", "mailto"],
    // Dropping a disallowed scheme leaves the tag behind with no src, which
    // renders as a broken-image icon and its alt text — visibly worse than
    // the attack it prevented. Remove the element outright instead.
    exclusiveFilter: (frame) =>
      frame.tag === "img" && !frame.attribs.src,
    transformTags: {
      // Any link an author adds points off-site; make that safe by default.
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer", target: "_blank" },
      }),
    },
  });
}
