-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListTea" (
    "listId" TEXT NOT NULL,
    "teaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListTea_pkey" PRIMARY KEY ("listId","teaId")
);

-- CreateIndex
CREATE INDEX "List_userId_idx" ON "List"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "List_userId_slug_key" ON "List"("userId", "slug");

-- CreateIndex
CREATE INDEX "ListTea_teaId_idx" ON "ListTea"("teaId");

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListTea" ADD CONSTRAINT "ListTea_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListTea" ADD CONSTRAINT "ListTea_teaId_fkey" FOREIGN KEY ("teaId") REFERENCES "Tea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
