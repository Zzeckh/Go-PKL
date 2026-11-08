-- Perbaikan trigger sinkronisasi "class"."major":
--   * perubahan "major" oleh kode lama menang dan memindahkan Program Keahlian;
--   * konsentrasi default ikut diisi saat program dibuat dari "major";
--   * konsentrasi yang tidak cocok dengan program dikosongkan.

CREATE OR REPLACE FUNCTION public."class_sync_major"() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    program_name text;
    program_id integer;
    concentration_id integer;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW."programKeahlianId" IS NOT NULL THEN
            SELECT "name" INTO program_name
            FROM "program_keahlian"
            WHERE "id" = NEW."programKeahlianId";

            IF program_name IS NOT NULL THEN
                NEW."major" := program_name;
            END IF;
        ELSIF NEW."major" IS NOT NULL AND btrim(NEW."major") <> '' THEN
            program_name := btrim(NEW."major");

            INSERT INTO "program_keahlian" ("name")
            VALUES (program_name)
            ON CONFLICT ("name") DO UPDATE SET "name" = EXCLUDED."name"
            RETURNING "id" INTO program_id;

            INSERT INTO "konsentrasi_keahlian" ("name", "programKeahlianId")
            VALUES (program_name, program_id)
            ON CONFLICT ("programKeahlianId", "name")
            DO UPDATE SET "name" = EXCLUDED."name"
            RETURNING "id" INTO concentration_id;

            NEW."programKeahlianId" := program_id;
            NEW."major" := program_name;

            IF NEW."konsentrasiKeahlianId" IS NULL THEN
                NEW."konsentrasiKeahlianId" := concentration_id;
            END IF;
        END IF;
    ELSE
        -- Jalur lama yang mengubah "major": pindahkan programnya.
        IF NEW."major" IS DISTINCT FROM OLD."major"
           AND NEW."major" IS NOT NULL
           AND btrim(NEW."major") <> '' THEN
            program_name := btrim(NEW."major");

            INSERT INTO "program_keahlian" ("name")
            VALUES (program_name)
            ON CONFLICT ("name") DO UPDATE SET "name" = EXCLUDED."name"
            RETURNING "id" INTO program_id;

            INSERT INTO "konsentrasi_keahlian" ("name", "programKeahlianId")
            VALUES (program_name, program_id)
            ON CONFLICT ("programKeahlianId", "name")
            DO UPDATE SET "name" = EXCLUDED."name"
            RETURNING "id" INTO concentration_id;

            NEW."programKeahlianId" := program_id;
            NEW."konsentrasiKeahlianId" := concentration_id;
            NEW."major" := program_name;
        ELSIF NEW."programKeahlianId" IS NOT NULL THEN
            SELECT "name" INTO program_name
            FROM "program_keahlian"
            WHERE "id" = NEW."programKeahlianId";

            IF program_name IS NOT NULL THEN
                NEW."major" := program_name;
            ELSE
                NEW."major" := NULL;
            END IF;
        ELSE
            -- Program dikosongkan tanpa menulis "major": bersihkan cerminnya.
            NEW."major" := NULL;
        END IF;
    END IF;

    -- Pastikan konsentrasi selalu berada di bawah program yang dipilih.
    IF NEW."programKeahlianId" IS NULL THEN
        NEW."konsentrasiKeahlianId" := NULL;
    ELSIF NEW."konsentrasiKeahlianId" IS NOT NULL THEN
        PERFORM 1
        FROM "konsentrasi_keahlian"
        WHERE "id" = NEW."konsentrasiKeahlianId"
          AND "programKeahlianId" = NEW."programKeahlianId";

        IF NOT FOUND THEN
            NEW."konsentrasiKeahlianId" := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
