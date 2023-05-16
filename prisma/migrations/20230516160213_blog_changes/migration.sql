/*
  Warnings:

  - The primary key for the `PostAttachedFiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `file` on the `PostAttachedFiles` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `PostAttachedFiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[filePath]` on the table `PostAttachedFiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `filePath` to the `PostAttachedFiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PostAttachedFiles" DROP CONSTRAINT "PostAttachedFiles_pkey",
DROP COLUMN "file",
DROP COLUMN "id",
ADD COLUMN     "filePath" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PostAttachedFiles_filePath_key" ON "PostAttachedFiles"("filePath");
