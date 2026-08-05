-- AlterTable
ALTER TABLE "ChatChannel" ADD COLUMN "adminOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AdminManagementCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "href" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminManagementCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminManagementCategory_slug_key" ON "AdminManagementCategory"("slug");

-- Seed admin-only chat channels
INSERT INTO "ChatChannel" ("id", "slug", "name", "description", "adminOnly")
VALUES
    ('admin-operations', 'admin-operations', 'Admin Operations', 'Private coordination channel for platform administrators.', true),
    ('moderation-desk', 'moderation-desk', 'Moderation Desk', 'Real-time moderation updates and escalations.', true),
    ('platform-alerts', 'platform-alerts', 'Platform Alerts', 'Automated and manual alerts for administrators.', true)
ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "adminOnly" = EXCLUDED."adminOnly";

-- Seed admin management categories
INSERT INTO "AdminManagementCategory" ("id", "slug", "name", "description", "href", "enabled", "updatedAt")
VALUES
    ('promotions-monitoring', 'promotions-monitoring', 'Promotions monitoring', 'View and manage member promotional posts in real time.', '/admin/promotions', true, CURRENT_TIMESTAMP),
    ('content-moderation', 'content-moderation', 'Content moderation', 'Review creator uploads before they go live.', '/admin/content', true, CURRENT_TIMESTAMP),
    ('creator-verification', 'creator-verification', 'Creator verification', 'Approve or suspend creator accounts.', '/admin/creators', true, CURRENT_TIMESTAMP),
    ('member-support', 'member-support', 'Member support', 'Handle reports, tickets, and customer issues.', '/admin/tickets', true, CURRENT_TIMESTAMP),
    ('customer-management', 'customer-management', 'Customer management', 'Search members, roles, and account status.', '/admin/users', true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "href" = EXCLUDED."href",
    "enabled" = EXCLUDED."enabled",
    "updatedAt" = CURRENT_TIMESTAMP;
