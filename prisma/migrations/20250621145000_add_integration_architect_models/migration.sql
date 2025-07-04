-- CreateTable
CREATE TABLE "IntegrationRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "sourceService" TEXT NOT NULL,
    "targetLocation" TEXT NOT NULL,
    "dataRequirements" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "estimatedComplexity" TEXT,
    "estimatedTimeMinutes" INTEGER,
    "estimatedValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationPlan" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authMethod" TEXT NOT NULL,
    "credentialsRequired" TEXT NOT NULL,
    "apiRoutes" TEXT NOT NULL,
    "components" TEXT NOT NULL,
    "dataTransformations" TEXT NOT NULL,
    "testingStrategy" TEXT NOT NULL,
    "estimatedComplexity" TEXT NOT NULL,
    "estimatedTimeMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationExecution" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pullRequestUrl" TEXT,
    "pullRequestBranch" TEXT,
    "filesCreated" TEXT NOT NULL DEFAULT '[]',
    "executionLog" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCredential" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "credentialData" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationComponent" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "componentCode" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "props" TEXT NOT NULL DEFAULT '{}',
    "dependencies" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationTest" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "testCode" TEXT NOT NULL,
    "testData" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lastRunAt" TIMESTAMP(3),
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationMetrics" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "metricUnit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "IntegrationMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationPlan_integrationId_key" ON "IntegrationPlan"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationExecution_integrationId_key" ON "IntegrationExecution"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCredential_clientId_serviceName_key" ON "IntegrationCredential"("clientId", "serviceName");

-- CreateIndex
CREATE INDEX "IntegrationRequest_clientId_idx" ON "IntegrationRequest"("clientId");

-- CreateIndex
CREATE INDEX "IntegrationRequest_status_idx" ON "IntegrationRequest"("status");

-- CreateIndex
CREATE INDEX "IntegrationPlan_status_idx" ON "IntegrationPlan"("status");

-- CreateIndex
CREATE INDEX "IntegrationExecution_status_idx" ON "IntegrationExecution"("status");

-- CreateIndex
CREATE INDEX "IntegrationComponent_integrationId_idx" ON "IntegrationComponent"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationTest_integrationId_idx" ON "IntegrationTest"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationMetrics_integrationId_idx" ON "IntegrationMetrics"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationMetrics_recordedAt_idx" ON "IntegrationMetrics"("recordedAt");

-- AddForeignKey
ALTER TABLE "IntegrationPlan" ADD CONSTRAINT "IntegrationPlan_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "IntegrationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationExecution" ADD CONSTRAINT "IntegrationExecution_planId_fkey" FOREIGN KEY ("planId") REFERENCES "IntegrationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationComponent" ADD CONSTRAINT "IntegrationComponent_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationPlan"("integrationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationTest" ADD CONSTRAINT "IntegrationTest_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationPlan"("integrationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationMetrics" ADD CONSTRAINT "IntegrationMetrics_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationPlan"("integrationId") ON DELETE CASCADE ON UPDATE CASCADE;
