-- CreateTable
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "advertiserName" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "imageUrl" TEXT,
    "imageUrlTablet" TEXT,
    "imageUrlMobile" TEXT,
    "altText" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "lastServedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdImpressionKey" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdImpressionKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Advertisement_placement_status_priority_idx" ON "Advertisement"("placement", "status", "priority");

-- CreateIndex
CREATE INDEX "Advertisement_status_startAt_endAt_idx" ON "Advertisement"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Advertisement_createdAt_idx" ON "Advertisement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdImpressionKey_adId_dedupeKey_key" ON "AdImpressionKey"("adId", "dedupeKey");

-- CreateIndex
CREATE INDEX "AdImpressionKey_createdAt_idx" ON "AdImpressionKey"("createdAt");

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdImpressionKey" ADD CONSTRAINT "AdImpressionKey_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
