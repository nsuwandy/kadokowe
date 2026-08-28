"use client";

import { useState } from "react";
import { unzip } from "fflate";
import {
  isIgnorableEntry,
  parsePhotoName,
  planPhotoImport,
  type ParsedPhoto,
  type PhotoIssue,
  type PhotoPlan,
} from "@/lib/photo-import";
import { applyPhotoImport } from "@/app/admin/products/photos/actions";

/**
 * Bulk photography import.
 *
 * Two stages on purpose: read the zip and show what it will do, then upload.
 * The operation overwrites hero images across the catalogue, and a preview is
 * the difference between "290 photographs matched" and discovering afterwards
 * that a typo sent half of them nowhere.
 *
 * Everything heavy happens here rather than on the server. The zip is
 * unpacked in the browser and each image is uploaded straight to Cloudinary;
 * only the resulting mapping is posted. A serverless request body is capped at
 * 4.5 MB, so a server-side unzip would fail on any real batch.
 */
type Stage =
  | { name: "idle" }
  | { name: "reading" }
  | { name: "planned"; plan: PhotoPlan; files: Map<string, Uint8Array> }
  | { name: "uploading"; done: number; total: number }
  | { name: "done"; message: string; updated: number; failures: { slug: string; problem: string }[] }
  | { name: "error"; message: string };

export function PhotoImportForm({
  products,
  cloudName,
  uploadPreset,
}: {
  products: { slug: string; nameEn: string }[];
  cloudName: string | null;
  uploadPreset: string | null;
}) {
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const ready = Boolean(cloudName && uploadPreset);

  async function readZip(file: File) {
    setStage({ name: "reading" });
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) =>
        unzip(buffer, (err, data) => (err ? reject(err) : resolve(data))),
      );

      const parsed: ParsedPhoto[] = [];
      const issues: PhotoIssue[] = [];
      const files = new Map<string, Uint8Array>();

      for (const [path, bytes] of Object.entries(entries)) {
        if (isIgnorableEntry(path)) continue;
        const result = parsePhotoName(path);
        if ("problem" in result) {
          // A stray text file is not worth reporting as a failure.
          if (!result.problem.startsWith("Not an image")) issues.push(result);
          continue;
        }
        parsed.push(result);
        files.set(path, bytes);
      }

      const plan = planPhotoImport(parsed, products);
      setStage({
        name: "planned",
        plan: { ...plan, issues: [...issues, ...plan.issues] },
        files,
      });
    } catch {
      setStage({
        name: "error",
        message: "That file could not be read as a zip archive.",
      });
    }
  }

  async function upload(bytes: Uint8Array, name: string): Promise<string> {
    const body = new FormData();
    const copy = new Uint8Array(bytes);
    body.append("file", new Blob([copy]), name);
    body.append("upload_preset", uploadPreset!);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body },
    );
    if (!response.ok) throw new Error(`Upload failed for ${name}`);
    const json = (await response.json()) as { public_id?: string };
    if (!json.public_id) throw new Error(`No public ID returned for ${name}`);
    return json.public_id;
  }

  async function apply(plan: PhotoPlan, files: Map<string, Uint8Array>) {
    const total = plan.assignments.reduce(
      (n, a) => n + (a.hero ? 1 : 0) + a.gallery.length,
      0,
    );
    setStage({ name: "uploading", done: 0, total });

    let done = 0;
    const payload: { slug: string; hero: string | null; gallery: string[] }[] = [];

    try {
      for (const assignment of plan.assignments) {
        let hero: string | null = null;
        const gallery: string[] = [];

        // Sequential rather than parallel: a catalogue upload is a few hundred
        // requests, and firing them at once trips Cloudinary's rate limit and
        // saturates the operator's upstream.
        if (assignment.hero) {
          hero = await upload(files.get(assignment.hero)!, assignment.hero);
          setStage({ name: "uploading", done: ++done, total });
        }
        for (const file of assignment.gallery) {
          gallery.push(await upload(files.get(file)!, file));
          setStage({ name: "uploading", done: ++done, total });
        }

        payload.push({ slug: assignment.slug, hero, gallery });
      }

      const result = await applyPhotoImport(payload);
      setStage({
        name: "done",
        message: result.message,
        updated: result.updated,
        failures: result.failures,
      });
    } catch (error) {
      setStage({
        name: "error",
        message:
          error instanceof Error
            ? `${error.message} Nothing was saved for the products after this point.`
            : "Upload failed.",
      });
    }
  }

  const card = "bg-paper p-6";
  const label = "text-[0.6875rem] font-bold uppercase tracking-[0.14em]";

  if (!ready) {
    return (
      <p className="border-l-2 border-red bg-paper px-5 py-4 text-sm">
        Cloudinary is not configured, so there is nowhere to put the images.
        Set <code className="bg-warm px-1">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code>{" "}
        and <code className="bg-warm px-1">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code>,
        then reload.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={`${card} flex flex-col gap-4`}>
        <label className="flex flex-col gap-2">
          <span className={label}>Zip of photographs</span>
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readZip(file);
            }}
            className="w-full border border-dashed border-line bg-warm px-4 py-4 text-sm file:mr-4 file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-xs file:font-semibold"
          />
          <span className="text-xs text-muted">
            Nothing is uploaded until you confirm the match below.
          </span>
        </label>
      </div>

      {stage.name === "reading" && (
        <p className={`${card} text-sm text-muted`}>Reading the archive…</p>
      )}

      {stage.name === "error" && (
        <p role="alert" className="border-l-2 border-red bg-paper px-5 py-4 text-sm">
          {stage.message}
        </p>
      )}

      {stage.name === "uploading" && (
        <div className={`${card} flex flex-col gap-3`}>
          <p className="text-sm font-semibold">
            Uploading {stage.done} of {stage.total}…
          </p>
          <div className="h-1.5 w-full bg-line">
            <div
              className="h-full bg-red transition-[width]"
              style={{ width: `${stage.total ? (stage.done / stage.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            Keep this tab open. Closing it stops the upload partway.
          </p>
        </div>
      )}

      {stage.name === "done" && (
        <div className={`${card} flex flex-col gap-3`}>
          <p className="text-sm font-semibold">{stage.message}</p>
          {stage.failures.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs text-muted">
              {stage.failures.map((f) => (
                <li key={f.slug}>
                  <span className="font-semibold">{f.slug}</span> — {f.problem}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {stage.name === "planned" && (
        <>
          <div className={`${card} flex flex-wrap items-center gap-4`}>
            {/* Counted from the assignments, not the zip. A file that parsed
                but matched no product is in `files` and will never upload —
                counting those promises more than the run delivers. */}
            {(() => {
              const images = stage.plan.assignments.reduce(
                (n, a) => n + (a.hero ? 1 : 0) + a.gallery.length,
                0,
              );
              return (
                <p className="text-sm">
                  <strong>{stage.plan.assignments.length}</strong>{" "}
                  {stage.plan.assignments.length === 1 ? "product" : "products"} matched,{" "}
                  <strong>{images}</strong> {images === 1 ? "image" : "images"} to upload.
                </p>
              );
            })()}
            <button
              onClick={() => apply(stage.plan, stage.files)}
              disabled={stage.plan.assignments.length === 0}
              className="ml-auto bg-red px-6 py-3 font-display text-xs font-semibold uppercase tracking-[0.1em] text-paper hover:bg-ink disabled:opacity-50"
            >
              Upload and apply
            </button>
          </div>

          {stage.plan.assignments.length > 0 && (
            <div className="overflow-x-auto border border-line bg-paper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    {["Product", "Hero", "Gallery", "Replaces"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {stage.plan.assignments.map((a) => (
                    <tr key={a.slug}>
                      <td className="px-4 py-2.5">
                        {a.name}
                        <span className="block font-mono text-[0.6875rem] text-muted">
                          {a.slug}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {a.hero ?? <span className="text-muted/60">unchanged</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs tabular-nums text-muted">
                        {a.gallery.length}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {a.hero && a.gallery.length > 0
                          ? "hero + gallery"
                          : a.hero
                            ? "hero only"
                            : "gallery only"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {stage.plan.issues.length > 0 && (
            <div className={`${card} flex flex-col gap-2`}>
              <h2 className="text-sm font-semibold">
                {stage.plan.issues.length} file
                {stage.plan.issues.length === 1 ? "" : "s"} will be skipped
              </h2>
              <ul className="flex flex-col gap-1 text-xs text-muted">
                {stage.plan.issues.map((issue) => (
                  <li key={issue.file}>
                    <span className="font-mono">{issue.file}</span> — {issue.problem}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
