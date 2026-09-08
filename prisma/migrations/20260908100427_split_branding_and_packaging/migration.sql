-- CreateEnum
CREATE TYPE "AddOnKind" AS ENUM ('BRANDING', 'PACKAGING');

-- AlterTable
ALTER TABLE "PackagingOption" ADD COLUMN     "kind" "AddOnKind" NOT NULL DEFAULT 'PACKAGING';

-- CreateIndex
CREATE INDEX "PackagingOption_kind_sortOrder_idx" ON "PackagingOption"("kind", "sortOrder");

-- The four decoration methods move to the branding list. Done here rather
-- than left to the seed: the column defaults to PACKAGING, so without this
-- every existing install would show engraving and UV printing under
-- Packaging until someone happened to re-run the seed.
UPDATE "PackagingOption"
SET "kind" = 'BRANDING'
WHERE "slug" IN (
  'laser-engrave',
  'uv-printing-logo',
  'uv-printing-1-side',
  'uv-printing-full'
);
