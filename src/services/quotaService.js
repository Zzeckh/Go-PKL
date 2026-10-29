/**
 * Kuota PKL tunggal per tempat. Kolom quotaSchool/quotaCompany masih
 * dipertahankan hanya untuk kompatibilitas dengan database dan kode lama.
 */
export const SOURCES = ['sekolah', 'perusahaan'];
export const SOURCE_LABEL = { sekolah: 'Sekolah', perusahaan: 'Perusahaan' };
export const isInternalCategory = (category) =>
  String(category ?? '').toLowerCase().includes('internal');
export const normalizeSource = (value) => {
  const v = String(value ?? '').trim().toLowerCase();
  if (!v) return null;
  if (v.includes('perusahaan')) return 'perusahaan';
  if (v.includes('sekolah')) return 'sekolah';
  return null;
};
const readNumber = (v) => v === undefined || v === null || v === '' ? undefined : Number(v);

/**
 * Input utama: quota (maksimal praktikan). Payload lama quotaSchool +
 * quotaCompany tetap diterima dengan cara dijumlahkan.
 */
export const resolveQuotas = (body = {}, existing) => {
  const single = readNumber(body.quota);
  const qs = readNumber(body.quotaSchool);
  const qc = readNumber(body.quotaCompany);
  if (single === undefined && qs === undefined && qc === undefined) return null;
  let quota;
  if (single !== undefined) quota = single;
  else if (qs !== undefined || qc !== undefined) quota = (qs ?? Number(existing?.quotaSchool ?? 0)) + (qc ?? Number(existing?.quotaCompany ?? 0));
  else quota = Number(existing?.quota ?? 0);
  if (!Number.isInteger(quota) || quota < 0) {
    return { error: 'Kuota maksimal praktikan harus berupa bilangan bulat 0 atau lebih' };
  }
  return { quota, quotaSchool: quota, quotaCompany: 0 };
};

/** Jumlah siswa per jalur lama; total kapasitas harus memakai sekolah + perusahaan. */
export const getFilledBySource = async (db, companyId, excludeUserId) => {
  const rows = await db.user.groupBy({
    by: ['placementSource'],
    where: { companyId, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
    _count: { _all: true },
  });
  const filled = { sekolah: 0, perusahaan: 0 };
  for (const row of rows) {
    if (row.placementSource === 'perusahaan') filled.perusahaan += row._count._all;
    else filled.sekolah += row._count._all;
  }
  return filled;
};
export const getFilledTotal = async (db, companyId, excludeUserId) => {
  return db.user.count({
    where: { companyId, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
  });
};
