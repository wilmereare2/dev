-- CreateTable
CREATE TABLE "AdCreative" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCreative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdCreative_checksum_key" ON "AdCreative"("checksum");

-- CreateIndex
CREATE INDEX "AdCreative_createdAt_idx" ON "AdCreative"("createdAt");

-- AddForeignKey
ALTER TABLE "AdCreative" ADD CONSTRAINT "AdCreative_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
