/*
  Warnings:

  - You are about to drop the column `subscriptionId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `paymentIntentId` on the `website_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `website_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `website_analyses` table. All the data in the column will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "users_subscriptionId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "subscriptionId";

-- AlterTable
ALTER TABLE "website_analyses" DROP COLUMN "paymentIntentId",
DROP COLUMN "paymentStatus",
DROP COLUMN "plan";

-- DropTable
DROP TABLE "payments";

-- DropEnum
DROP TYPE "PaymentStatus";
