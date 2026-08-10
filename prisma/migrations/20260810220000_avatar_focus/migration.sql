-- Pan/focus offsets for avatar framing (-50 to 50)
ALTER TABLE "UserSettings" ADD COLUMN "avatarFocusX" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserSettings" ADD COLUMN "avatarFocusY" INTEGER NOT NULL DEFAULT 0;
