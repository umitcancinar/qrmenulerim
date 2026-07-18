CREATE TABLE "StandProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "dimensions" TEXT NOT NULL,
    "imageUrl" TEXT,
    "visualStyle" TEXT NOT NULL DEFAULT 'obsidian',
    "price" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StandProduct_slug_key" ON "StandProduct"("slug");
CREATE INDEX "StandProduct_isActive_sortOrder_idx" ON "StandProduct"("isActive", "sortOrder");
