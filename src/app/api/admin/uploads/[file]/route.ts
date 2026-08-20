import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { currentAdmin } from "@/lib/auth";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");

/**
 * Serve a client-supplied file to a signed-in administrator — NFR-3.7.
 *
 * These are client brand files and briefs, so they must never be reachable by
 * guessing a URL. Two defences: the route requires a session, and the
 * requested name is checked against a strict pattern and re-resolved inside
 * the upload directory, so a traversal attempt cannot escape it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const admin = await currentAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const { file } = await params;

  // Only the shape storeEnquiryFile produces: a uuid plus a short extension.
  if (!/^[0-9a-f-]{36}\.[A-Za-z0-9]{1,8}$/.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const full = path.join(UPLOAD_DIR, file);
  if (path.dirname(path.resolve(full)) !== path.resolve(UPLOAD_DIR)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await readFile(full);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
