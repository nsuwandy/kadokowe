/** Run with: npm test */
import { galleryFrom } from "../src/lib/gallery";

const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${JSON.stringify(got)}`);
  if (!ok) { console.log(`      wanted: ${JSON.stringify(want)}`); process.exitCode = 1; }
};

const fd = (rows: ([string, string] | [string, string, string])[]) => {
  const f = new FormData();
  for (const [id, alt, kind] of rows) {
    f.append("gallery_publicId", id);
    f.append("gallery_alt", alt);
    if (kind !== undefined) f.append("gallery_kind", kind);
  }
  return f;
};

check("empty", galleryFrom(fd([]), "gallery"), []);
check("two images in order",
  galleryFrom(fd([["a", "Alt A"], ["b", "Alt B"]]), "gallery"),
  [{ publicId: "a", altEn: "Alt A", kind: "IMAGE", sortOrder: 0 }, { publicId: "b", altEn: "Alt B", kind: "IMAGE", sortOrder: 1 }]);
// A row added and abandoned must not leave a hole in the ordering.
check("blank row dropped and order renumbered",
  galleryFrom(fd([["a", "Alt A"], ["", ""], ["c", "Alt C"]]), "gallery"),
  [{ publicId: "a", altEn: "Alt A", kind: "IMAGE", sortOrder: 0 }, { publicId: "c", altEn: "Alt C", kind: "IMAGE", sortOrder: 1 }]);
check("missing alt becomes null",
  galleryFrom(fd([["a", "   "]]), "gallery"),
  [{ publicId: "a", altEn: null, kind: "IMAGE", sortOrder: 0 }]);
check("whitespace-only id is not an image",
  galleryFrom(fd([["   ", "Alt"]]), "gallery"), []);
check("ids are trimmed",
  galleryFrom(fd([[" a ", " Alt "]]), "gallery"),
  [{ publicId: "a", altEn: "Alt", kind: "IMAGE", sortOrder: 0 }]);

// A form that never offered the choice must leave stills as stills, and an
// explicit VIDEO must survive.
check("explicit video kind",
  galleryFrom(fd([["a", "Alt", "VIDEO"]]), "gallery"),
  [{ publicId: "a", altEn: "Alt", kind: "VIDEO", sortOrder: 0 }]);
check("anything else is a still",
  galleryFrom(fd([["a", "Alt", "whatever"]]), "gallery"),
  [{ publicId: "a", altEn: "Alt", kind: "IMAGE", sortOrder: 0 }]);
