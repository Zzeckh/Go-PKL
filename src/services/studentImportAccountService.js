import { normalizeStudentNis } from './studentImportPreviewService.js';

const INITIAL_STUDENT_PASSWORD = 'gopkl123';

export const createStudentImportAccounts = async ({
  rows,
  prisma,
  hashPassword,
}) => {
  const results = [];

  for (const row of rows) {
    const nis = normalizeStudentNis(row.nis);
    if (row.status === 'existing') {
      results.push({
        rowNumber: row.rowNumber,
        nis,
        status: 'existing',
        reason: 'Akun dengan NIS ini sudah terdaftar dan tidak diubah.',
      });
      continue;
    }

    if (row.status !== 'new-candidate') {
      results.push({
        rowNumber: row.rowNumber,
        nis,
        status: 'failed',
        reason: row.reason || 'Data siswa tidak valid.',
      });
      continue;
    }

    if (nis === null) {
      results.push({
        rowNumber: row.rowNumber,
        nis: '',
        status: 'failed',
        reason: 'NIS harus berupa angka bulat positif maksimal 15 digit.',
      });
      continue;
    }

    try {
      const passwordHash = await hashPassword(INITIAL_STUDENT_PASSWORD);
      const outcome = await prisma.$transaction(async (tx) => {
        const existingByNis = await tx.user.findUnique({
          where: {
            nis: String(nis),
          },
          select: { id: true, role: true },
        });

        if (existingByNis) {
          return existingByNis.role === 'student'
            ? {
                status: 'existing',
                reason: 'Akun dengan NIS ini sudah terdaftar dan tidak diubah.',
              }
            : {
                status: 'failed',
                reason: 'NIS sudah digunakan oleh akun non-siswa.',
              };
        }

        const emailOwner = await tx.user.findUnique({
          where: { email: row.email },
          select: { id: true },
        });
        if (emailOwner) {
          return {
            status: 'failed',
            reason: 'Email sudah digunakan akun lain.',
          };
        }

        const account = await tx.user.create({
          data: {
            name: String(row.name).trim(),
            email: row.email,
            password: passwordHash,
            nis: String(nis),
            role: 'student',
            classId: row.classId,
            academicYear: row.academicYearName,
            academicYearId: row.academicYearId,
          },
          select: { id: true },
        });

        return { status: 'created', userId: account.id };
      });

      results.push({
        rowNumber: row.rowNumber,
        nis,
        status: outcome.status,
        reason:
          outcome.reason ||
          (outcome.status === 'created'
            ? 'Akun siswa berhasil dibuat.'
            : undefined),
      });
    } catch (error) {
      results.push({
        rowNumber: row.rowNumber,
        nis,
        status: 'failed',
        reason:
          error?.code === 'P2002'
            ? 'NIS atau email sudah digunakan akun lain.'
            : 'Gagal menyimpan akun. Silakan coba kembali atau hubungi administrator.',
      });
    }
  }

  const created = results.filter((row) => row.status === 'created').length;
  const existing = results.filter((row) => row.status === 'existing').length;
  const failed = results.filter((row) => row.status === 'failed').length;

  return {
    summary: {
      total: results.length,
      created,
      existing,
      failed,
    },
    rows: results,
  };
};
