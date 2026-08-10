-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DirectMessage_conversationId_readAt_idx" ON "DirectMessage"("conversationId", "readAt");

-- CreateTable
CREATE TABLE "MutedUser" (
    "id" TEXT NOT NULL,
    "muterId" TEXT NOT NULL,
    "mutedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MutedUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MutedUser_muterId_idx" ON "MutedUser"("muterId");

-- CreateIndex
CREATE UNIQUE INDEX "MutedUser_muterId_mutedId_key" ON "MutedUser"("muterId", "mutedId");

-- AddForeignKey
ALTER TABLE "MutedUser" ADD CONSTRAINT "MutedUser_muterId_fkey" FOREIGN KEY ("muterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutedUser" ADD CONSTRAINT "MutedUser_mutedId_fkey" FOREIGN KEY ("mutedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
