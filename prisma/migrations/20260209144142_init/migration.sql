/*
  Warnings:

  - You are about to drop the column `parts` on the `message` table. All the data in the column will be lost.
  - Added the required column `content` to the `message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "message" DROP COLUMN "parts",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "plan" JSONB;
