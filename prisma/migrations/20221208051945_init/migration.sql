-- CreateTable
CREATE TABLE `requestItems` (
    `id` INTEGER NOT NULL,
    `ItemCode` VARCHAR(191) NOT NULL,
    `ItemName` VARCHAR(191) NOT NULL,
    `ListNum` INTEGER NOT NULL,
    `ListName` VARCHAR(191) NOT NULL,
    `AvgDaily` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `SuggQty` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `OnHand` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `MinStock` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `MaxStock` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `Price` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `BuyUnitMsr` VARCHAR(191) NOT NULL DEFAULT 'Piece',
    `WhsCode` VARCHAR(191) NOT NULL,
    `WhsName` VARCHAR(191) NOT NULL,
    `CodeBars` VARCHAR(191) NOT NULL DEFAULT 'no bar code',
    `ConvFactor` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `Warehousefrom` VARCHAR(191) NOT NULL DEFAULT '',
    `Warehouses` VARCHAR(191) NOT NULL DEFAULT '',
    `Order` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `GenCode` VARCHAR(191) NOT NULL,
    `Suggest` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `requestItems_id_key`(`id`),
    UNIQUE INDEX `requestItems_ItemCode_key`(`ItemCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requestReceiptItems` (
    `id` INTEGER NOT NULL,
    `ItemCode` VARCHAR(191) NOT NULL,
    `ItemName` VARCHAR(191) NOT NULL,
    `ListNum` INTEGER NOT NULL,
    `ListName` VARCHAR(191) NOT NULL,
    `OnHand` DECIMAL(10, 6) NOT NULL,
    `MinStock` DECIMAL(10, 6) NOT NULL,
    `MaxStock` DECIMAL(10, 6) NOT NULL,
    `Price` DECIMAL(10, 6) NOT NULL,
    `BuyUnitMsr` VARCHAR(191) NOT NULL DEFAULT 'Piece',
    `WhsCode` VARCHAR(191) NOT NULL,
    `WhsName` VARCHAR(191) NOT NULL,
    `CodeBars` VARCHAR(191) NOT NULL DEFAULT 'no bar code',
    `ConvFactor` DECIMAL(10, 6) NOT NULL,
    `Warehousefrom` VARCHAR(191) NOT NULL DEFAULT '',
    `OrderRequest` DECIMAL(10, 6) NOT NULL,
    `Order` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `Difference` DECIMAL(10, 6) NOT NULL,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `GenCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `requestReceiptItems_id_key`(`id`),
    UNIQUE INDEX `requestReceiptItems_ItemCode_key`(`ItemCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rquestOrderhistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ItemCode` VARCHAR(191) NOT NULL,
    `ItemName` VARCHAR(191) NOT NULL,
    `ListNum` INTEGER NOT NULL,
    `ListName` VARCHAR(191) NOT NULL,
    `OnHand` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `MinStock` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `MaxStock` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `Price` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `BuyUnitMsr` VARCHAR(191) NOT NULL,
    `WhsCode` VARCHAR(191) NOT NULL,
    `WhsName` VARCHAR(191) NOT NULL,
    `CodeBars` VARCHAR(191) NOT NULL DEFAULT 'no bar code',
    `ConvFactor` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `Warehousefrom` VARCHAR(191) NOT NULL DEFAULT '',
    `Order` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `Status` VARCHAR(191) NOT NULL,
    `GenCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deliveredItemshistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ItemCode` VARCHAR(191) NOT NULL,
    `ItemName` VARCHAR(191) NOT NULL,
    `CodeBars` VARCHAR(191) NOT NULL,
    `WhsCode` VARCHAR(191) NOT NULL,
    `WarehouseTo` VARCHAR(191) NOT NULL,
    `WhsName` VARCHAR(191) NOT NULL,
    `Order` DECIMAL(10, 6) NOT NULL,
    `OrderRequest` DECIMAL(10, 6) NOT NULL,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'delivered',
    `BuyUnitMsr` VARCHAR(191) NOT NULL,
    `GenCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receiptItems` (
    `id` INTEGER NOT NULL,
    `ItemCode` VARCHAR(191) NOT NULL,
    `LineNum` INTEGER NOT NULL,
    `Dscription` VARCHAR(191) NOT NULL,
    `CodeBars` VARCHAR(191) NOT NULL DEFAULT 'no bar code',
    `WhsCode` VARCHAR(191) NOT NULL,
    `CardName` VARCHAR(191) NOT NULL,
    `CardCode` VARCHAR(191) NOT NULL,
    `DocNum` VARCHAR(191) NOT NULL,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `UgpName` VARCHAR(191) NOT NULL,
    `Order` DECIMAL(10, 6) NOT NULL,
    `OpenQty` DECIMAL(10, 6) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `receiptItems_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receipthistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ItemCode` VARCHAR(191) NOT NULL,
    `LineNum` INTEGER NOT NULL,
    `Dscription` VARCHAR(191) NOT NULL,
    `CodeBars` VARCHAR(191) NOT NULL DEFAULT 'no bar code',
    `WhsCode` VARCHAR(191) NOT NULL,
    `CardName` VARCHAR(191) NOT NULL,
    `CardCode` VARCHAR(191) NOT NULL,
    `DocNum` VARCHAR(191) NOT NULL,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'received',
    `UgpName` VARCHAR(191) NOT NULL,
    `Order` DECIMAL(10, 6) NOT NULL,
    `OpenQty` DECIMAL(10, 6) NOT NULL,
    `GenCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `returnItems` (
    `id` INTEGER NOT NULL,
    `ItemCode` VARCHAR(191) NOT NULL,
    `ItemName` VARCHAR(191) NOT NULL,
    `CodeBars` VARCHAR(191) NOT NULL DEFAULT 'no bar code',
    `WhsCode` VARCHAR(191) NOT NULL,
    `DocNum` INTEGER NOT NULL DEFAULT 0,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `BuyUnitMsr` VARCHAR(191) NOT NULL,
    `Order` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `returnItems_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `returnhistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ItemCode` VARCHAR(191) NOT NULL,
    `ItemName` VARCHAR(191) NOT NULL,
    `CodeBars` VARCHAR(191) NOT NULL DEFAULT 'no bar code',
    `WhsCode` VARCHAR(191) NOT NULL,
    `DocNum` INTEGER NOT NULL,
    `Status` VARCHAR(191) NOT NULL,
    `BuyUnitMsr` VARCHAR(191) NOT NULL,
    `Order` DECIMAL(10, 6) NOT NULL,
    `genCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countRequest` (
    `id` INTEGER NOT NULL,
    `CountingName` VARCHAR(191) NOT NULL,
    `CountingDate` DATETIME(3) NOT NULL,
    `ItemCode` VARCHAR(191) NOT NULL,
    `ItemName` VARCHAR(191) NOT NULL,
    `BuyUnitMsr` VARCHAR(191) NOT NULL,
    `WhsCode` VARCHAR(191) NOT NULL,
    `CodeBars` VARCHAR(191) NOT NULL DEFAULT 'no bar code',
    `Note` VARCHAR(191) NOT NULL,
    `Qnty` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `Price` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `ScaleType` VARCHAR(191) NOT NULL,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `countRequest_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `CountingName` VARCHAR(191) NOT NULL,
    `CountingDate` DATETIME(3) NOT NULL,
    `ItemCode` VARCHAR(191) NOT NULL,
    `ItemName` VARCHAR(191) NOT NULL,
    `BuyUnitMsr` VARCHAR(191) NOT NULL,
    `WhsCode` VARCHAR(191) NOT NULL,
    `CodeBars` VARCHAR(191) NOT NULL DEFAULT 'no bar code',
    `Note` VARCHAR(191) NOT NULL,
    `Qnty` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `Status` VARCHAR(191) NOT NULL DEFAULT 'sent',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
