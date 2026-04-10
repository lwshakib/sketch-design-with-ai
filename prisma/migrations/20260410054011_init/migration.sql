-- CreateTable
CREATE TABLE "theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Horizon Ethos',
    "variables" JSONB NOT NULL,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" INTEGER DEFAULT 1200,
    "height" INTEGER DEFAULT 800,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "theme_projectId_idx" ON "theme"("projectId");

-- AddForeignKey
ALTER TABLE "theme" ADD CONSTRAINT "theme_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
