-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE');

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyName" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "tshirtSize" TEXT,
ADD COLUMN     "waiverAcceptedAt" TIMESTAMP(3);
