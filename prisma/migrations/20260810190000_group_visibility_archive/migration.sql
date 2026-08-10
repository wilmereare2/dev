-- AlterTable
ALTER TABLE "MemberGroup" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'private';
ALTER TABLE "MemberGroup" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MemberGroup_visibility_idx" ON "MemberGroup"("visibility");
CREATE INDEX "MemberGroup_archivedAt_idx" ON "MemberGroup"("archivedAt");
