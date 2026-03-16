-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSecret" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skyfiKey" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'claude',
    "aiKey" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AoiSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "label" TEXT,
    "aoiWkt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AoiSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AoiEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "payload" JSONB NOT NULL,
    "purchaseInvitation" JSONB,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AoiEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSecret_userId_key" ON "UserSecret"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AoiSubscription_subscriptionId_key" ON "AoiSubscription"("subscriptionId");

-- CreateIndex
CREATE INDEX "AoiSubscription_userId_idx" ON "AoiSubscription"("userId");

-- CreateIndex
CREATE INDEX "AoiEvent_userId_idx" ON "AoiEvent"("userId");

-- CreateIndex
CREATE INDEX "AoiEvent_subscriptionId_idx" ON "AoiEvent"("subscriptionId");

-- AddForeignKey
ALTER TABLE "UserSecret" ADD CONSTRAINT "UserSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AoiSubscription" ADD CONSTRAINT "AoiSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AoiEvent" ADD CONSTRAINT "AoiEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AoiEvent" ADD CONSTRAINT "AoiEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AoiSubscription"("subscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;
