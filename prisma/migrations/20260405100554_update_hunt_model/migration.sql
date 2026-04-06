-- CreateEnum
CREATE TYPE "HuntStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "HuntVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterEnum
ALTER TYPE "ParticipationStatus" ADD VALUE 'ABANDONED';

-- AlterTable
ALTER TABLE "Hunt" ADD COLUMN     "accessCode" TEXT,
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "HuntStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "visibility" "HuntVisibility" NOT NULL DEFAULT 'PUBLIC';
