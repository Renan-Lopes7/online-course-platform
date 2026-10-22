/*
  Warnings:

  - A unique constraint covering the columns `[pagamentoId]` on the table `Compra` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price` to the `Curso` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Aula` DROP FOREIGN KEY `Aula_cursoId_fkey`;

-- DropIndex
DROP INDEX `Aula_cursoId_fkey` ON `Aula`;

-- AlterTable
ALTER TABLE `Compra` ADD COLUMN `expiraEm` DATETIME(3) NULL,
    ADD COLUMN `pagamentoId` VARCHAR(191) NULL,
    ADD COLUMN `pagoEm` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Curso` ADD COLUMN `price` DECIMAL(10, 2) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Compra_pagamentoId_key` ON `Compra`(`pagamentoId`);

-- AddForeignKey
ALTER TABLE `Aula` ADD CONSTRAINT `Aula_cursoId_fkey` FOREIGN KEY (`cursoId`) REFERENCES `Curso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
