/**
 * Shared types for the product editor.
 *
 * Kept out of the actions module because a "use server" file may only export
 * async functions — exporting a plain value from one yields undefined at the
 * import site.
 */

export type SaveState = { ok: boolean; message?: string };

export const emptySaveState: SaveState = { ok: false };

export type ProductFormValues = {
  id: string;
  slug: string;
  nameEn: string;
  nameId: string | null;
  shortEn: string;
  shortId: string | null;
  whyEn: string | null;
  whyId: string | null;
  material: string | null;
  dimensions: string | null;
  capacity: string | null;
  colours: string[];
  moq: number | null;
  leadTime: string | null;
  customisation: string[];
  availability: string;
  indicativePrice: number | null;
  tagsEn: string[];
  tagsId: string[];
  heroImage: string | null;
  featured: boolean;
  isNew: boolean;
  visibility: string;
  termIds: string[];
};

export type TermOption = {
  id: string;
  axis: string;
  nameEn: string;
  slugEn: string;
};

export const AVAILABILITY_OPTIONS = [
  { value: "READY_STOCK", label: "Ready stock — in our warehouse" },
  { value: "LOCAL_PRODUCTION", label: "Local production" },
  { value: "IMPORT_SOURCING", label: "Import & sourcing" },
  { value: "CUSTOM_MADE", label: "Custom made" },
] as const;

export const VISIBILITY_OPTIONS = [
  { value: "DRAFT", label: "Draft — not on the site" },
  { value: "PUBLISHED", label: "Published — live on the site" },
  { value: "HIDDEN", label: "Hidden — reachable by link only" },
] as const;

export const AXIS_LABELS: Record<string, string> = {
  PRODUCT: "Product category",
  PURPOSE: "Purpose — what it is for",
  INDUSTRY: "Industry",
  BUDGET: "Budget tier (set automatically from price)",
};
