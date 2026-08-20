import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { STORY_SECTIONS } from "@/lib/editor-shared";
import { saveProject } from "../actions";

/** Project editor — FR-7.7, FR-10.3. `new` shares this route with edit. */
export default async function ProjectEditor({
  params,
}: PageProps<"/admin/projects/[id]">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const isNew = id === "new";

  const project = isNew
    ? null
    : await db.project.findUnique({
        where: { id },
        include: { products: { select: { id: true } } },
      });

  if (!isNew && !project) notFound();

  const products = await db.product.findMany({
    orderBy: { nameEn: "asc" },
    select: { id: true, nameEn: true },
  });

  const sections: Record<string, string | null> = {};
  if (project) {
    const row = project as unknown as Record<string, string | null>;
    for (const s of STORY_SECTIONS) {
      sections[`${s.key}En`] = row[`${s.key}En`] ?? null;
      sections[`${s.key}Id`] = row[`${s.key}Id`] ?? null;
    }
  }

  return (
    <div className="flex max-w-[900px] flex-col gap-6">
      <Link href="/admin/projects" className="text-xs font-semibold text-red hover:underline">
        ← All projects
      </Link>

      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="text-2xl font-bold">{isNew ? "Add project" : project!.titleEn}</h1>
        {project && project.visibility === "PUBLISHED" && (
          <Link href={`/our-work/${project.slug}`} target="_blank" className="text-xs text-muted underline-offset-2 hover:underline">
            View on site ↗
          </Link>
        )}
      </div>

      <ProjectForm
        action={saveProject}
        products={products}
        project={
          project
            ? {
                id: project.id,
                slug: project.slug,
                titleEn: project.titleEn,
                titleId: project.titleId,
                client: project.client,
                industry: project.industry,
                summaryEn: project.summaryEn,
                summaryId: project.summaryId,
                sections,
                heroImage: project.heroImage,
                featured: project.featured,
                visibility: project.visibility,
                productIds: project.products.map((p) => p.id),
              }
            : null
        }
      />
    </div>
  );
}
