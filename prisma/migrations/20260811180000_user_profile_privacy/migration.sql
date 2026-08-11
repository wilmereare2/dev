-- Public site identity + private contact channels
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "race" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hobbies" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegram" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsApp" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "zangi" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Backfill usernames for existing accounts
UPDATE "User"
SET "username" = lower(regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9]', '', 'g')) || substr("id", -4)
WHERE "username" IS NULL;
