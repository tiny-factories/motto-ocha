-- DropForeignKey
ALTER TABLE "Tea" DROP CONSTRAINT "Tea_brandId_fkey";

-- AlterTable
ALTER TABLE "Tea" DROP COLUMN "brandId";

-- DropTable
DROP TABLE "Brand";
