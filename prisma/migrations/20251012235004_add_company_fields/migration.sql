/*
  Warnings:

  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `apellido` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `biografia` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ciudad` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `educacion` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `experiencia` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fechaNacimiento` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `habilidades` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profesion` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `User` table. All the data in the column will be lost.
  - Added the required column `nombreEmpresa` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ProjectApplication_userId_projectId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Job";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Project";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProjectApplication";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COMPANY',
    "nombreEmpresa" TEXT NOT NULL,
    "rut" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "sector" TEXT,
    "sitioWeb" TEXT,
    "tamano" TEXT,
    "descripcion" TEXT,
    "logoUrl" TEXT,
    "fundada" TEXT,
    "empleados" TEXT,
    "ubicaciones" TEXT,
    "mision" TEXT,
    "vision" TEXT,
    "twitter" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Company" ("createdAt", "email", "id", "password", "role") SELECT "createdAt", "email", "id", "password", "role" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "name" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password", "role") SELECT "createdAt", "email", "id", "password", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
