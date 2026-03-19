/*
  Warnings:

  - You are about to drop the column `credits` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `lastReset` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `credit_usage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "credit_usage" DROP CONSTRAINT "credit_usage_userId_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "credits",
DROP COLUMN "lastReset";

-- DropTable
DROP TABLE "credit_usage";
