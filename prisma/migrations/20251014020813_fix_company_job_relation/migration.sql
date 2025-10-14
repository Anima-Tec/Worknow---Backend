/*
  Warnings:

  - You are about to drop the column `area` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `companyWebsite` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `contractType` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `jobType` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `projectUrl` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `salaryRange` on the `Job` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "JobApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "visto" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompletedProject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "description" TEXT,
    "completionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "skills" TEXT,
    "duration" TEXT,
    "modality" TEXT,
    "remuneration" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "applicationId" INTEGER,
    CONSTRAINT "CompletedProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" TEXT,
    "location" TEXT,
    "remuneration" TEXT,
    "modality" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("createdAt", "description", "id", "location", "modality", "title") SELECT "createdAt", "description", "id", "location", "modality", "title" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" JSONB,
    "duration" TEXT,
    "modality" TEXT,
    "remuneration" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" INTEGER NOT NULL,
    CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("companyId", "createdAt", "description", "duration", "id", "isActive", "location", "modality", "remuneration", "skills", "title", "updatedAt") SELECT "companyId", "createdAt", "description", "duration", "id", "isActive", "location", "modality", "remuneration", "skills", "title", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_userId_jobId_key" ON "JobApplication"("userId", "jobId");
