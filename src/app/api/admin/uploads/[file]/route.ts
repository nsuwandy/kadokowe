import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { resolveEnquiryFile } from "@/lib/uploads";

/**
 * Serve a client-supplied file to a signed-in administrator — NFR-3.7.
 *
 * These are client brand files and briefs, so they must never be reachable by
 * guessing a URL. Three defences: the route requires a session, the requested
 * name must match the exact shape storeEnquiryFile produces, and the storage
 * layer re-resolves the path inside its own directory before reading.
 *
 * Where files live in Cloudinary they are stored as authenticated assets with
 * no public delivery URL, and this route redirects to a signature that expires
 * in a minute — long enough to download, short enough that a link pasted into
 * a chat is dead on arrival.
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

  const resolved = await resolveEnquiryFile(file);
  if (!resolved) return new NextResponse("Not found", { status: 404 });

  if (resolved.kind === "url") {
    return NextResponse.redirect(resolved.url, { status: 302 });
  }

  return new NextResponse(new Uint8Array(resolved.data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
