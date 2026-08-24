import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

/**
 * Storage for client-supplied brand files and briefs — FR-6.4, NFR-3.6/3.7.
 *
 * Two backends, chosen by whether Cloudinary is configured.
 *
 * Cloudinary is the one that matters in production. The original
 * implementation wrote to local disk, which works on a long-lived server and
 * silently loses every file on a serverless host: the function writes the
 * brief, the invocation ends, the disk goes with it, and the enquiry lists an
 * attachment the administrator cannot open. Nothing errors — the loss is only
 * visible when someone tries to read a brief that mattered.
 *
 * Local disk is kept for development, so the form works without credentials.
 *
 * Files are uploaded as `authenticated` raw assets, which Cloudinary refuses
 * to serve from an ordinary delivery URL. That is what satisfies NFR-3.7:
 * there is no public address to guess, and retrieval goes through an admin
 * route that signs a short-lived URL only after checking the session.
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");
const FOLDER = "kadokowe/enquiries";

const EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/svg+xml": ".svg",
  "application/zip": ".zip",
  "application/postscript": ".ai",
  "application/msword": ".doc",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
};

function configured() {
  const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
  cloudinary.config({
    cloud_name: cloud,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

/** Extension from the declared type, never the client's filename wholesale. */
function extensionFor(file: File) {
  const fromName = path.extname(file.name).slice(0, 8).replace(/[^.\w]/g, "");
  return EXT_BY_TYPE[file.type] ?? (fromName || ".bin");
}

/**
 * Store one file and return `id::original name`.
 *
 * The id is generated, never the client's filename — that string is attacker
 * controlled and can carry traversal or a misleading extension. The original
 * name survives only in the record the administrator reads.
 */
export async function storeEnquiryFile(file: File): Promise<string> {
  const ext = extensionFor(file);
  const id = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const label = file.name.slice(0, 120);

  if (configured()) {
    await new Promise<void>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "raw",
            // Not "upload": an authenticated asset has no public delivery URL.
            type: "authenticated",
            folder: FOLDER,
            public_id: id,
            // The id already carries the extension; letting Cloudinary add its
            // own produces "file.pdf.pdf" and breaks the download name.
            use_filename: false,
            unique_filename: false,
          },
          (error) => (error ? reject(error) : resolve()),
        )
        .end(buffer);
    });
    return `${id}::${label}`;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, id), buffer);
  return `${id}::${label}`;
}

/**
 * Resolve a stored file for an administrator who has already been
 * authenticated by the calling route.
 *
 * Returns either bytes to stream (local disk) or a short-lived signed URL to
 * redirect to (Cloudinary). The URL expires so that a link copied out of the
 * address bar stops working rather than becoming a permanent public handle to
 * a client's brief.
 */
export async function resolveEnquiryFile(
  id: string,
): Promise<{ kind: "bytes"; data: Buffer } | { kind: "url"; url: string } | null> {
  if (configured()) {
    const ext = path.extname(id).replace(".", "");
    const url = cloudinary.utils.private_download_url(`${FOLDER}/${id}`, ext, {
      resource_type: "raw",
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 60,
    });
    return { kind: "url", url };
  }

  const full = path.join(UPLOAD_DIR, id);
  // Re-resolve inside the directory so a traversal attempt cannot escape it,
  // even though the caller has already checked the shape of the name.
  if (path.dirname(path.resolve(full)) !== path.resolve(UPLOAD_DIR)) return null;
  try {
    return { kind: "bytes", data: await readFile(full) };
  } catch {
    return null;
  }
}
