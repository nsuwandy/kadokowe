-- A cart line may now carry several add-ons, and a product may appear on an
-- enquiry more than once.
--
-- Written by hand rather than left as generated. The generated version added
-- `id` as NOT NULL with no default, which fails outright on a table that
-- already has rows, and dropped `packagingId` without reading it — silently
-- discarding the add-on every existing enquiry had recorded. Enquiries from
-- the product pages already create rows here, so neither was safe.

-- CreateTable
CREATE TABLE "_EnquiryLinePackaging" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EnquiryLinePackaging_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EnquiryLinePackaging_B_index" ON "_EnquiryLinePackaging"("B");

-- AlterTable: give every row a key of its own before making it the key.
ALTER TABLE "EnquiryProduct" ADD COLUMN "id" TEXT;
UPDATE "EnquiryProduct" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;
ALTER TABLE "EnquiryProduct" ALTER COLUMN "id" SET NOT NULL;

ALTER TABLE "EnquiryProduct" DROP CONSTRAINT "EnquiryProduct_pkey";
ALTER TABLE "EnquiryProduct" ADD CONSTRAINT "EnquiryProduct_pkey" PRIMARY KEY ("id");

ALTER TABLE "EnquiryProduct" ADD COLUMN "packagingLabel" TEXT;

-- Carry each existing single choice across before the column goes.
INSERT INTO "_EnquiryLinePackaging" ("A", "B")
SELECT "id", "packagingId" FROM "EnquiryProduct" WHERE "packagingId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "EnquiryProduct" DROP CONSTRAINT "EnquiryProduct_packagingId_fkey";
ALTER TABLE "EnquiryProduct" DROP COLUMN "packagingId";

-- CreateIndex
CREATE INDEX "EnquiryProduct_enquiryId_idx" ON "EnquiryProduct"("enquiryId");

-- AddForeignKey
ALTER TABLE "_EnquiryLinePackaging" ADD CONSTRAINT "_EnquiryLinePackaging_A_fkey" FOREIGN KEY ("A") REFERENCES "EnquiryProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnquiryLinePackaging" ADD CONSTRAINT "_EnquiryLinePackaging_B_fkey" FOREIGN KEY ("B") REFERENCES "PackagingOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
