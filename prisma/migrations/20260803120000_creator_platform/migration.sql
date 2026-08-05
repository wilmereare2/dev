-- Creator platform Phase A/B/C migration

CREATE TABLE IF NOT EXISTS "CreatorProfile" (
    "userId" TEXT NOT NULL,
    "sanityCreatorId" TEXT,
    "sanityCreatorSlug" TEXT,
    "displayName" TEXT,
    "bio" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "subscriptionPriceCents" INTEGER,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "BusinessAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "bannerUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "affiliateUrl" TEXT,
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BusinessMember" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'manager',
    CONSTRAINT "BusinessMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CreatorUpload" (
    "id" TEXT NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "sanityContentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'video',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "thumbnailUrl" TEXT,
    "mediaUrl" TEXT,
    "galleryImages" TEXT,
    "tags" TEXT,
    "categories" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "ppvPriceCents" INTEGER,
    "fileSizeBytes" INTEGER,
    "durationSeconds" INTEGER,
    "resolution" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "moderationNotes" TEXT,
    "aiModerationScore" DOUBLE PRECISION,
    "aiModerationFlags" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreatorUpload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PromotionalPost" (
    "id" TEXT NOT NULL,
    "creatorUserId" TEXT,
    "businessId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "bannerUrl" TEXT,
    "teaserVideoUrl" TEXT,
    "couponCode" TEXT,
    "discountPercent" INTEGER,
    "externalUrl" TEXT,
    "featuredContentId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromotionalPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CreatorSubscription" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priceCents" INTEGER NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreatorSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContentPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uploadId" TEXT,
    "contentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ppv',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentPurchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Tip" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toCreatorUserId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContentModerationLog" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentModerationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CreatorProfile_sanityCreatorId_key" ON "CreatorProfile"("sanityCreatorId");
CREATE UNIQUE INDEX IF NOT EXISTS "CreatorProfile_sanityCreatorSlug_key" ON "CreatorProfile"("sanityCreatorSlug");
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessAccount_slug_key" ON "BusinessAccount"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessMember_businessId_userId_key" ON "BusinessMember"("businessId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "CreatorUpload_sanityContentId_key" ON "CreatorUpload"("sanityContentId");
CREATE UNIQUE INDEX IF NOT EXISTS "CreatorSubscription_subscriberId_creatorUserId_key" ON "CreatorSubscription"("subscriberId", "creatorUserId");

ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessAccount" ADD CONSTRAINT "BusinessAccount_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BusinessMember" ADD CONSTRAINT "BusinessMember_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessMember" ADD CONSTRAINT "BusinessMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorUpload" ADD CONSTRAINT "CreatorUpload_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionalPost" ADD CONSTRAINT "PromotionalPost_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionalPost" ADD CONSTRAINT "PromotionalPost_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorSubscription" ADD CONSTRAINT "CreatorSubscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorSubscription" ADD CONSTRAINT "CreatorSubscription_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentPurchase" ADD CONSTRAINT "ContentPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentPurchase" ADD CONSTRAINT "ContentPurchase_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "CreatorUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_toCreatorUserId_fkey" FOREIGN KEY ("toCreatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentModerationLog" ADD CONSTRAINT "ContentModerationLog_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "CreatorUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentModerationLog" ADD CONSTRAINT "ContentModerationLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "CreatorProfile_verificationStatus_idx" ON "CreatorProfile"("verificationStatus");
CREATE INDEX IF NOT EXISTS "BusinessMember_userId_idx" ON "BusinessMember"("userId");
CREATE INDEX IF NOT EXISTS "CreatorUpload_creatorUserId_status_idx" ON "CreatorUpload"("creatorUserId", "status");
CREATE INDEX IF NOT EXISTS "CreatorUpload_status_submittedAt_idx" ON "CreatorUpload"("status", "submittedAt");
CREATE INDEX IF NOT EXISTS "PromotionalPost_creatorUserId_status_idx" ON "PromotionalPost"("creatorUserId", "status");
CREATE INDEX IF NOT EXISTS "PromotionalPost_businessId_idx" ON "PromotionalPost"("businessId");
CREATE INDEX IF NOT EXISTS "CreatorSubscription_creatorUserId_status_idx" ON "CreatorSubscription"("creatorUserId", "status");
CREATE INDEX IF NOT EXISTS "ContentPurchase_userId_idx" ON "ContentPurchase"("userId");
CREATE INDEX IF NOT EXISTS "ContentPurchase_uploadId_idx" ON "ContentPurchase"("uploadId");
CREATE INDEX IF NOT EXISTS "ContentPurchase_contentId_idx" ON "ContentPurchase"("contentId");
CREATE INDEX IF NOT EXISTS "Tip_toCreatorUserId_createdAt_idx" ON "Tip"("toCreatorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "ContentModerationLog_uploadId_createdAt_idx" ON "ContentModerationLog"("uploadId", "createdAt");
