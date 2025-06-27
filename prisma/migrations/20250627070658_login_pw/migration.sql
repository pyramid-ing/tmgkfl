/*
  Warnings:

  - You are about to drop the column `loginPassword` on the `PostJob` table. All the data in the column will be lost.
  - Added the required column `loginPw` to the `PostJob` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PostJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT,
    "desc" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "loginPw" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resultMsg" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "postedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PostJob" ("createdAt", "desc", "id", "loginId", "postedAt", "resultMsg", "scheduledAt", "status", "subject", "updatedAt") SELECT "createdAt", "desc", "id", "loginId", "postedAt", "resultMsg", "scheduledAt", "status", "subject", "updatedAt" FROM "PostJob";
DROP TABLE "PostJob";
ALTER TABLE "new_PostJob" RENAME TO "PostJob";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
