-- Kuota dua jalur: sekolah & perusahaan
ALTER TABLE "company"
  ADD COLUMN "quotaSchool"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "quotaCompany" INTEGER NOT NULL DEFAULT 0;

-- Kuota lama dianggap kuota jalur sekolah (siswa lama ditempatkan oleh Hubin)
UPDATE "company" SET "quotaSchool" = "quota";

-- Jalur penempatan siswa
ALTER TABLE "user" ADD COLUMN "placementSource" VARCHAR(20);

-- Siswa yang sudah punya perusahaan dianggap jalur sekolah
UPDATE "user" SET "placementSource" = 'sekolah' WHERE "companyId" IS NOT NULL;
