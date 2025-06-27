/*
  Warnings:

  - You are about to drop the column `resultUrl` on the `PostJob` table. All the data in the column will be lost.

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
    "status" TEXT NOT NULL,
    "resultMsg" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "postedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PostJob" ("createdAt", "desc", "id", "loginId", "loginPassword", "resultMsg", "scheduledAt", "status", "subject", "updatedAt") SELECT "createdAt", "desc", "id", "loginId", "loginPassword", "resultMsg", "scheduledAt", "status", "subject", "updatedAt" FROM "PostJob";
DROP TABLE "PostJob";
ALTER TABLE "new_PostJob" RENAME TO "PostJob";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
