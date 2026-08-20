/** Run with: npm test */
import { checkUploads, MAX_UPLOAD_BYTES, MAX_UPLOADS } from "../src/lib/enquiry-schema";

const f = (name: string, size: number, type: string) => ({ name, size, type });
const pdf = "application/pdf";

const check = (label: string, files: ReturnType<typeof f>[], expected: unknown) => {
  const got = checkUploads(files);
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${JSON.stringify(got)}`);
  if (!ok) { console.log(`      wanted: ${JSON.stringify(expected)}`); process.exitCode = 1; }
};

check("no files", [], null);
check("one valid pdf", [f("brief.pdf", 1000, pdf)], null);
check("exactly at the size limit", [f("brief.pdf", MAX_UPLOAD_BYTES, pdf)], null);
check("one byte over", [f("brief.pdf", MAX_UPLOAD_BYTES + 1, pdf)], { kind: "size", file: "brief.pdf" });
check("exactly max count", Array.from({ length: MAX_UPLOADS }, (_, i) => f(`a${i}.pdf`, 10, pdf)), null);
check("one over max count", Array.from({ length: MAX_UPLOADS + 1 }, (_, i) => f(`a${i}.pdf`, 10, pdf)), { kind: "count" });
check("disallowed type", [f("notes.exe", 10, "application/x-msdownload")], { kind: "type", file: "notes.exe" });
// The route keeps files the browser could not identify, so the form must too.
check("empty type passes", [f("mystery", 10, "")], null);
check("docx accepted", [f("brief.docx", 10, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")], null);
check("pptx accepted", [f("deck.pptx", 10, "application/vnd.openxmlformats-officedocument.presentationml.presentation")], null);
check("count reported before size", Array.from({ length: MAX_UPLOADS + 1 }, () => f("big.pdf", MAX_UPLOAD_BYTES + 1, pdf)), { kind: "count" });
