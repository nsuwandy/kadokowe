import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/site";

/** NFR-3.9 — the session is destroyed server-side, not just cleared client-side. */
export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(`${SITE.url}/admin/login`, { status: 303 });
}
