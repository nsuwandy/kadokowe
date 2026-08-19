-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('READY_STOCK', 'LOCAL_PRODUCTION', 'IMPORT_SOURCING', 'CUSTOM_MADE');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "TaxonomyAxis" AS ENUM ('PRODUCT', 'PURPOSE', 'INDUSTRY', 'BUDGET');

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('GIFTING_STRATEGY', 'IDEAS_TRENDS', 'PACKAGING_DESIGN', 'BEHIND_THE_MAKING');

-- CreateEnum
CREATE TYPE "CustomMadeFamily" AS ENUM ('CUSTOM_BAGS', 'PRINTED_TEXTILES', 'PLUSH_CHARACTERS', 'SILICONE_MOULDED', 'CUSTOM_APPAREL', 'CUSTOM_PACKAGING', 'SPECIAL_PROJECTS');

-- CreateEnum
CREATE TYPE "EnquiryType" AS ENUM ('EVENT', 'CAMPAIGN', 'CORPORATE_GIFT', 'EMPLOYEE_GIFT', 'VIP_GIFT', 'PRODUCT_LAUNCH', 'OTHER');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'PROPOSAL_SENT', 'WON', 'CLOSED');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('UNCONFIRMED', 'CONFIRMED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('EN', 'ID');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('BRIEF', 'CONCEPT', 'DESIGN', 'MOCKUP', 'APPROVAL', 'PRODUCTION', 'QC', 'SHIPPING', 'DELIVERED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameId" TEXT,
    "shortEn" TEXT NOT NULL,
    "shortId" TEXT,
    "whyEn" TEXT,
    "whyId" TEXT,
    "material" TEXT,
    "dimensions" TEXT,
    "capacity" TEXT,
    "colours" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "moq" INTEGER,
    "leadTime" TEXT,
    "customisation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availability" "Availability" NOT NULL DEFAULT 'LOCAL_PRODUCTION',
    "indicativePrice" INTEGER,
    "heroImage" TEXT,
    "tagsEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tagsId" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "Visibility" NOT NULL DEFAULT 'DRAFT',
    "seoTitleEn" TEXT,
    "seoTitleId" TEXT,
    "seoDescEn" TEXT,
    "seoDescId" TEXT,
    "family" "CustomMadeFamily",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyTerm" (
    "id" TEXT NOT NULL,
    "axis" "TaxonomyAxis" NOT NULL,
    "slugEn" TEXT NOT NULL,
    "slugId" TEXT,
    "nameEn" TEXT NOT NULL,
    "nameId" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,

    CONSTRAINT "TaxonomyTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "altEn" TEXT,
    "altId" TEXT,
    "captionEn" TEXT,
    "captionId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT,
    "projectId" TEXT,
    "articleId" TEXT,
    "collectionId" TEXT,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleId" TEXT,
    "client" TEXT NOT NULL,
    "industry" TEXT,
    "summaryEn" TEXT,
    "summaryId" TEXT,
    "briefEn" TEXT,
    "briefId" TEXT,
    "challengeEn" TEXT,
    "challengeId" TEXT,
    "thinkingEn" TEXT,
    "thinkingId" TEXT,
    "createdWorkEn" TEXT,
    "createdWorkId" TEXT,
    "makingEn" TEXT,
    "makingId" TEXT,
    "impactEn" TEXT,
    "impactId" TEXT,
    "stats" JSONB,
    "heroImage" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "Visibility" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitleEn" TEXT,
    "seoTitleId" TEXT,
    "seoDescEn" TEXT,
    "seoDescId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleId" TEXT,
    "excerptEn" TEXT,
    "excerptId" TEXT,
    "bodyEn" TEXT,
    "bodyId" TEXT,
    "category" "ArticleCategory" NOT NULL,
    "heroImage" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "Visibility" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitleEn" TEXT,
    "seoTitleId" TEXT,
    "seoDescEn" TEXT,
    "seoDescId" TEXT,
    "shareImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptCollection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleId" TEXT,
    "themeEn" TEXT,
    "themeId" TEXT,
    "briefEn" TEXT,
    "briefId" TEXT,
    "directionEn" TEXT,
    "directionId" TEXT,
    "heroImage" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarterlyIssue" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "periodEn" TEXT NOT NULL,
    "periodId" TEXT,
    "themeEn" TEXT NOT NULL,
    "themeId" TEXT,
    "introEn" TEXT,
    "introId" TEXT,
    "editorialEn" TEXT,
    "editorialId" TEXT,
    "coverImage" TEXT,
    "pdfUrl" TEXT,
    "sections" JSONB,
    "visibility" "Visibility" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuarterlyIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "type" "EnquiryType",
    "quantity" TEXT,
    "targetBudget" TEXT,
    "neededBy" TIMESTAMP(3),
    "description" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "sourcePage" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'EN',
    "uploads" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryProduct" (
    "enquiryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "EnquiryProduct_pkey" PRIMARY KEY ("enquiryId","productId")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'UNCONFIRMED',
    "confirmToken" TEXT,
    "unsubscribeToken" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3),
    "consentLocale" "Locale" NOT NULL DEFAULT 'EN',
    "sourcePage" TEXT,
    "providerSyncedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageContent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "sessionKey" TEXT,
    "shareToken" TEXT NOT NULL,
    "clientId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeaBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaBoardItem" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "IdeaBoardItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProject" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "ProjectStage" NOT NULL DEFAULT 'BRIEF',
    "expectedDelivery" TIMESTAMP(3),
    "lastUpdate" TIMESTAMP(3) NOT NULL,
    "stageHistory" JSONB,
    "files" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAsset" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "value" TEXT,
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductTerms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductTerms_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductProjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductProjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_IssueProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IssueProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_IssueProjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IssueProjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductArticles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductArticles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectArticles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectArticles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArticleCollections" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArticleCollections_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_IssueArticles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IssueArticles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductCollections" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductCollections_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectCollections" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectCollections_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_IssueCollections" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IssueCollections_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_visibility_featured_idx" ON "Product"("visibility", "featured");

-- CreateIndex
CREATE INDEX "Product_availability_idx" ON "Product"("availability");

-- CreateIndex
CREATE INDEX "Product_family_idx" ON "Product"("family");

-- CreateIndex
CREATE INDEX "TaxonomyTerm_axis_sortOrder_idx" ON "TaxonomyTerm"("axis", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyTerm_axis_slugEn_key" ON "TaxonomyTerm"("axis", "slugEn");

-- CreateIndex
CREATE INDEX "Image_productId_sortOrder_idx" ON "Image"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "Image_projectId_sortOrder_idx" ON "Image"("projectId", "sortOrder");

-- CreateIndex
CREATE INDEX "Image_articleId_sortOrder_idx" ON "Image"("articleId", "sortOrder");

-- CreateIndex
CREATE INDEX "Image_collectionId_sortOrder_idx" ON "Image"("collectionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_visibility_featured_idx" ON "Project"("visibility", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_visibility_category_publishedAt_idx" ON "Article"("visibility", "category", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_featured_idx" ON "Article"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptCollection_slug_key" ON "ConceptCollection"("slug");

-- CreateIndex
CREATE INDEX "ConceptCollection_visibility_sortOrder_idx" ON "ConceptCollection"("visibility", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyIssue_number_key" ON "QuarterlyIssue"("number");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyIssue_slug_key" ON "QuarterlyIssue"("slug");

-- CreateIndex
CREATE INDEX "QuarterlyIssue_visibility_number_idx" ON "QuarterlyIssue"("visibility", "number");

-- CreateIndex
CREATE INDEX "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_confirmToken_key" ON "NewsletterSubscriber"("confirmToken");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_idx" ON "NewsletterSubscriber"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PageContent_key_key" ON "PageContent"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaBoard_shareToken_key" ON "IdeaBoard"("shareToken");

-- CreateIndex
CREATE INDEX "IdeaBoard_sessionKey_idx" ON "IdeaBoard"("sessionKey");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaBoardItem_boardId_productId_key" ON "IdeaBoardItem"("boardId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAccount_email_key" ON "ClientAccount"("email");

-- CreateIndex
CREATE INDEX "ClientProject_clientId_stage_idx" ON "ClientProject"("clientId", "stage");

-- CreateIndex
CREATE INDEX "BrandAsset_clientId_type_idx" ON "BrandAsset"("clientId", "type");

-- CreateIndex
CREATE INDEX "_ProductTerms_B_index" ON "_ProductTerms"("B");

-- CreateIndex
CREATE INDEX "_ProductProjects_B_index" ON "_ProductProjects"("B");

-- CreateIndex
CREATE INDEX "_IssueProducts_B_index" ON "_IssueProducts"("B");

-- CreateIndex
CREATE INDEX "_IssueProjects_B_index" ON "_IssueProjects"("B");

-- CreateIndex
CREATE INDEX "_ProductArticles_B_index" ON "_ProductArticles"("B");

-- CreateIndex
CREATE INDEX "_ProjectArticles_B_index" ON "_ProjectArticles"("B");

-- CreateIndex
CREATE INDEX "_ArticleCollections_B_index" ON "_ArticleCollections"("B");

-- CreateIndex
CREATE INDEX "_IssueArticles_B_index" ON "_IssueArticles"("B");

-- CreateIndex
CREATE INDEX "_ProductCollections_B_index" ON "_ProductCollections"("B");

-- CreateIndex
CREATE INDEX "_ProjectCollections_B_index" ON "_ProjectCollections"("B");

-- CreateIndex
CREATE INDEX "_IssueCollections_B_index" ON "_IssueCollections"("B");

-- AddForeignKey
ALTER TABLE "TaxonomyTerm" ADD CONSTRAINT "TaxonomyTerm_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TaxonomyTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ConceptCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryProduct" ADD CONSTRAINT "EnquiryProduct_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryProduct" ADD CONSTRAINT "EnquiryProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaBoard" ADD CONSTRAINT "IdeaBoard_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaBoardItem" ADD CONSTRAINT "IdeaBoardItem_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "IdeaBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaBoardItem" ADD CONSTRAINT "IdeaBoardItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProject" ADD CONSTRAINT "ClientProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAsset" ADD CONSTRAINT "BrandAsset_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductTerms" ADD CONSTRAINT "_ProductTerms_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductTerms" ADD CONSTRAINT "_ProductTerms_B_fkey" FOREIGN KEY ("B") REFERENCES "TaxonomyTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductProjects" ADD CONSTRAINT "_ProductProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductProjects" ADD CONSTRAINT "_ProductProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueProducts" ADD CONSTRAINT "_IssueProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueProducts" ADD CONSTRAINT "_IssueProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "QuarterlyIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueProjects" ADD CONSTRAINT "_IssueProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueProjects" ADD CONSTRAINT "_IssueProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "QuarterlyIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductArticles" ADD CONSTRAINT "_ProductArticles_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductArticles" ADD CONSTRAINT "_ProductArticles_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectArticles" ADD CONSTRAINT "_ProjectArticles_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectArticles" ADD CONSTRAINT "_ProjectArticles_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleCollections" ADD CONSTRAINT "_ArticleCollections_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleCollections" ADD CONSTRAINT "_ArticleCollections_B_fkey" FOREIGN KEY ("B") REFERENCES "ConceptCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueArticles" ADD CONSTRAINT "_IssueArticles_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueArticles" ADD CONSTRAINT "_IssueArticles_B_fkey" FOREIGN KEY ("B") REFERENCES "QuarterlyIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCollections" ADD CONSTRAINT "_ProductCollections_A_fkey" FOREIGN KEY ("A") REFERENCES "ConceptCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductCollections" ADD CONSTRAINT "_ProductCollections_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectCollections" ADD CONSTRAINT "_ProjectCollections_A_fkey" FOREIGN KEY ("A") REFERENCES "ConceptCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectCollections" ADD CONSTRAINT "_ProjectCollections_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueCollections" ADD CONSTRAINT "_IssueCollections_A_fkey" FOREIGN KEY ("A") REFERENCES "ConceptCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueCollections" ADD CONSTRAINT "_IssueCollections_B_fkey" FOREIGN KEY ("B") REFERENCES "QuarterlyIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
