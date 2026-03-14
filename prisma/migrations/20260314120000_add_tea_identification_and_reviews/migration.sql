-- CreateTable
CREATE TABLE "TeaAlias" (
    "id" TEXT NOT NULL,
    "teaId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeaAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeaBarcode" (
    "id" TEXT NOT NULL,
    "teaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "format" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeaBarcode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeaReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teaId" TEXT NOT NULL,
    "vendorId" TEXT,
    "rating" INTEGER,
    "review" TEXT,
    "locationName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeaReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeaAlias_teaId_value_key" ON "TeaAlias"("teaId", "value");

-- CreateIndex
CREATE INDEX "TeaAlias_value_idx" ON "TeaAlias"("value");

-- CreateIndex
CREATE UNIQUE INDEX "TeaBarcode_code_key" ON "TeaBarcode"("code");

-- CreateIndex
CREATE INDEX "TeaBarcode_teaId_idx" ON "TeaBarcode"("teaId");

-- CreateIndex
CREATE UNIQUE INDEX "TeaReview_userId_teaId_key" ON "TeaReview"("userId", "teaId");

-- CreateIndex
CREATE INDEX "TeaReview_teaId_idx" ON "TeaReview"("teaId");

-- CreateIndex
CREATE INDEX "TeaReview_vendorId_idx" ON "TeaReview"("vendorId");

-- AddForeignKey
ALTER TABLE "TeaAlias" ADD CONSTRAINT "TeaAlias_teaId_fkey" FOREIGN KEY ("teaId") REFERENCES "Tea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeaBarcode" ADD CONSTRAINT "TeaBarcode_teaId_fkey" FOREIGN KEY ("teaId") REFERENCES "Tea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeaReview" ADD CONSTRAINT "TeaReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeaReview" ADD CONSTRAINT "TeaReview_teaId_fkey" FOREIGN KEY ("teaId") REFERENCES "Tea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeaReview" ADD CONSTRAINT "TeaReview_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
