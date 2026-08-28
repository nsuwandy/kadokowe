import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PhotoImportForm } from "@/components/admin/PhotoImportForm";

/**
 * Bulk photography import.
 *
 * The catalogue is written through the CSV import and photographed
 * separately, often weeks apart and by someone else. Attaching a few hundred
 * images one product at a time is the kind of task that quietly does not get
 * finished, which is how a launch ends up half illustrated.
 */
export default async function PhotoImportPage() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");

  // Matching happens in the browser, so the whole catalogue is sent — slug and
  // name only, which stays small even at the thousand products the brief
  // anticipates.
  const products = await db.product.findMany({
    select: { slug: true, nameEn: true },
    orderBy: { nameEn: "asc" },
  });

  return (
    <div className="flex max-w-[900px] flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Import photographs</h1>
        <p className="mt-2 max-w-[70ch] text-sm text-muted">
          Upload one zip containing every product photograph. Each file is
          matched to a product by its name, and the number at the end decides
          where it goes: <strong>1 is the hero</strong>, 2 onwards fill the
          gallery in order.
        </p>
      </div>

      <PhotoImportForm
        products={products}
        cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? null}
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? null}
      />

      <section className="bg-paper p-6">
        <h2 className="mb-3 text-sm font-semibold">Naming</h2>
        <p className="mb-4 max-w-[70ch] text-sm text-muted">
          The product part must match the product&rsquo;s web address, or its
          name. Case, spaces and underscores do not matter —{" "}
          <code className="bg-warm px-1">Color Ballpoint Pen</code> and{" "}
          <code className="bg-warm px-1">color_ballpoint_pen</code> both find{" "}
          <code className="bg-warm px-1">color-ballpoint-pen</code>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["File", "Goes to"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["color_ballpoint_pen:1.jpg", "Hero image"],
                ["color_ballpoint_pen:2.jpg", "Gallery, first"],
                ["color_ballpoint_pen:3.jpg", "Gallery, second"],
                ["color_ballpoint_pen_2.jpg", "Gallery, first — underscore works too"],
                ["color_ballpoint_pen (2).jpg", "Gallery, first — so does this"],
              ].map(([file, meaning]) => (
                <tr key={file}>
                  <td className="px-3 py-2 font-mono text-xs">{file}</td>
                  <td className="px-3 py-2 text-xs text-muted">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 max-w-[70ch] text-xs text-muted">
          A colon cannot be typed into a filename on Windows, so{" "}
          <code className="bg-warm px-1">name_1</code>,{" "}
          <code className="bg-warm px-1">name-1</code> and{" "}
          <code className="bg-warm px-1">name (1)</code> are all accepted.
          Folders inside the zip are ignored, so organise it however suits you.
        </p>
      </section>

      <section className="bg-paper p-6">
        <h2 className="mb-3 text-sm font-semibold">What it changes</h2>
        <ul className="flex max-w-[70ch] flex-col gap-2 text-sm text-muted">
          <li>
            Products not named in the zip are left alone entirely.
          </li>
          <li>
            For a product that is named, the zip becomes the truth: its gallery
            is replaced rather than added to, so running the same zip twice
            gives the same result instead of doubling every image.
          </li>
          <li>
            A hero is only overwritten when the zip actually contains a{" "}
            <code className="bg-warm px-1">:1</code> for that product. A batch
            of extra angles will not wipe the hero you already have.
          </li>
          <li>
            You see every match before anything uploads, and nothing is written
            until you confirm.
          </li>
        </ul>
      </section>
    </div>
  );
}
