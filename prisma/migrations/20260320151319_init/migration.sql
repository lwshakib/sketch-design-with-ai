/*
  Warnings:

  - You are about to drop the column `content` on the `screen` table. All the data in the column will be lost.
  - You are about to drop the column `generationMessageId` on the `screen` table. All the data in the column will be lost.
  - Added the required column `html` to the `screen` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `screen` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SCREEN_TYPE" AS ENUM ('web', 'app');

-- AlterTable
ALTER TABLE "screen" DROP COLUMN "content",
DROP COLUMN "generationMessageId",
ADD COLUMN     "html" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "SCREEN_TYPE" NOT NULL;
