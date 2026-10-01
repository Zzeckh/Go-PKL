-- Jalankan SELECT ini lebih dulu pada database yang sudah dicadangkan.
-- Query hanya membaca data; tidak mengubah apa pun.
WITH legacy AS (
  SELECT "id", "email", "name" FROM "user" WHERE "role"::text = 'super_admin'
)
SELECT
  l."id", l."email", l."name",
  (SELECT count(*) FROM "absensi" a WHERE a."userId" = l."id") AS absensi_milik_akun,
  (SELECT count(*) FROM "logbook" b WHERE b."userId" = l."id") AS logbook_milik_akun,
  (SELECT count(*) FROM "permission" p WHERE p."userId" = l."id") AS perizinan_milik_akun,
  (SELECT count(*) FROM "evaluation" e WHERE e."studentId" = l."id") AS evaluasi_sebagai_siswa,
  (SELECT count(*) FROM "evaluation" e WHERE e."evaluatorId" = l."id" AND e."studentId" <> l."id") AS evaluasi_siswa_yang_dinilai_oleh_akun,
  (SELECT count(*) FROM "user" u WHERE u."teacherId" = l."id") AS siswa_yang_merujuk_sebagai_guru,
  (SELECT count(*) FROM "company" c WHERE c."mentorId" = l."id") AS perusahaan_yang_merujuk_sebagai_mentor
FROM legacy l
ORDER BY l."id";
