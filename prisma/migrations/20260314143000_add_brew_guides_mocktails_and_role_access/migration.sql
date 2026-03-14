-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'reviewer';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'expert';

-- CreateTable
CREATE TABLE "TeaBrewGuide" (
    "id" TEXT NOT NULL,
    "teaId" TEXT NOT NULL,
    "leafGrams" DOUBLE PRECISION,
    "waterMl" INTEGER,
    "temperatureC" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeaBrewGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeaBrewGuideStep" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "infusionNumber" INTEGER NOT NULL,
    "steepSeconds" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeaBrewGuideStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTeaBrewProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teaId" TEXT NOT NULL,
    "leafGrams" DOUBLE PRECISION,
    "waterMl" INTEGER,
    "temperatureC" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTeaBrewProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTeaBrewStep" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "infusionNumber" INTEGER NOT NULL,
    "steepSeconds" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTeaBrewStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mocktail" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "teaId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mocktail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MocktailIngredient" (
    "id" TEXT NOT NULL,
    "mocktailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" TEXT,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MocktailIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MocktailStep" (
    "id" TEXT NOT NULL,
    "mocktailId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MocktailStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeaBrewGuide_teaId_key" ON "TeaBrewGuide"("teaId");

-- CreateIndex
CREATE UNIQUE INDEX "TeaBrewGuideStep_guideId_infusionNumber_key" ON "TeaBrewGuideStep"("guideId", "infusionNumber");

-- CreateIndex
CREATE INDEX "TeaBrewGuideStep_guideId_idx" ON "TeaBrewGuideStep"("guideId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTeaBrewProfile_userId_teaId_key" ON "UserTeaBrewProfile"("userId", "teaId");

-- CreateIndex
CREATE INDEX "UserTeaBrewProfile_teaId_idx" ON "UserTeaBrewProfile"("teaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTeaBrewStep_profileId_infusionNumber_key" ON "UserTeaBrewStep"("profileId", "infusionNumber");

-- CreateIndex
CREATE INDEX "UserTeaBrewStep_profileId_idx" ON "UserTeaBrewStep"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Mocktail_slug_key" ON "Mocktail"("slug");

-- CreateIndex
CREATE INDEX "Mocktail_teaId_idx" ON "Mocktail"("teaId");

-- CreateIndex
CREATE INDEX "Mocktail_createdById_idx" ON "Mocktail"("createdById");

-- CreateIndex
CREATE INDEX "MocktailIngredient_mocktailId_idx" ON "MocktailIngredient"("mocktailId");

-- CreateIndex
CREATE UNIQUE INDEX "MocktailStep_mocktailId_stepNumber_key" ON "MocktailStep"("mocktailId", "stepNumber");

-- CreateIndex
CREATE INDEX "MocktailStep_mocktailId_idx" ON "MocktailStep"("mocktailId");

-- AddForeignKey
ALTER TABLE "TeaBrewGuide" ADD CONSTRAINT "TeaBrewGuide_teaId_fkey" FOREIGN KEY ("teaId") REFERENCES "Tea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeaBrewGuideStep" ADD CONSTRAINT "TeaBrewGuideStep_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "TeaBrewGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeaBrewProfile" ADD CONSTRAINT "UserTeaBrewProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeaBrewProfile" ADD CONSTRAINT "UserTeaBrewProfile_teaId_fkey" FOREIGN KEY ("teaId") REFERENCES "Tea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeaBrewStep" ADD CONSTRAINT "UserTeaBrewStep_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserTeaBrewProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mocktail" ADD CONSTRAINT "Mocktail_teaId_fkey" FOREIGN KEY ("teaId") REFERENCES "Tea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mocktail" ADD CONSTRAINT "Mocktail_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MocktailIngredient" ADD CONSTRAINT "MocktailIngredient_mocktailId_fkey" FOREIGN KEY ("mocktailId") REFERENCES "Mocktail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MocktailStep" ADD CONSTRAINT "MocktailStep_mocktailId_fkey" FOREIGN KEY ("mocktailId") REFERENCES "Mocktail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
