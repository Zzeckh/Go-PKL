import prisma from '../config/db.js';

/**
 * Mengembalikan daftar data yang menghalangi penghapusan permanen user.
 * Null berarti user tidak ditemukan.
 */
export async function getUserDeletionBlockers(userId) {
  const result = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      _count: {
        select: {
          absensis: true,
          logbooks: true,
          permissions: true,
          evalAsStudent: true,
          evalAsEvaluator: true,
          students: true,
          mentoredCompanies: true,
        },
      },
    },
  });

  if (!result) return null;

  const counts = result._count;
  const blockers = [];

  if (counts.absensis) blockers.push(`${counts.absensis} data absensi`);
  if (counts.logbooks) blockers.push(`${counts.logbooks} logbook`);
  if (counts.permissions) blockers.push(`${counts.permissions} perizinan`);
  if (counts.evalAsStudent) {
    blockers.push(`${counts.evalAsStudent} penilaian sebagai siswa`);
  }
  if (counts.evalAsEvaluator) {
    blockers.push(`${counts.evalAsEvaluator} penilaian yang dibuat`);
  }
  if (counts.students) {
    blockers.push(`${counts.students} siswa bimbingan`);
  }
  if (counts.mentoredCompanies) {
    blockers.push(`${counts.mentoredCompanies} perusahaan yang dibimbing`);
  }

  return blockers;
}

export function buildDeletionBlockedMessage(blockers, { self = false } = {}) {
  const suffix = self
    ? ' Hubungi Hubin untuk menonaktifkan akun Anda.'
    : ' Nonaktifkan akun atau pindahkan/hapus data terkait terlebih dahulu.';

  return `Akun tidak dapat dihapus permanen karena masih memiliki ${blockers.join(
    ', '
  )}.${suffix}`;
}
