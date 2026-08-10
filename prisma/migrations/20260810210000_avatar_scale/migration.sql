-- Avatar display zoom within the profile circle (75–150%)
ALTER TABLE "UserSettings" ADD COLUMN "avatarScale" INTEGER NOT NULL DEFAULT 100;
