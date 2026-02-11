/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "project" ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "project_shareToken_key" ON "project"("shareToken");
