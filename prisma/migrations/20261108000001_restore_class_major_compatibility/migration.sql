-- =========================================================
-- PEMULIHAN KOMPATIBILITAS "class"."major"
-- =========================================================
-- Deployment lama masih membaca kolom "major". Kolom ini dipertahankan
-- sebagai cermin dari Program Keahlian agar kode lama tetap berjalan
-- selama masa transisi. Sumber kebenaran tetap "programKeahlianId".

ALTER TABLE "class" ADD COLUMN "major" TEXT;

-- Isi kolom kompatibilitas dari data Program Keahlian yang sudah ada.
UPDATE "class" c
SET "major" = p."name"
FROM "program_keahlian" p
WHERE c."programKeahlianId" = p."id";

-- Sinkronisasi dua arah:
--   * programKeahlianId diisi  -> major mengikuti nama program.
--   * hanya major yang diisi   -> program (dan konsentrasi default) dibuat
--                                 otomatis, lalu programKeahlianId diisi.
CREATE OR REPLACE FUNCTION public."class_sync_major"() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    program_name text;
    program_id integer;
    resolve_from_major boolean := false;
BEGIN
    -- Jalur baru: Program Keahlian adalah sumber kebenaran.
    IF NEW."programKeahlianId" IS NOT NULL THEN
        SELECT "name" INTO program_name
        FROM "program_keahlian"
        WHERE "id" = NEW."programKeahlianId";

        IF program_name IS NOT NULL THEN
            NEW."major" := program_name;
            RETURN NEW;
        END IF;
    END IF;

    -- Jalur lama: hanya menulis "major".
    IF TG_OP = 'INSERT' THEN
        resolve_from_major := true;
    ELSE
        resolve_from_major :=
            OLD."programKeahlianId" IS NULL
            OR NEW."major" IS DISTINCT FROM OLD."major";
    END IF;

    IF NEW."major" IS NOT NULL
       AND btrim(NEW."major") <> ''
       AND resolve_from_major THEN
        program_name := btrim(NEW."major");

        INSERT INTO "program_keahlian" ("name")
        VALUES (program_name)
        ON CONFLICT ("name") DO UPDATE SET "name" = EXCLUDED."name"
        RETURNING "id" INTO program_id;

        INSERT INTO "konsentrasi_keahlian" ("name", "programKeahlianId")
        VALUES (program_name, program_id)
        ON CONFLICT ("programKeahlianId", "name") DO NOTHING;

        NEW."programKeahlianId" := program_id;
        NEW."major" := program_name;
        RETURN NEW;
    END IF;

    -- Program dikosongkan dan major tidak diubah: bersihkan cerminnya.
    NEW."major" := NULL;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "class_sync_major_trigger" ON "class";

CREATE TRIGGER "class_sync_major_trigger"
BEFORE INSERT OR UPDATE ON "class"
FOR EACH ROW EXECUTE FUNCTION public."class_sync_major"();
