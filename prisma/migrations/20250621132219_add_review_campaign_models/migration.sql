-- CreateEnum
CREATE TYPE "ReviewTriggerType" AS ENUM ('FREE_USER', 'PAID_CLIENT');

-- CreateEnum
CREATE TYPE "ReviewCampaignStatus" AS ENUM ('PENDING', 'SENT', 'OPENED', 'CLICKED', 'RESPONDED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'APPROVED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EnhancementType" AS ENUM ('FAQ_UPDATE', 'TESTIMONIAL_WIDGET', 'LANDING_PAGE_UPDATE', 'CASE_STUDY', 'SOCIAL_PROOF_ELEMENT');

-- CreateEnum
CREATE TYPE "EnhancementStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "review_campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "triggerType" "ReviewTriggerType" NOT NULL,
    "status" "ReviewCampaignStatus" NOT NULL DEFAULT 'PENDING',
    "contextData" JSONB,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailOpenedAt" TIMESTAMP(3),
    "emailClickedAt" TIMESTAMP(3),
    "responseAt" TIMESTAMP(3),
    "reviewSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "reviewId" TEXT,
    "reviewRating" INTEGER,
    "reviewText" TEXT,
    "testimonialCreated" BOOLEAN NOT NULL DEFAULT false,
    "socialCampaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonial_assets" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorTitle" TEXT,
    "authorCompany" TEXT,
    "imageUrl" TEXT,
    "designStyle" TEXT NOT NULL,
    "brandColors" JSONB NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "mediaAgentTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonial_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_proof_campaigns" (
    "id" TEXT NOT NULL,
    "reviewCampaignId" TEXT NOT NULL,
    "testimonialAssetId" TEXT,
    "platforms" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "imageUrl" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "engagementStats" JSONB,
    "approvalRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_proof_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_enhancements" (
    "id" TEXT NOT NULL,
    "type" "EnhancementType" NOT NULL,
    "sourceReviewId" TEXT,
    "content" JSONB NOT NULL,
    "status" "EnhancementStatus" NOT NULL DEFAULT 'PENDING',
    "implementedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_enhancements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_analytics" (
    "id" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "campaignsSent" INTEGER NOT NULL DEFAULT 0,
    "emailsOpened" INTEGER NOT NULL DEFAULT 0,
    "emailsClicked" INTEGER NOT NULL DEFAULT 0,
    "reviewsReceived" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "testimonialsCreated" INTEGER NOT NULL DEFAULT 0,
    "socialPostsPublished" INTEGER NOT NULL DEFAULT 0,
    "websiteUpdates" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_analytics_timeframe_date_key" ON "review_analytics"("timeframe", "date");

-- AddForeignKey
ALTER TABLE "review_campaigns" ADD CONSTRAINT "review_campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonial_assets" ADD CONSTRAINT "testimonial_assets_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "review_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_proof_campaigns" ADD CONSTRAINT "social_proof_campaigns_reviewCampaignId_fkey" FOREIGN KEY ("reviewCampaignId") REFERENCES "review_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
