/**
 * Read a gallery out of submitted form fields — FR-7.3.
 *
 * GalleryField submits two parallel lists, one entry per row. Rows whose
 * image was never chosen are dropped and the order is renumbered afterwards,
 * so an operator who adds a row and changes their mind does not leave a hole
 * in the sequence or an image record pointing at nothing.
 */
export type GalleryInput = {
  publicId: string;
  altEn: string | null;
  kind: "IMAGE" | "VIDEO";
  sortOrder: number;
};

export function galleryFrom(formData: FormData, name: string): GalleryInput[] {
  const ids = formData.getAll(`${name}_publicId`).map(String);
  const alts = formData.getAll(`${name}_alt`).map(String);
  const kinds = formData.getAll(`${name}_kind`).map(String);
  return ids
    .map((publicId, i) => ({
      publicId: publicId.trim(),
      alt: (alts[i] ?? "").trim(),
      // Anything but an explicit VIDEO is a still, so a gallery submitted by
      // a form that never offered the choice stays exactly as it was.
      kind: kinds[i] === "VIDEO" ? ("VIDEO" as const) : ("IMAGE" as const),
    }))
    .filter((row) => row.publicId !== "")
    .map((row, i) => ({ publicId: row.publicId, altEn: row.alt || null, kind: row.kind, sortOrder: i }));
}
