-- AlterTable: support third-party ad network tags alongside self-hosted banners
ALTER TABLE "Advertisement" ADD COLUMN "creativeType" TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE "Advertisement" ADD COLUMN "networkName" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN "embedCode" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN "iframeUrl" TEXT;

-- Serving filters by placement + type, so keep that lookup indexed.
CREATE INDEX "Advertisement_creativeType_idx" ON "Advertisement"("creativeType");
