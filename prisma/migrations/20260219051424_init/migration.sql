/*
  Warnings:

  - You are about to drop the column `conclusionText` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrls` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `introductoryText` on the `message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "message" DROP COLUMN "conclusionText",
DROP COLUMN "imageUrls",
DROP COLUMN "introductoryText",
ADD COLUMN     "parts" JSONB;
