-- AlterTable
ALTER TABLE `requestitems` ADD COLUMN `AvgDaily` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    ADD COLUMN `SuggQty` DECIMAL(10, 6) NOT NULL DEFAULT 0;
