-- =========================================================
-- 1. PROGRAM KEAHLIAN & KONSENTRASI KEAHLIAN
-- =========================================================

CREATE TABLE "program_keahlian" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_keahlian_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "program_keahlian_name_key" ON "program_keahlian"("name");

CREATE TABLE "konsentrasi_keahlian" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "programKeahlianId" INTEGER NOT NULL,

    CONSTRAINT "konsentrasi_keahlian_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "konsentrasi_keahlian_programKeahlianId_name_key"
    ON "konsentrasi_keahlian"("programKeahlianId", "name");
CREATE INDEX "konsentrasi_keahlian_programKeahlianId_idx"
    ON "konsentrasi_keahlian"("programKeahlianId");

ALTER TABLE "konsentrasi_keahlian"
    ADD CONSTRAINT "konsentrasi_keahlian_programKeahlianId_fkey"
    FOREIGN KEY ("programKeahlianId") REFERENCES "program_keahlian"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "class" ADD COLUMN "programKeahlianId" INTEGER;
ALTER TABLE "class" ADD COLUMN "konsentrasiKeahlianId" INTEGER;

-- Pindahkan data lama: kolom "major" menjadi Program Keahlian.
INSERT INTO "program_keahlian" ("name")
SELECT DISTINCT btrim("major")
FROM "class"
WHERE "major" IS NOT NULL AND btrim("major") <> '';

UPDATE "class" c
SET "programKeahlianId" = p."id"
FROM "program_keahlian" p
WHERE btrim(c."major") = p."name";

-- Default konsentrasi: nama program. Hubin dapat mengubahnya lewat UI.
INSERT INTO "konsentrasi_keahlian" ("name", "programKeahlianId")
SELECT p."name", p."id"
FROM "program_keahlian" p
ON CONFLICT ("programKeahlianId", "name") DO NOTHING;

UPDATE "class" c
SET "konsentrasiKeahlianId" = k."id"
FROM "konsentrasi_keahlian" k
WHERE c."programKeahlianId" = k."programKeahlianId"
  AND k."name" = (
      SELECT p."name"
      FROM "program_keahlian" p
      WHERE p."id" = c."programKeahlianId"
  );

ALTER TABLE "class" DROP COLUMN "major";

CREATE INDEX "class_programKeahlianId_idx" ON "class"("programKeahlianId");
CREATE INDEX "class_konsentrasiKeahlianId_idx" ON "class"("konsentrasiKeahlianId");

ALTER TABLE "class"
    ADD CONSTRAINT "class_programKeahlianId_fkey"
    FOREIGN KEY ("programKeahlianId") REFERENCES "program_keahlian"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "class"
    ADD CONSTRAINT "class_konsentrasiKeahlianId_fkey"
    FOREIGN KEY ("konsentrasiKeahlianId") REFERENCES "konsentrasi_keahlian"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- =========================================================
-- 2. TEMPLATE CAPAIAN PEMBELAJARAN PER PROGRAM KEAHLIAN
-- =========================================================

CREATE TABLE "learning_achievement_template" (
    "id" SERIAL NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "programKeahlianId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_achievement_template_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "learning_achievement_template_orderIndex_check" CHECK ("orderIndex" > 0)
);

CREATE UNIQUE INDEX "learning_achievement_template_programKeahlianId_orderIndex_key"
    ON "learning_achievement_template"("programKeahlianId", "orderIndex");
CREATE INDEX "learning_achievement_template_programKeahlianId_idx"
    ON "learning_achievement_template"("programKeahlianId");

ALTER TABLE "learning_achievement_template"
    ADD CONSTRAINT "learning_achievement_template_programKeahlianId_fkey"
    FOREIGN KEY ("programKeahlianId") REFERENCES "program_keahlian"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "learning_achievement_template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_achievement_template" FORCE ROW LEVEL SECURITY;

CREATE POLICY "learning_achievement_template_select" ON "learning_achievement_template"
    FOR SELECT
    USING (
        public.learning_actor_role() IN ('student', 'teacher', 'mentor', 'hubin')
    );

CREATE POLICY "learning_achievement_template_insert" ON "learning_achievement_template"
    FOR INSERT
    WITH CHECK (public.learning_actor_role() = 'hubin');

CREATE POLICY "learning_achievement_template_update" ON "learning_achievement_template"
    FOR UPDATE
    USING (public.learning_actor_role() = 'hubin')
    WITH CHECK (public.learning_actor_role() = 'hubin');

CREATE POLICY "learning_achievement_template_delete" ON "learning_achievement_template"
    FOR DELETE
    USING (public.learning_actor_role() = 'hubin');

-- =========================================================
-- 3. IZINKAN PENYALINAN TEMPLATE KE CAPAIAN SISWA
-- =========================================================

CREATE OR REPLACE FUNCTION public.learning_can_seed_template(
    p_student_id integer,
    p_order_index integer,
    p_title text
) RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT COALESCE(
        EXISTS (
            SELECT 1
            FROM "user" s
            JOIN "class" c ON c."id" = s."classId"
            JOIN "learning_achievement_template" t
              ON t."programKeahlianId" = c."programKeahlianId"
             AND t."orderIndex" = p_order_index
             AND t."title" = p_title
            WHERE s."id" = p_student_id
              AND s."role" = 'student'
        ),
        false
    )
$$;

DROP POLICY IF EXISTS "learning_achievement_insert" ON "learning_achievement";

CREATE POLICY "learning_achievement_insert" ON "learning_achievement"
    FOR INSERT
    WITH CHECK (
        public.learning_can_manage_student("studentId")
        OR (
            public.learning_can_view_student("studentId")
            AND "evidence" IS NULL
            AND "weeks" = ARRAY[]::INTEGER[]
            AND "mentorSignedAt" IS NULL
            AND "teacherSignedAt" IS NULL
            AND public.learning_can_seed_template("studentId", "orderIndex", "title")
        )
    );

-- Trigger lama hanya mengizinkan mentor. Tambahkan pengecualian untuk
-- penyalinan baris template yang masih kosong.
CREATE OR REPLACE FUNCTION public.learning_achievement_guard() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    actor_role text := public.learning_actor_role();
BEGIN
    IF actor_role IS NULL THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF public.learning_can_manage_student(NEW."studentId") THEN
            RETURN NEW;
        END IF;

        IF NEW."evidence" IS NULL
           AND NEW."weeks" = ARRAY[]::INTEGER[]
           AND NEW."mentorSignedAt" IS NULL
           AND NEW."teacherSignedAt" IS NULL
           AND public.learning_can_seed_template(
               NEW."studentId",
               NEW."orderIndex",
               NEW."title"
           ) THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'Hanya mentor pembimbing yang dapat menambah capaian pembelajaran.';
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF NOT public.learning_can_manage_student(OLD."studentId") THEN
            RAISE EXCEPTION 'Hanya mentor pembimbing yang dapat menghapus capaian pembelajaran.';
        END IF;
        RETURN OLD;
    END IF;

    IF actor_role = 'teacher' THEN
        IF NOT public.learning_can_sign_as_teacher(OLD."studentId") THEN
            RAISE EXCEPTION 'Siswa berada di luar cakupan bimbingan Anda.';
        END IF;
        IF NEW."studentId" IS DISTINCT FROM OLD."studentId"
           OR NEW."orderIndex" IS DISTINCT FROM OLD."orderIndex"
           OR NEW."title" IS DISTINCT FROM OLD."title"
           OR NEW."evidence" IS DISTINCT FROM OLD."evidence"
           OR NEW."weeks" IS DISTINCT FROM OLD."weeks"
           OR NEW."mentorSignedAt" IS DISTINCT FROM OLD."mentorSignedAt"
           OR NEW."mentorSignedById" IS DISTINCT FROM OLD."mentorSignedById" THEN
            RAISE EXCEPTION 'Guru hanya boleh mengubah paraf guru/sekolah.';
        END IF;
    ELSIF actor_role = 'mentor' THEN
        IF NOT public.learning_can_manage_student(OLD."studentId") THEN
            RAISE EXCEPTION 'Siswa berada di luar cakupan bimbingan Anda.';
        END IF;
        IF NEW."studentId" IS DISTINCT FROM OLD."studentId"
           OR NEW."orderIndex" IS DISTINCT FROM OLD."orderIndex"
           OR NEW."teacherSignedAt" IS DISTINCT FROM OLD."teacherSignedAt"
           OR NEW."teacherSignedById" IS DISTINCT FROM OLD."teacherSignedById" THEN
            RAISE EXCEPTION 'Mentor tidak boleh mengubah paraf guru/sekolah.';
        END IF;
    ELSE
        RAISE EXCEPTION 'Capaian pembelajaran hanya dapat diubah oleh mentor atau guru.';
    END IF;

    RETURN NEW;
END;
$$;
