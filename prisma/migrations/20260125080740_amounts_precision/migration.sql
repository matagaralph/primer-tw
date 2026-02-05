/*
  Warnings:

  - You are about to alter the column `spend_per_point` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE `campaigns` MODIFY `spend_per_point` DECIMAL(10, 2) NOT NULL;
