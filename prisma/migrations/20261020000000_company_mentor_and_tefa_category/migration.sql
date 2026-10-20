-- Sinkronisasi schema fitur baru (TEFA + multi-mentor per perusahaan).
-- Catatan: "quota" di-RENAME (bukan drop+create) supaya nilai kuota yang
-- sudah diisi tidak hilang.

-- 1. Company.quota → Company.quotaCompany
ALTER TABLE "company" RENAME COLUMN "quota" TO "quotaCompany";

-- 2. Kategori TEFA pada user
ALTER TABLE "user" ADD COLUMN "tefaCategory" VARCHAR(20);

-- 3. Relasi banyak mentor per perusahaan
CREATE TABLE "company_mentor" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "mentorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_mentor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "company_mentor_mentorId_idx" ON "company_mentor"("mentorId");

CREATE UNIQUE INDEX "company_mentor_companyId_mentorId_key" ON "company_mentor"("companyId", "mentorId");

ALTER TABLE "company_mentor" ADD CONSTRAINT "company_mentor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_mentor" ADD CONSTRAINT "company_mentor_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
