-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE';
