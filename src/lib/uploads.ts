import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage for client-supplied brand files and briefs — FR-6.4, NFR-3.6/3.7.
 *
 * Files are written under a private directory with a generated name, never
 * the client's own filename. Two reasons: the original name is attacker
 * controlled and can carry traversal or a misleading extension, and
 * NFR-3.7 requires these not be reachable by guessing a URL. Nothing here is
 * served statically — retrieval goes through an authenticated admin route.
 *
 * Local disk is the Phase 1a implementation. On a serverless host the
 * filesystem is ephemeral, so this moves to object storage before launch;
 * the interface is deliberately one function so that swap is contained.
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");

const EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/svg+xml": ".svg",
  "application/zip": ".zip",
  "application/postscript": ".ai",
};

export async function storeEnquiryFile(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  // Derive the extension from the declared type, falling back to a safe
  // slice of the original — never trusting the original name wholesale.
  const fromName = path.extname(file.name).slice(0, 8).replace(/[^.\w]/g, "");
  const ext = EXT_BY_TYPE[file.type] ?? (fromName || ".bin");

  const id = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, id), buffer);

  // Return the opaque id. The original filename is kept only in the record
  // the administrator sees, not in the path.
  return `${id}::${file.name.slice(0, 120)}`;
}
