/**
 * The shape of an add-on, and the pure functions over it.
 *
 * Separate from src/lib/packaging because that module is server-only: it
 * imports the database client, and a client component asking it to sort a
 * list it already holds pulled Prisma, `fs` and `dns` toward the browser
 * bundle. Types are erased at compile time and cross that boundary freely;
 * functions do not.
 */

export type AddOnKind = "BRANDING" | "PACKAGING";

export type PackagingChoice = {
  id: string;
  slug: string;
  kind: AddOnKind;
  name: string;
  description: string | null;
  /** Null when this option has to be quoted. */
  priceDelta: number | null;
  quoteOnly: boolean;
  children: PackagingChoice[];
};

/**
 * The two lists, in the order they are offered.
 *
 * Branding first: it is what is done to the product, and a buyer decides that
 * before deciding what it goes in. A child inherits its parent's list, so a
 * construction never floats into the wrong one.
 */
export function splitAddOns(tree: PackagingChoice[]) {
  return {
    branding: tree.filter((o) => o.kind === "BRANDING"),
    packaging: tree.filter((o) => o.kind !== "BRANDING"),
  };
}

/** Flattened, for looking a choice up by id when a cart line is submitted. */
export function flattenAddOns(tree: PackagingChoice[]): PackagingChoice[] {
  return tree.flatMap((node) => [node, ...flattenAddOns(node.children)]);
}
