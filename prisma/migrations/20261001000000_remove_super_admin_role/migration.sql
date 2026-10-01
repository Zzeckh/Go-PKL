-- Remove legacy Super Admin accounts and enum value without resetting the database.
-- This migration aborts if a legacy account is the evaluator on another user's evaluation,
-- because silently deleting that evaluation would destroy student history.
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "evaluation" e
    JOIN "user" sa ON sa."id" = e."evaluatorId"
    WHERE sa."role"::text = 'super_admin'
      AND NOT EXISTS (
        SELECT 1 FROM "user" student_sa
        WHERE student_sa."id" = e."studentId"
          AND student_sa."role"::text = 'super_admin'
      )
  ) THEN
    RAISE EXCEPTION 'Migration dihentikan: akun super_admin tercatat sebagai penilai pada evaluasi siswa. Periksa/reassign evaluasi tersebut terlebih dahulu; tidak ada data yang dihapus.';
  END IF;
END $$;

-- Hapus evaluasi yang melekat pada akun super_admin itu sendiri (jika ada).
DELETE FROM "evaluation"
WHERE "studentId" IN (SELECT "id" FROM "user" WHERE "role"::text = 'super_admin');

-- Hapus data aktivitas yang dimiliki akun super_admin lama saja.
DELETE FROM "absensi"
WHERE "userId" IN (SELECT "id" FROM "user" WHERE "role"::text = 'super_admin');
DELETE FROM "logbook"
WHERE "userId" IN (SELECT "id" FROM "user" WHERE "role"::text = 'super_admin');
DELETE FROM "permission"
WHERE "userId" IN (SELECT "id" FROM "user" WHERE "role"::text = 'super_admin');

-- Relasi opsional dialihkan menjadi NULL; data siswa/perusahaan tetap ada.
UPDATE "user" SET "teacherId" = NULL
WHERE "teacherId" IN (SELECT "id" FROM "user" WHERE "role"::text = 'super_admin');
UPDATE "company" SET "mentorId" = NULL
WHERE "mentorId" IN (SELECT "id" FROM "user" WHERE "role"::text = 'super_admin');

DELETE FROM "user" WHERE "role"::text = 'super_admin';

-- PostgreSQL tidak mendukung DROP VALUE enum secara langsung; buat ulang enum tanpa nilai lama.
CREATE TYPE "Role_new" AS ENUM ('student', 'teacher', 'mentor', 'hubin');
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'student';
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

COMMIT;
