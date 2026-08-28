-- CreateEnum
CREATE TYPE "CraftMediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "CraftFamily" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameId" TEXT,
    "leadEn" TEXT,
    "leadId" TEXT,
    "introEn" TEXT,
    "introId" TEXT,
    "heroImage" TEXT,
    "options" JSONB,
    "branding" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visibility" "Visibility" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CraftFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CraftItem" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameId" TEXT,
    "noteEn" TEXT,
    "noteId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CraftItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CraftMedia" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "kind" "CraftMediaKind" NOT NULL DEFAULT 'IMAGE',
    "publicId" TEXT NOT NULL,
    "altEn" TEXT,
    "altId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CraftMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CraftMachine" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameId" TEXT,
    "descEn" TEXT,
    "descId" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CraftMachine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CraftFamily_slug_key" ON "CraftFamily"("slug");

-- CreateIndex
CREATE INDEX "CraftFamily_visibility_sortOrder_idx" ON "CraftFamily"("visibility", "sortOrder");

-- CreateIndex
CREATE INDEX "CraftItem_familyId_sortOrder_idx" ON "CraftItem"("familyId", "sortOrder");

-- CreateIndex
CREATE INDEX "CraftMedia_itemId_sortOrder_idx" ON "CraftMedia"("itemId", "sortOrder");

-- CreateIndex
CREATE INDEX "CraftMachine_familyId_sortOrder_idx" ON "CraftMachine"("familyId", "sortOrder");

-- AddForeignKey
ALTER TABLE "CraftItem" ADD CONSTRAINT "CraftItem_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "CraftFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CraftMedia" ADD CONSTRAINT "CraftMedia_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CraftItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CraftMachine" ADD CONSTRAINT "CraftMachine_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "CraftFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;
