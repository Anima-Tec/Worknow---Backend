-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "projectId" INTEGER NOT NULL,
    "applicantName" TEXT,
    "applicantEmail" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'En revisión',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProjectApplication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProjectApplication" ("applicantEmail", "applicantName", "createdAt", "id", "projectId", "userId") SELECT "applicantEmail", "applicantName", "createdAt", "id", "projectId", "userId" FROM "ProjectApplication";
DROP TABLE "ProjectApplication";
ALTER TABLE "new_ProjectApplication" RENAME TO "ProjectApplication";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
