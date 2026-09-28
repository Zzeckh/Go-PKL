-- Align nama tabel di database dengan schema Prisma (@@map lowercase).
--
-- Konteks: migration pertama (20260917051404_init_postgres) dibuat sebelum
-- schema diberi @@map("user"), @@map("class"), dst. Akibatnya database punya
-- tabel "User"/"Class" (huruf besar) sementara Prisma Client meng-query
-- "user"/"class" (huruf kecil) → error "The table public.user does not exist".
--
-- RENAME TABLE di PostgreSQL mempertahankan nama constraint & index lama,
-- jadi ikut di-rename agar tetap konsisten dengan hasil generate Prisma.
-- Data TIDAK berubah — hanya nama objek.

-- ── 1. Tabel ──
ALTER TABLE "User"        RENAME TO "user";
ALTER TABLE "Class"       RENAME TO "class";
ALTER TABLE "Company"     RENAME TO "company";
ALTER TABLE "Absensi"     RENAME TO "absensi";
ALTER TABLE "Logbook"     RENAME TO "logbook";
ALTER TABLE "Permission"  RENAME TO "permission";
ALTER TABLE "Evaluation"  RENAME TO "evaluation";

-- ── 2. Primary key (ikontrak ikut rename index backing-nya) ──
ALTER TABLE "user"        RENAME CONSTRAINT "User_pkey"       TO "user_pkey";
ALTER TABLE "class"       RENAME CONSTRAINT "Class_pkey"      TO "class_pkey";
ALTER TABLE "company"     RENAME CONSTRAINT "Company_pkey"    TO "company_pkey";
ALTER TABLE "absensi"     RENAME CONSTRAINT "Absensi_pkey"    TO "absensi_pkey";
ALTER TABLE "logbook"     RENAME CONSTRAINT "Logbook_pkey"    TO "logbook_pkey";
ALTER TABLE "permission"  RENAME CONSTRAINT "Permission_pkey" TO "permission_pkey";
ALTER TABLE "evaluation"  RENAME CONSTRAINT "Evaluation_pkey" TO "evaluation_pkey";

-- ── 3. Unique index (dibuat via CREATE UNIQUE INDEX, jadi ALTER INDEX) ──
ALTER INDEX "User_email_key"                          RENAME TO "user_email_key";
ALTER INDEX "Company_name_key"                        RENAME TO "company_name_key";
ALTER INDEX "Absensi_userId_date_key"                 RENAME TO "absensi_userId_date_key";
ALTER INDEX "Evaluation_studentId_evaluatorId_type_period_key" RENAME TO "evaluation_studentId_evaluatorId_type_period_key";

-- ── 4. Foreign key ──
ALTER TABLE "user"        RENAME CONSTRAINT "User_classId_fkey"          TO "user_classId_fkey";
ALTER TABLE "user"        RENAME CONSTRAINT "User_teacherId_fkey"        TO "user_teacherId_fkey";
ALTER TABLE "user"        RENAME CONSTRAINT "User_companyId_fkey"        TO "user_companyId_fkey";
ALTER TABLE "company"     RENAME CONSTRAINT "Company_mentorId_fkey"      TO "company_mentorId_fkey";
ALTER TABLE "absensi"     RENAME CONSTRAINT "Absensi_userId_fkey"        TO "absensi_userId_fkey";
ALTER TABLE "logbook"     RENAME CONSTRAINT "Logbook_userId_fkey"        TO "logbook_userId_fkey";
ALTER TABLE "permission"  RENAME CONSTRAINT "Permission_userId_fkey"     TO "permission_userId_fkey";
ALTER TABLE "evaluation"  RENAME CONSTRAINT "Evaluation_evaluatorId_fkey" TO "evaluation_evaluatorId_fkey";
ALTER TABLE "evaluation"  RENAME CONSTRAINT "Evaluation_studentId_fkey"  TO "evaluation_studentId_fkey";
