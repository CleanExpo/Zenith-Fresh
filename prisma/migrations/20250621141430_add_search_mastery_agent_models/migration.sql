/*
  Warnings:

  - You are about to drop the `CoMarketingCampaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Partner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartnerApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartnerAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartnerPerformance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartnerReferral` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ZenithExpert` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CoMarketingCampaign" DROP CONSTRAINT "CoMarketingCampaign_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "PartnerAsset" DROP CONSTRAINT "PartnerAsset_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "PartnerPerformance" DROP CONSTRAINT "PartnerPerformance_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "PartnerReferral" DROP CONSTRAINT "PartnerReferral_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "ZenithExpert" DROP CONSTRAINT "ZenithExpert_partnerId_fkey";

-- DropTable
DROP TABLE "CoMarketingCampaign";

-- DropTable
DROP TABLE "Partner";

-- DropTable
DROP TABLE "PartnerApplication";

-- DropTable
DROP TABLE "PartnerAsset";

-- DropTable
DROP TABLE "PartnerPerformance";

-- DropTable
DROP TABLE "PartnerReferral";

-- DropTable
DROP TABLE "ZenithExpert";

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" "PartnerTier" NOT NULL DEFAULT 'STANDARD',
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "partnershipType" "PartnershipType" NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "totalReferrals" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "featuredUntil" TIMESTAMP(3),
    "apiKey" TEXT,
    "webhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_applications" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceOffered" TEXT NOT NULL,
    "partnershipType" "PartnershipType" NOT NULL,
    "whyPartner" TEXT NOT NULL,
    "previousExperience" TEXT,
    "expectedVolume" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_referrals" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "conversionValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "commissionStatus" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "conversionDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_assets" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_performance" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_marketing_campaigns" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "targetAudience" TEXT,
    "budget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "results" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zenith_experts" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "expertName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "specialties" TEXT[],
    "hourlyRate" DOUBLE PRECISION,
    "availability" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "rating" DOUBLE PRECISION DEFAULT 0.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "portfolioUrl" TEXT,
    "linkedinUrl" TEXT,
    "certificationsPath" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zenith_experts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backlink_opportunities" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "domainAuthority" INTEGER NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "linkingToDomain" TEXT NOT NULL,
    "anchorText" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "trafficEstimate" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'potential',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backlink_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_campaigns" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "targetDomain" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "articleTitle" TEXT NOT NULL,
    "articleContent" TEXT NOT NULL,
    "articleUrl" TEXT,
    "emailSequence" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "lastContactDate" TIMESTAMP(3),
    "responseReceived" BOOLEAN NOT NULL DEFAULT false,
    "backlinkAcquired" BOOLEAN NOT NULL DEFAULT false,
    "backlinkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acquired_backlinks" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "anchorText" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "domainAuthority" INTEGER NOT NULL,
    "pageAuthority" INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isValuable" BOOLEAN NOT NULL DEFAULT false,
    "discoveredDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedDate" TIMESTAMP(3),
    "campaignId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acquired_backlinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_console_missions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "sitemapSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "crawlErrors" JSONB,
    "performanceData" JSONB,
    "indexingRequests" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_console_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_mastery_missions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "opportunitiesFound" INTEGER,
    "campaignsCreated" INTEGER,
    "backlinksVerified" INTEGER,
    "gscTasksCompleted" INTEGER,
    "results" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "estimatedCompletionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_mastery_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "niche" TEXT,
    "competitors" TEXT[],
    "targetKeywords" TEXT[],
    "authorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "gscToken" TEXT,
    "lastAnalyzed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_apiKey_key" ON "partners"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "partner_referrals_referralCode_key" ON "partner_referrals"("referralCode");

-- CreateIndex
CREATE INDEX "partner_referrals_partnerId_idx" ON "partner_referrals"("partnerId");

-- CreateIndex
CREATE INDEX "partner_assets_partnerId_idx" ON "partner_assets"("partnerId");

-- CreateIndex
CREATE INDEX "partner_performance_partnerId_idx" ON "partner_performance"("partnerId");

-- CreateIndex
CREATE INDEX "co_marketing_campaigns_partnerId_idx" ON "co_marketing_campaigns"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "zenith_experts_partnerId_key" ON "zenith_experts"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "acquired_backlinks_url_key" ON "acquired_backlinks"("url");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_userId_key" ON "client_profiles"("userId");

-- AddForeignKey
ALTER TABLE "partner_referrals" ADD CONSTRAINT "partner_referrals_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_assets" ADD CONSTRAINT "partner_assets_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_performance" ADD CONSTRAINT "partner_performance_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_marketing_campaigns" ADD CONSTRAINT "co_marketing_campaigns_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zenith_experts" ADD CONSTRAINT "zenith_experts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
