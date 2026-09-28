-- AlterTable
ALTER TABLE "class" ADD COLUMN     "academicYearId" INTEGER;

-- AlterTable
ALTER TABLE "company" ADD COLUMN     "academicYearId" INTEGER;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "academicYearId" INTEGER,
ADD COLUMN     "inactiveAt" TIMESTAMP(3),
ADD COLUMN     "inactiveCategory" TEXT,
ADD COLUMN     "inactiveReason" TEXT;

-- CreateTable
CREATE TABLE "academicyear" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academicyear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academicyear_name_key" ON "academicyear"("name");

-- CreateIndex
CREATE INDEX "class_academicYearId_idx" ON "class"("academicYearId");

-- CreateIndex
CREATE INDEX "company_academicYearId_idx" ON "company"("academicYearId");

-- CreateIndex
CREATE INDEX "company_mentorId_idx" ON "company"("mentorId");

-- CreateIndex
CREATE INDEX "evaluation_evaluatorId_idx" ON "evaluation"("evaluatorId");

-- CreateIndex
CREATE INDEX "logbook_userId_idx" ON "logbook"("userId");

-- CreateIndex
CREATE INDEX "permission_userId_idx" ON "permission"("userId");

-- CreateIndex
CREATE INDEX "user_academicYearId_idx" ON "user"("academicYearId");

-- CreateIndex
CREATE INDEX "user_classId_idx" ON "user"("classId");

-- CreateIndex
CREATE INDEX "user_teacherId_idx" ON "user"("teacherId");

-- CreateIndex
CREATE INDEX "user_companyId_idx" ON "user"("companyId");

-- AddForeignKey
ALTER TABLE "class" ADD CONSTRAINT "class_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academicyear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academicyear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academicyear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

