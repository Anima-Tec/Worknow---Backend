/*
  Warnings:

  - You are about to drop the column `location` on the `Project` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" JSONB,
    "duration" TEXT,
    "modality" TEXT,
    "remuneration" TEXT,
    "deliveryFormat" TEXT,
    "evaluationCriteria" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER,
    CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("companyId", "createdAt", "deliveryFormat", "description", "duration", "evaluationCriteria", "id", "isActive", "modality", "remuneration", "skills", "title", "updatedAt") SELECT "companyId", "createdAt", "deliveryFormat", "description", "duration", "evaluationCriteria", "id", "isActive", "modality", "remuneration", "skills", "title", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
