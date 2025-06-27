/*
  Warnings:

  - You are about to drop the column `contentHtml` on the `PostJob` table. All the data in the column will be lost.
  - You are about to drop the column `galleryUrl` on the `PostJob` table. All the data in the column will be lost.
  - You are about to drop the column `headtext` on the `PostJob` table. All the data in the column will be lost.
  - You are about to drop the column `imagePaths` on the `PostJob` table. All the data in the column will be lost.
  - You are about to drop the column `nickname` on the `PostJob` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `PostJob` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `PostJob` table. All the data in the column will be lost.
  - Added the required column `desc` to the `PostJob` table without a default value. This is not possible if the table is not empty.
  - Made the column `loginId` on table `PostJob` required. This step will fail if there are existing NULL values in that column.
  - Made the column `loginPassword` on table `PostJob` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PostJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT,
    "desc" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "loginPassword" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "resultMsg" TEXT,
    "resultUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PostJob" ("createdAt", "id", "loginId", "loginPassword", "resultMsg", "resultUrl", "scheduledAt", "status", "updatedAt") SELECT "createdAt", "id", "loginId", "loginPassword", "resultMsg", "resultUrl", "scheduledAt", "status", "updatedAt" FROM "PostJob";
DROP TABLE "PostJob";
ALTER TABLE "new_PostJob" RENAME TO "PostJob";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
