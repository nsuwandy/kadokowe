-- CreateEnum
CREATE TYPE "PackagingPricing" AS ENUM ('FIXED', 'QUOTE');

-- AlterTable
ALTER TABLE "EnquiryProduct" ADD COLUMN     "packagingId" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "unitPrice" INTEGER,
ADD COLUMN     "unitPriceMax" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "indicativePriceMax" INTEGER,
ALTER COLUMN "shortEn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "briefImage" TEXT,
ADD COLUMN     "challengeImage" TEXT,
ADD COLUMN     "createdWorkImage" TEXT,
ADD COLUMN     "impactImage" TEXT,
ADD COLUMN     "makingImage" TEXT,
ADD COLUMN     "testimonialAuthor" TEXT,
ADD COLUMN     "testimonialEn" TEXT,
ADD COLUMN     "testimonialId" TEXT,
ADD COLUMN     "testimonialRoleEn" TEXT,
ADD COLUMN     "testimonialRoleId" TEXT,
ADD COLUMN     "thinkingImage" TEXT;

-- CreateTable
CREATE TABLE "PackagingOption" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameId" TEXT,
    "descEn" TEXT,
    "descId" TEXT,
    "pricing" "PackagingPricing" NOT NULL DEFAULT 'FIXED',
    "priceDelta" INTEGER,
    "parentId" TEXT,
    "appliesToAll" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPackaging" (
    "productId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "priceDelta" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductPackaging_pkey" PRIMARY KEY ("productId","optionId")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "url" TEXT,
    "noteEn" TEXT,
    "noteId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackagingOption_slug_key" ON "PackagingOption"("slug");

-- CreateIndex
CREATE INDEX "PackagingOption_appliesToAll_sortOrder_idx" ON "PackagingOption"("appliesToAll", "sortOrder");

-- CreateIndex
CREATE INDEX "Partner_visibility_sortOrder_idx" ON "Partner"("visibility", "sortOrder");

-- AddForeignKey
ALTER TABLE "PackagingOption" ADD CONSTRAINT "PackagingOption_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PackagingOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPackaging" ADD CONSTRAINT "ProductPackaging_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPackaging" ADD CONSTRAINT "ProductPackaging_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PackagingOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryProduct" ADD CONSTRAINT "EnquiryProduct_packagingId_fkey" FOREIGN KEY ("packagingId") REFERENCES "PackagingOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
