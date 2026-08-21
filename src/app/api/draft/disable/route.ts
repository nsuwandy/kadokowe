import { NextResponse } from "next/server";
import { draftMode } from "next/headers";

/** Leave preview — FR-10.12. Open to anyone: turning it off is always safe. */
export async function GET(request: Request) {
  (await draftMode()).disable();
  const next = new URL(request.url).searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(new URL(safeNext, request.url));
}
