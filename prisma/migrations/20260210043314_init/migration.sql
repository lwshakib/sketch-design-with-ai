-- AlterTable
ALTER TABLE "screen" ADD COLUMN     "isDisliked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLiked" BOOLEAN NOT NULL DEFAULT false;
