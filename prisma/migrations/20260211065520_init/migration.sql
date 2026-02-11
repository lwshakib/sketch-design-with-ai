-- CreateEnum
CREATE TYPE "MESSAGE_STATUS" AS ENUM ('generating', 'completed');

-- AlterTable
ALTER TABLE "message" ADD COLUMN     "status" "MESSAGE_STATUS" NOT NULL DEFAULT 'completed';
