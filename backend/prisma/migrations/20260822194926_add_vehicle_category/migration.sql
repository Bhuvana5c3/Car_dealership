/*
  Warnings:

  - Added the required column `category` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "category" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Vehicle_category_idx" ON "Vehicle"("category");
