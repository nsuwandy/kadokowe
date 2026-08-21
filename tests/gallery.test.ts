/** Run with: npm test */
import { galleryFrom } from "../src/lib/gallery";

const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${JSON.stringify(got)}`);
  if (!ok) { console.log(`      wanted: ${JSON.stringify(want)}`); process.exitCode = 1; }
};

const fd = (rows: [string, string][]) => {
  const f = new FormData();
  for (const [id, alt] of rows) { f.append("gallery_publicId", id); f.append("gallery_alt", alt); }
  return f;
};

check("empty", galleryFrom(fd([]), "gallery"), []);
check("two images in order",
  galleryFrom(fd([["a", "Alt A"], ["b", "Alt B"]]), "gallery"),
  [{ publicId: "a", altEn: "Alt A", sortOrder: 0 }, { publicId: "b", altEn: "Alt B", sortOrder: 1 }]);
// A row added and abandoned must not leave a hole in the ordering.
check("blank row dropped and order renumbered",
  galleryFrom(fd([["a", "Alt A"], ["", ""], ["c", "Alt C"]]), "gallery"),
  [{ publicId: "a", altEn: "Alt A", sortOrder: 0 }, { publicId: "c", altEn: "Alt C", sortOrder: 1 }]);
check("missing alt becomes null",
  galleryFrom(fd([["a", "   "]]), "gallery"),
  [{ publicId: "a", altEn: null, sortOrder: 0 }]);
check("whitespace-only id is not an image",
  galleryFrom(fd([["   ", "Alt"]]), "gallery"), []);
check("ids are trimmed",
  galleryFrom(fd([[" a ", " Alt "]]), "gallery"),
  [{ publicId: "a", altEn: "Alt", sortOrder: 0 }]);
