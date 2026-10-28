/*
  Warnings:

  - You are about to drop the column `videoUrl` on the `Aula` table. All the data in the column will be lost.
  - Added the required column `videoId` to the `Aula` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Aula` DROP COLUMN `videoUrl`,
    ADD COLUMN `videoId` VARCHAR(100) NOT NULL;
