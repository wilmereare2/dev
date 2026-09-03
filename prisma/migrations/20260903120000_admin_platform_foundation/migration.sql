-- User account status
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_accountStatus_createdAt_idx" ON "User"("accountStatus", "createdAt");

-- ContentReport workflow
ALTER TABLE "ContentReport" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "ContentReport" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "ContentReport" ADD COLUMN IF NOT EXISTS "assigneeId" TEXT;
ALTER TABLE "ContentReport" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "ContentReport" ADD COLUMN IF NOT EXISTS "resolvedById" TEXT;
ALTER TABLE "ContentReport" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "ContentReport_status_priority_createdAt_idx" ON "ContentReport"("status", "priority", "createdAt");
CREATE INDEX IF NOT EXISTS "ContentReport_assigneeId_status_idx" ON "ContentReport"("assigneeId", "status");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContentReport_assigneeId_fkey') THEN
    ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_assigneeId_fkey"
      FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ContentReport_resolvedById_fkey') THEN
    ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_resolvedById_fkey"
      FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AuditLog expansion
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "targetLabel" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "previousValue" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "newValue" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_actorId_fkey') THEN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AdminNote
CREATE TABLE IF NOT EXISTS "AdminNote" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminNote_targetType_targetId_createdAt_idx" ON "AdminNote"("targetType", "targetId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminNote_authorId_idx" ON "AdminNote"("authorId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdminNote_authorId_fkey') THEN
    ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ReportEvent
CREATE TABLE IF NOT EXISTS "ReportEvent" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReportEvent_reportId_createdAt_idx" ON "ReportEvent"("reportId", "createdAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReportEvent_reportId_fkey') THEN
    ALTER TABLE "ReportEvent" ADD CONSTRAINT "ReportEvent_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "ContentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReportEvent_actorId_fkey') THEN
    ALTER TABLE "ReportEvent" ADD CONSTRAINT "ReportEvent_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- PlatformSetting
CREATE TABLE IF NOT EXISTS "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);
