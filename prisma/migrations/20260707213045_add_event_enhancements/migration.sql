-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ROAD', 'TRAIL', 'ULTRA', 'RELAY', 'CHARITY', 'KIDS');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "eventType" "EventType",
ADD COLUMN     "expectedRunners" INTEGER,
ADD COLUMN     "hasFinisherMedal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logistics" TEXT,
ADD COLUMN     "registrationDeadline" TIMESTAMP(3);
