/*
  Warnings:

  - You are about to drop the `workspace` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "workspace" DROP CONSTRAINT "workspace_userId_fkey";

-- DropTable
DROP TABLE "workspace";
