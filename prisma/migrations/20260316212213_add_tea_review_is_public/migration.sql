-- AlterTable
ALTER TABLE "TeaReview" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "TeaReview_isPublic_idx" ON "TeaReview"("isPublic");
