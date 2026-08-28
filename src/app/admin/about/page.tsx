import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ABOUT_SECTIONS, sectionBlocks } from "@/lib/page-content";
import { SectionEditor } from "@/components/admin/SectionEditor";

/**
 * About editor — FR-10.5.
 *
 * The page carries three photographs and the company's own account of itself,
 * which is the copy most likely to be revised and the copy a developer has
 * least business owning. All of it is editable here.
 */
export default async function AdminAbout({
  searchParams,
}: PageProps<"/admin/about">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const params = await searchParams;
  const key = String(params?.key ?? ABOUT_SECTIONS[0].key);
  const section = ABOUT_SECTIONS.find((s) => s.key === key) ?? ABOUT_SECTIONS[0];

  const [blocks, row] = await Promise.all([
    sectionBlocks("about."),
    db.pageContent.findUnique({ where: { key: section.key } }),
  ]);

  return (
    <SectionEditor
      title="About"
      viewHref="/about"
      sections={ABOUT_SECTIONS}
      current={section}
      blocks={blocks}
      hrefFor={(k) => `/admin/about?key=${k}`}
      updatedBy={row?.updatedBy}
      updatedAt={row?.updatedAt}
    />
  );
}
