-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- AlterTable: convert "User"."role" from TEXT to UserRole (preserves existing data)
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE WHEN "role" IN ('user', 'admin') THEN "role"::"UserRole"
  ELSE 'user'::"UserRole"
  END
);
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user'::"UserRole";
