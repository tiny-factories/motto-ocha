-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "country" TEXT,
ADD COLUMN     "prefecture" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "scale" TEXT;

-- AlterTable
ALTER TABLE "Tea" ADD COLUMN     "prefecture" TEXT,
ADD COLUMN     "scale" TEXT,
ADD COLUMN     "singleOrigin" BOOLEAN,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "scale" TEXT;

-- CreateTable
CREATE TABLE "TasteTag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TasteTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeaTasteTag" (
    "teaId" TEXT NOT NULL,
    "tasteTagId" TEXT NOT NULL,
    "rank" INTEGER,

    CONSTRAINT "TeaTasteTag_pkey" PRIMARY KEY ("teaId","tasteTagId")
);

-- CreateTable
CREATE TABLE "TeaCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeaCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeaCategoryAssignment" (
    "teaId" TEXT NOT NULL,
    "teaCategoryId" TEXT NOT NULL,

    CONSTRAINT "TeaCategoryAssignment_pkey" PRIMARY KEY ("teaId","teaCategoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TasteTag_slug_key" ON "TasteTag"("slug");

-- CreateIndex
CREATE INDEX "TeaTasteTag_teaId_idx" ON "TeaTasteTag"("teaId");

-- CreateIndex
CREATE INDEX "TeaTasteTag_tasteTagId_idx" ON "TeaTasteTag"("tasteTagId");

-- CreateIndex
CREATE UNIQUE INDEX "TeaCategory_slug_key" ON "TeaCategory"("slug");

-- CreateIndex
CREATE INDEX "TeaCategoryAssignment_teaId_idx" ON "TeaCategoryAssignment"("teaId");

-- CreateIndex
CREATE INDEX "TeaCategoryAssignment_teaCategoryId_idx" ON "TeaCategoryAssignment"("teaCategoryId");

-- AddForeignKey
ALTER TABLE "TeaTasteTag" ADD CONSTRAINT "TeaTasteTag_teaId_fkey" FOREIGN KEY ("teaId") REFERENCES "Tea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeaTasteTag" ADD CONSTRAINT "TeaTasteTag_tasteTagId_fkey" FOREIGN KEY ("tasteTagId") REFERENCES "TasteTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeaCategory" ADD CONSTRAINT "TeaCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TeaCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeaCategoryAssignment" ADD CONSTRAINT "TeaCategoryAssignment_teaId_fkey" FOREIGN KEY ("teaId") REFERENCES "Tea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeaCategoryAssignment" ADD CONSTRAINT "TeaCategoryAssignment_teaCategoryId_fkey" FOREIGN KEY ("teaCategoryId") REFERENCES "TeaCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
