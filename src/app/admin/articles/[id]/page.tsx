import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { saveArticle } from "../actions";

/** Article editor — FR-8.5. `new` shares this route with edit. */
export default async function ArticleEditor({
  params,
}: PageProps<"/admin/articles/[id]">) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const isNew = id === "new";

  const article = isNew
    ? null
    : await db.article.findUnique({
        where: { id },
        include: {
          products: { select: { id: true } },
          projects: { select: { id: true } },
        },
      });

  if (!isNew && !article) notFound();

  const [products, projects] = await Promise.all([
    db.product.findMany({ orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true } }),
    db.project.findMany({ orderBy: { titleEn: "asc" }, select: { id: true, titleEn: true, client: true } }),
  ]);

  return (
    <div className="flex max-w-[900px] flex-col gap-6">
      <Link href="/admin/articles" className="text-xs font-semibold text-red hover:underline">
        ← All articles
      </Link>

      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="text-2xl font-bold">{isNew ? "Add article" : article!.titleEn}</h1>
        {article && article.visibility === "PUBLISHED" && (
          <Link href={`/insights/${article.slug}`} target="_blank" className="text-xs text-muted underline-offset-2 hover:underline">
            View on site ↗
          </Link>
        )}
      </div>

      <ArticleForm
        action={saveArticle}
        products={products}
        projects={projects}
        article={
          article
            ? {
                id: article.id,
                slug: article.slug,
                titleEn: article.titleEn,
                titleId: article.titleId,
                excerptEn: article.excerptEn,
                excerptId: article.excerptId,
                bodyEn: article.bodyEn,
                bodyId: article.bodyId,
                category: article.category,
                heroImage: article.heroImage,
                seoTitleEn: article.seoTitleEn,
                seoTitleId: article.seoTitleId,
                seoDescEn: article.seoDescEn,
                seoDescId: article.seoDescId,
                featured: article.featured,
                visibility: article.visibility,
                productIds: article.products.map((p) => p.id),
                projectIds: article.projects.map((p) => p.id),
              }
            : null
        }
      />
    </div>
  );
}
