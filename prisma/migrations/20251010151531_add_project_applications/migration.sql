/*
  Warnings:

  - Added the required column `applicantEmail` to the `ProjectApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applicantName` to the `ProjectApplication` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" TEXT,
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
CREATE TABLE "new_ProjectApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    CONSTRAINT "ProjectApplication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProjectApplication" ("createdAt", "id", "projectId", "userId") SELECT "createdAt", "id", "projectId", "userId" FROM "ProjectApplication";
DROP TABLE "ProjectApplication";
ALTER TABLE "new_ProjectApplication" RENAME TO "ProjectApplication";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
