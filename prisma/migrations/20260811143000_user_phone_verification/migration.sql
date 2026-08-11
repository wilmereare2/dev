-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerified" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
