-- Normalize legacy owner role to creator (Element-style room creator)
UPDATE "MemberGroupMember" SET "role" = 'creator' WHERE "role" = 'owner';
