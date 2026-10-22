/**
 * Helper kuota PKL dua jalur.
 *
 * Jalur penempatan siswa (User.placementSource):
 *  - "sekolah"    : ditempatkan oleh sekolah (Hubin) -> memakai Company.quotaSchool
 *  - "perusahaan" : direkrut/diterima perusahaan     -> memakai Company.quotaCompany
 *
 * Company.quota selalu = quotaSchool + quotaCompany (dijaga oleh server)
 * supaya dashboard & laporan lama yang membaca `quota` tetap benar.
 *
 * Perusahaan sekolah (kategori Internal) tidak dibatasi kuota.
 */

export const SOURCES = ['sekolah', 'perusahaan'];

export const SOURCE_LABEL = {
  sekolah: 'Sekolah',
  perusahaan: 'Perusahaan',
};

export const isInternalCategory = (category) =>
  String(category ?? '')
    .toLowerCase()
    .includes('internal');

/** "Perusahaan" / "perusahaan" -> 'perusahaan'; "Sekolah" -> 'sekolah'; selain itu null */
export const normalizeSource = (value) => {
  const v = String(value ?? '').trim().toLowerCase();
  if (!v) return null;
  if (v.includes('perusahaan')) return 'perusahaan';
  if (v.includes('sekolah')) return 'sekolah';
  return null;
};

const readNumber = (v) =>
  v === undefined || v === null || v === '' ? undefined : Number(v);

/**
 * Menentukan kuota dari body request.
 *  - quotaSchool / quotaCompany  : cara baru
 *  - quota (lama, total)         : tetap diterima demi kompatibilitas
 *
 * Mengembalikan:
 *  - null                                  : tidak ada field kuota di body (jangan diubah)
 *  - { error }                             : nilai tidak valid
 *  - { quotaSchool, quotaCompany, quota }  : nilai final
 */
export const resolveQuotas = (body = {}, existing) => {
  const qs = readNumber(body.quotaSchool);
  const qc = readNumber(body.quotaCompany);
  const legacy = readNumber(body.quota);

  if (qs === undefined && qc === undefined && legacy === undefined) {
    return null;
  }

  let quotaSchool;
  let quotaCompany;

  if (qs !== undefined || qc !== undefined) {
    quotaSchool = qs ?? existing?.quotaSchool ?? 0;
    quotaCompany = qc ?? existing?.quotaCompany ?? 0;
  } else {
    // klien lama: hanya kirim total. Sisanya dialokasikan ke jalur sekolah.
    quotaCompany = existing?.quotaCompany ?? 0;
    quotaSchool = Math.max(0, legacy - quotaCompany);
  }

  if (
    ![quotaSchool, quotaCompany].every(
      (n) => Number.isInteger(n) && n >= 0
    )
  ) {
    return {
      error: 'Kuota Sekolah dan Kuota Perusahaan harus berupa bilangan bulat 0 atau lebih',
    };
  }

  return {
    quotaSchool,
    quotaCompany,
    quota: quotaSchool + quotaCompany,
  };
};

/**
 * Jumlah siswa per jalur pada satu perusahaan.
 * Siswa lama yang belum punya placementSource dihitung sebagai jalur sekolah.
 * excludeUserId: abaikan satu siswa (dipakai saat siswa itu sendiri yang diubah).
 */
export const getFilledBySource = async (db, companyId, excludeUserId) => {
  const rows = await db.user.groupBy({
    by: ['placementSource'],
    where: {
      companyId,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    _count: { _all: true },
  });

  const filled = { sekolah: 0, perusahaan: 0 };

  for (const row of rows) {
    if (row.placementSource === 'perusahaan') {
      filled.perusahaan += row._count._all;
    } else {
      filled.sekolah += row._count._all;
    }
  }

  return filled;
};
