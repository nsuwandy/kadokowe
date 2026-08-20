import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { importTemplateCsv } from "@/lib/product-import";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  return new NextResponse(importTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kadokowe-products-template.csv"',
    },
  });
}
