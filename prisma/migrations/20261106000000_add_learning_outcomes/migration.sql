-- Fitur logbook: Capaian Pembelajaran & Tujuan Pembelajaran.
-- Satu baris capaian/tujuan selalu terikat ke satu siswa (user.role = 'student').

-- ── 1. Tabel capaian pembelajaran ──
CREATE TABLE "learning_achievement" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "evidence" TEXT,
    "weeks" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "mentorSignedAt" TIMESTAMP(3),
    "mentorSignedById" INTEGER,
    "teacherSignedAt" TIMESTAMP(3),
    "teacherSignedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_achievement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "learning_achievement_orderIndex_check" CHECK ("orderIndex" > 0),
    CONSTRAINT "learning_achievement_weeks_check"
        CHECK ("weeks" <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]::INTEGER[])
);

CREATE UNIQUE INDEX "learning_achievement_studentId_orderIndex_key"
    ON "learning_achievement"("studentId", "orderIndex");
CREATE INDEX "learning_achievement_studentId_idx" ON "learning_achievement"("studentId");
CREATE INDEX "learning_achievement_mentorSignedById_idx" ON "learning_achievement"("mentorSignedById");
CREATE INDEX "learning_achievement_teacherSignedById_idx" ON "learning_achievement"("teacherSignedById");

ALTER TABLE "learning_achievement"
    ADD CONSTRAINT "learning_achievement_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learning_achievement"
    ADD CONSTRAINT "learning_achievement_mentorSignedById_fkey"
    FOREIGN KEY ("mentorSignedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "learning_achievement"
    ADD CONSTRAINT "learning_achievement_teacherSignedById_fkey"
    FOREIGN KEY ("teacherSignedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 2. Tabel tujuan pembelajaran ──
CREATE TABLE "learning_goal" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "score" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_goal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "learning_goal_orderIndex_check" CHECK ("orderIndex" > 0),
    -- Nilai hanya boleh kosong atau bilangan bulat 10–100.
    CONSTRAINT "learning_goal_score_check" CHECK ("score" IS NULL OR ("score" >= 10 AND "score" <= 100))
);

CREATE UNIQUE INDEX "learning_goal_studentId_orderIndex_key"
    ON "learning_goal"("studentId", "orderIndex");
CREATE INDEX "learning_goal_studentId_idx" ON "learning_goal"("studentId");

ALTER TABLE "learning_goal"
    ADD CONSTRAINT "learning_goal_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 3. Konteks aktor untuk RLS ──
-- API memasang app.user_id & app.user_role secara transaction-local sebelum
-- query ke tabel ini. Bila variabel tidak dipasang, policy SELECT menolak
-- akses (fail closed) untuk role database non-owner.
CREATE OR REPLACE FUNCTION public.learning_actor_id() RETURNS integer
LANGUAGE sql STABLE
AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::integer $$;

CREATE OR REPLACE FUNCTION public.learning_actor_role() RETURNS text
LANGUAGE sql STABLE
AS $$ SELECT NULLIF(current_setting('app.user_role', true), '') $$;

CREATE OR REPLACE FUNCTION public.learning_can_view_student(p_student_id integer)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT COALESCE(
        EXISTS (
            SELECT 1 FROM "user" s
            WHERE s."id" = p_student_id AND s."role" = 'student'
        )
        AND (
            public.learning_actor_id() = p_student_id
            OR public.learning_actor_role() = 'hubin'
            OR (
                public.learning_actor_role() = 'teacher'
                AND EXISTS (
                    SELECT 1 FROM "user" u
                    WHERE u."id" = p_student_id
                      AND u."teacherId" = public.learning_actor_id()
                )
            )
            OR (
                public.learning_actor_role() = 'mentor'
                AND EXISTS (
                    SELECT 1 FROM "user" u
                    JOIN "company" c ON c."id" = u."companyId"
                    WHERE u."id" = p_student_id
                      AND c."mentorId" = public.learning_actor_id()
                )
            )
        ),
        false
    )
$$;

CREATE OR REPLACE FUNCTION public.learning_can_manage_student(p_student_id integer)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT COALESCE(
        public.learning_actor_role() = 'mentor'
        AND EXISTS (
            SELECT 1 FROM "user" u
            JOIN "company" c ON c."id" = u."companyId"
            WHERE u."id" = p_student_id
              AND c."mentorId" = public.learning_actor_id()
        ),
        false
    )
$$;

CREATE OR REPLACE FUNCTION public.learning_can_sign_as_teacher(p_student_id integer)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT COALESCE(
        public.learning_actor_role() = 'teacher'
        AND EXISTS (
            SELECT 1 FROM "user" u
            WHERE u."id" = p_student_id
              AND u."teacherId" = public.learning_actor_id()
        ),
        false
    )
$$;

-- ── 4. RLS: baca untuk siswa sendiri, guru/mentor pembimbing, dan hubin ──
ALTER TABLE "learning_achievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learning_goal" ENABLE ROW LEVEL SECURITY;
-- FORCE membuat policy juga berlaku untuk pemilik tabel (selama role tidak
-- memiliki BYPASSRLS). API selalu memasang app.user_id/app.user_role lebih dulu.
ALTER TABLE "learning_achievement" FORCE ROW LEVEL SECURITY;
ALTER TABLE "learning_goal" FORCE ROW LEVEL SECURITY;

CREATE POLICY "learning_achievement_select" ON "learning_achievement"
    FOR SELECT
    USING (public.learning_can_view_student("studentId"));

CREATE POLICY "learning_achievement_insert" ON "learning_achievement"
    FOR INSERT
    WITH CHECK (public.learning_can_manage_student("studentId"));

CREATE POLICY "learning_achievement_update" ON "learning_achievement"
    FOR UPDATE
    USING (public.learning_can_manage_student("studentId") OR public.learning_can_sign_as_teacher("studentId"))
    WITH CHECK (public.learning_can_manage_student("studentId") OR public.learning_can_sign_as_teacher("studentId"));

CREATE POLICY "learning_achievement_delete" ON "learning_achievement"
    FOR DELETE
    USING (public.learning_can_manage_student("studentId"));

CREATE POLICY "learning_goal_select" ON "learning_goal"
    FOR SELECT
    USING (public.learning_can_view_student("studentId"));

CREATE POLICY "learning_goal_update" ON "learning_goal"
    FOR UPDATE
    USING (public.learning_can_manage_student("studentId"))
    WITH CHECK (public.learning_can_manage_student("studentId"));

-- Template tujuan boleh dibuat otomatis saat logbook pertama kali dibuka.
CREATE POLICY "learning_goal_insert_template" ON "learning_goal"
    FOR INSERT
    WITH CHECK (
        public.learning_can_view_student("studentId")
        AND "orderIndex" BETWEEN 1 AND 4
        AND "score" IS NULL
        AND "description" IS NULL
        AND "title" = ANY (ARRAY[
            'Menerapkan soft skills yang dibutuhkan dalam dunia kerja (tempat PKL).',
            'Menerapkan kompetensi teknis pada pekerjaan sesuai POS yang berlaku di dunia kerja.',
            'Menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari pada dunia kerja (tempat PKL).',
            'Memahami alur bisnis dunia kerja (tempat PKL).'
        ]::TEXT[])
    );

-- ── 5. Trigger kolom: RLS hanya membatasi baris, bukan kolom. ──
-- Guru hanya boleh mengubah paraf guru; mentor tidak boleh mengubah paraf guru.
CREATE OR REPLACE FUNCTION public.learning_achievement_guard() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    actor_role text := public.learning_actor_role();
BEGIN
    -- Konteks tidak dipasang (mis. maintenance/admin langsung): biarkan RLS
    -- / hak akses database yang menentukan.
    IF actor_role IS NULL THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NOT public.learning_can_manage_student(NEW."studentId") THEN
            RAISE EXCEPTION 'Hanya mentor pembimbing yang dapat menambah capaian pembelajaran.';
        END IF;
        RETURN NEW;
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

CREATE TRIGGER "learning_achievement_guard_trigger"
    BEFORE INSERT OR UPDATE OR DELETE ON "learning_achievement"
    FOR EACH ROW EXECUTE FUNCTION public.learning_achievement_guard();

-- Mentor hanya boleh mengubah nilai/deskripsi; identitas & judul tujuan tetap.
CREATE OR REPLACE FUNCTION public.learning_goal_guard() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    actor_role text := public.learning_actor_role();
BEGIN
    IF actor_role IS NULL THEN RETURN NEW; END IF;

    IF TG_OP = 'INSERT' THEN
        IF NOT public.learning_can_view_student(NEW."studentId")
           OR NEW."orderIndex" NOT BETWEEN 1 AND 4
           OR NEW."score" IS NOT NULL
           OR NEW."description" IS NOT NULL
           OR NEW."title" <> ALL (ARRAY[
                'Menerapkan soft skills yang dibutuhkan dalam dunia kerja (tempat PKL).',
                'Menerapkan kompetensi teknis pada pekerjaan sesuai POS yang berlaku di dunia kerja.',
                'Menerapkan kompetensi teknis yang sudah dipelajari di sekolah dan/atau baru dipelajari pada dunia kerja (tempat PKL).',
                'Memahami alur bisnis dunia kerja (tempat PKL).'
           ]::TEXT[]) THEN
            RAISE EXCEPTION 'Hanya template tujuan pembelajaran yang boleh dibuat otomatis.';
        END IF;
        RETURN NEW;
    END IF;

    IF actor_role <> 'mentor' THEN
        RAISE EXCEPTION 'Nilai tujuan pembelajaran hanya dapat diubah oleh mentor.';
    END IF;

    IF NOT public.learning_can_manage_student(OLD."studentId") THEN
        RAISE EXCEPTION 'Siswa berada di luar cakupan bimbingan Anda.';
    END IF;

    IF NEW."studentId" IS DISTINCT FROM OLD."studentId"
       OR NEW."orderIndex" IS DISTINCT FROM OLD."orderIndex"
       OR NEW."title" IS DISTINCT FROM OLD."title" THEN
        RAISE EXCEPTION 'Identitas tujuan pembelajaran tidak boleh diubah.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "learning_goal_guard_trigger"
    BEFORE INSERT OR UPDATE ON "learning_goal"
    FOR EACH ROW EXECUTE FUNCTION public.learning_goal_guard();
