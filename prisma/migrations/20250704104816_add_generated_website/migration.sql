-- CreateTable
CREATE TABLE "GeneratedWebsite" (
    "id" TEXT NOT NULL,
    "files" JSONB NOT NULL,
    "audit" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedWebsite_pkey" PRIMARY KEY ("id")
);
