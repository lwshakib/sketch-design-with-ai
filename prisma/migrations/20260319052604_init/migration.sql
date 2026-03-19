/*
  Warnings:

  - You are about to drop the column `selectedTheme` on the `project` table. All the data in the column will be lost.
  - You are about to drop the column `themes` on the `project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "project" DROP COLUMN "selectedTheme",
DROP COLUMN "themes";
