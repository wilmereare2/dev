-- Ensure registration/profile columns exist even if an earlier migration was skipped or partially applied.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "race" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hobbies" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegram" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsApp" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "zangi" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");

-- Backfill usernames with a collision-resistant suffix derived from the account id.
UPDATE "User"
SET "username" = LEFT(
  COALESCE(
    NULLIF(regexp_replace(lower(split_part("email", '@', 1)), '[^a-z0-9]', '', 'g'), ''),
    'user'
  ) || substr("id", -6),
  20
)
WHERE "username" IS NULL;
