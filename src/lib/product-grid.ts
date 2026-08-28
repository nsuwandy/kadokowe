/**
 * Column definitions shared by the CSV importer and the on-screen grid.
 *
 * Kept in its own module, free of dependencies, for two reasons. The grid is a
 * client component and importing the CSV parser would pull papaparse into the
 * browser bundle for nothing; and the column list is the one description of
 * "what a product row is" that both front ends have to agree on, so it should
 * not live inside either of them.
 *
 * Every column carries the guidance the operator sees while the cursor is in
 * the cell. NFR-5.2 puts this interface in the hands of someone with no
 * support agreement behind them (decision I16) — a column called
 * `indicative_price` has to say, at the moment it is being filled, that it
 * wants rupiah with no separators and that the budget tier follows from it.
 */

export const IMPORT_COLUMNS = [
  "slug", "name_en", "name_id", "short_en", "short_id", "why_en", "why_id",
  "category", "purposes", "industries", "availability", "indicative_price",
  "material", "dimensions", "capacity", "colours", "moq", "lead_time",
  "customisation", "tags_en", "tags_id", "hero_image", "featured", "is_new",
  "visibility",
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

/** The two enums a row may not invent values for. */
export const AVAILABILITY_VALUES = [
  "READY_STOCK", "LOCAL_PRODUCTION", "IMPORT_SOURCING", "CUSTOM_MADE",
] as const;
export const VISIBILITY_VALUES = ["DRAFT", "PUBLISHED", "HIDDEN"] as const;

export const AVAILABILITY_CHOICES = [
  { value: "READY_STOCK", label: "Ready stock — in our warehouse" },
  { value: "LOCAL_PRODUCTION", label: "Local production" },
  { value: "IMPORT_SOURCING", label: "Import & sourcing" },
  { value: "CUSTOM_MADE", label: "Custom made" },
] as const;

export const VISIBILITY_CHOICES = [
  { value: "DRAFT", label: "Draft — not on the site" },
  { value: "PUBLISHED", label: "Published — live on the site" },
  { value: "HIDDEN", label: "Hidden — reachable by link only" },
] as const;

/**
 * How a cell is edited.
 *
 * `term` and `terms` are the taxonomy pickers: the options are read from the
 * database at render time rather than listed here, because FR-3.13 makes the
 * taxonomies administrator-managed. Hard-coding them here would mean a term
 * added on the Categories page could not be used on this one.
 */
export type GridCellKind =
  | "text"
  | "long"
  | "number"
  | "bool"
  | "choice"
  | "term"
  | "terms"
  | "list";

export type GridColumn = {
  key: ImportColumn;
  /** What the operator calls it. The machine name shows underneath. */
  label: string;
  kind: GridCellKind;
  width: number;
  /** Shown in the tip while the cursor is in the cell. */
  hint: string;
  /** Shown under the hint where an example makes the format obvious. */
  example?: string;
  required?: boolean;
  /** Part of the reduced column set the grid opens with. */
  essential?: boolean;
  /** For `term` / `terms`: which taxonomy axis supplies the options. */
  axis?: "PRODUCT" | "PURPOSE" | "INDUSTRY";
  choices?: readonly { value: string; label: string }[];
};

export const GRID_COLUMNS: readonly GridColumn[] = [
  {
    key: "name_en",
    label: "Name (English)",
    kind: "text",
    width: 220,
    required: true,
    essential: true,
    hint: "Required. What the product is called on the site in English.",
    example: "Canvas Tote Bag",
  },
  {
    key: "short_en",
    label: "One-liner (English)",
    kind: "long",
    width: 260,
    required: true,
    essential: true,
    hint: "Required. The idea-led line on the product card — the sentence that makes it read as an idea rather than a listing (FR-4.1).",
    example: "The canvas everyone keeps.",
  },
  {
    key: "slug",
    label: "Web address",
    kind: "text",
    width: 170,
    essential: true,
    hint: "Leave blank and one is made from the English name. This is also the matching key: a slug that already exists updates that product instead of creating a second one.",
    example: "canvas-tote-bag",
  },
  {
    key: "category",
    label: "Product category",
    kind: "term",
    width: 190,
    essential: true,
    axis: "PRODUCT",
    hint: "Pick one. The category the product is browsed under. Managed on the Categories page — add a term there and it appears here.",
  },
  {
    key: "purposes",
    label: "Purposes",
    kind: "terms",
    width: 200,
    essential: true,
    axis: "PURPOSE",
    hint: "Tick any that apply — what the product is for. A visitor who only knows they have an exhibition finds products this way.",
  },
  {
    key: "industries",
    label: "Industries",
    kind: "terms",
    width: 200,
    essential: true,
    axis: "INDUSTRY",
    hint: "Tick any that apply. Leave empty if the product suits everyone.",
  },
  {
    key: "availability",
    label: "Availability",
    kind: "choice",
    width: 175,
    essential: true,
    choices: AVAILABILITY_CHOICES,
    hint: "How we can supply it. Defaults to Local production if left alone.",
  },
  {
    key: "indicative_price",
    label: "Indicative price",
    kind: "number",
    width: 145,
    essential: true,
    hint: "Rupiah per unit, digits only — no Rp, no dots. The budget tier is worked out from this, so there is nothing else to tag. Leave blank if unknown.",
    example: "45000",
  },
  {
    key: "visibility",
    label: "Visibility",
    kind: "choice",
    width: 175,
    essential: true,
    choices: VISIBILITY_CHOICES,
    hint: "Draft unless you change it. Draft is the safeguard — nothing reaches the public site until you deliberately publish it.",
  },

  // ---- everything below is hidden until "All columns" is switched on ----

  {
    key: "name_id",
    label: "Name (Indonesian)",
    kind: "text",
    width: 220,
    hint: "Optional. Left blank, the English name is shown to Indonesian visitors.",
    example: "Tas Tote Kanvas",
  },
  {
    key: "short_id",
    label: "One-liner (Indonesian)",
    kind: "long",
    width: 260,
    hint: "Optional. Falls back to the English line when blank.",
    example: "Kanvas yang semua orang simpan.",
  },
  {
    key: "why_en",
    label: "Why we like it (English)",
    kind: "long",
    width: 280,
    hint: "Kadokowe's own take — the field that separates a library from a price list (FR-4.5). Optional, but it is the reason the page is worth reading.",
    example: "Sturdy enough to outlive the event it was made for.",
  },
  {
    key: "why_id",
    label: "Why we like it (Indonesian)",
    kind: "long",
    width: 280,
    hint: "Optional Indonesian version of the line above.",
  },
  {
    key: "material",
    label: "Material",
    kind: "text",
    width: 180,
    hint: "Free text, as you would say it to a client.",
    example: "12oz cotton canvas",
  },
  {
    key: "dimensions",
    label: "Dimensions",
    kind: "text",
    width: 150,
    hint: "Free text. Any format you use consistently.",
    example: "38 x 42 cm",
  },
  {
    key: "capacity",
    label: "Capacity",
    kind: "text",
    width: 130,
    hint: "For drinkware and bags. Leave blank where it means nothing.",
    example: "500 ml",
  },
  {
    key: "colours",
    label: "Colours",
    kind: "list",
    width: 200,
    hint: "Separate each colour with a bar.",
    example: "Natural | Black | Navy",
  },
  {
    key: "moq",
    label: "Minimum order",
    kind: "number",
    width: 140,
    hint: "Digits only. The smallest quantity we will produce.",
    example: "300",
  },
  {
    key: "lead_time",
    label: "Lead time",
    kind: "text",
    width: 150,
    hint: "Free text, in working days. A range is fine and usually more honest.",
    example: "10-14 days",
  },
  {
    key: "customisation",
    label: "Customisation",
    kind: "list",
    width: 240,
    hint: "Branding methods available on this product, separated with a bar.",
    example: "Logo printing | Laser engraving | Full-surface print",
  },
  {
    key: "tags_en",
    label: "Tags (English)",
    kind: "list",
    width: 200,
    hint: "Free search words in English, separated with a bar. These are matched by the site search.",
    example: "Events | Retail | Eco",
  },
  {
    key: "tags_id",
    label: "Tags (Indonesian)",
    kind: "list",
    width: 200,
    hint: "The same words in Indonesian. Search matches Indonesian terms against these, so they are worth filling (FR-11.7).",
    example: "Acara | Ritel | Ramah lingkungan",
  },
  {
    key: "hero_image",
    label: "Main photo",
    kind: "text",
    width: 200,
    hint: "The Cloudinary reference for the main photo. Usually left blank here — the Photos page matches photographs to products by filename after the import.",
    example: "kadokowe/canvas-tote-bag",
  },
  {
    key: "featured",
    label: "Feature on homepage",
    kind: "bool",
    width: 130,
    hint: "Tick to put this product in the featured set on the homepage.",
  },
  {
    key: "is_new",
    label: "New",
    kind: "bool",
    width: 90,
    hint: "Tick to badge it as a new arrival.",
  },
];

export const ESSENTIAL_COLUMNS = GRID_COLUMNS.filter((c) => c.essential);

/** A blank row: every column present, every value an empty string. */
export function emptyGridRow(): Record<string, string> {
  const row: Record<string, string> = {};
  for (const key of IMPORT_COLUMNS) row[key] = "";
  return row;
}
