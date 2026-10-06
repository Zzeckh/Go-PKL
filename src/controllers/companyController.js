import prisma from '../config/db.js';
import XLSX from 'xlsx';

/**
 * Helper
 */
const normalize = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const normalizeNis = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\.0$/, '');

/**
 * GET /api/companies
 * Semua role login bisa melihat perusahaan
 */
export const getCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    res.json({
      data: companies.map(({ _count, mentor, ...rest }) => ({
        ...rest,
        filled: _count.students,
        mentor,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/companies
 * Membuat perusahaan secara manual
 */
export const createCompany = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      country,
      category,
      quota,
      latitude,
      longitude,
      radiusMeters,
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        error: 'Nama dan alamat perusahaan wajib diisi',
      });
    }

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        error:
          'Koordinat geofence (latitude/longitude) wajib diisi',
      });
    }


    const company = await prisma.company.create({
      data: {
        name: String(name).trim(),
        address: String(address).trim(),
        city: city ? String(city).trim() : null,
        country: country ? String(country).trim() : null,
        category: category ? String(category).trim() : null,
        quota: Number(quota) || 0,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters) || 500,
        // mentorId sengaja tidak diisi dari Hubin; penetapan dilakukan Guru Pembimbing.
      },
    });

    res.status(201).json(company);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Nama perusahaan sudah terdaftar',
      });
    }

    next(error);
  }
};

/**
 * GET /api/companies/template
 *
 * Download template Excel kosong untuk import mapping.
 *
 * Format:
 * NIS
 * Nama Siswa
 * Nama Perusahaan
 * Alamat
 * Kota
 * Negara
 * Latitude
 * Longitude
 * Radius
 * Kuota
 */
export const downloadCompanyTemplate = async (req, res, next) => {
  try {
    const templateData = [
      {
        NIS: '',
        'Nama Siswa': '',
        'Nama Perusahaan': '',
        Alamat: '',
        Kota: '',
        Negara: '',
        Latitude: '',
        Longitude: '',
        Radius: '',
        Kuota: '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 30 },
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Template Import'
    );

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="template-import-pkl.xlsx"'
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/companies/import
 *
 * Import Excel mapping:
 *
 * NIS
 * Nama Siswa
 * Nama Perusahaan
 * Alamat
 * Kota
 * Negara
 * Latitude
 * Longitude
 * Radius
 * Kuota
 * Guru Pembimbing
 *
 * Konsep:
 * 1 perusahaan
 *    -> banyak siswa
 *    -> guru pembimbing dapat digunakan untuk siswa
 *
 * Mentor TIDAK diambil dari Excel.
 * Mentor perusahaan tetap mengikuti data perusahaan
 * yang sudah tersimpan di database.
 */
export const importCompanies = async (req, res, next) => {
  try {
    /**
     * ============================================================
     * 1. CEK FILE
     * ============================================================
     */

    if (!req.file) {
      return res.status(400).json({
        error: 'File Excel wajib diupload',
      });
    }

    /**
     * ============================================================
     * 2. BACA EXCEL
     * ============================================================
     */

    const workbook = XLSX.read(req.file.buffer, {
      type: 'buffer',
    });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({
        error: 'File Excel tidak memiliki sheet',
      });
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
    });

    if (!rows.length) {
      return res.status(400).json({
        error: 'File Excel tidak memiliki data',
      });
    }

    /**
     * ============================================================
     * 3. AMBIL SEMUA SISWA
     * ============================================================
     *
     * NIS pada project sekarang berasal dari bagian sebelum "@"
     * pada email user.
     */

    const students = await prisma.user.findMany({
      where: {
        role: 'student',
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
        teacherId: true,
      },
    });

    const studentByNis = new Map();
    const studentByName = new Map();

    for (const student of students) {
      const nis = normalizeNis(
        String(student.email || '').split('@')[0]
      );

      if (nis) {
        studentByNis.set(nis, student);
      }

      studentByName.set(
        normalize(student.name),
        student
      );
    }

    /**
     * ============================================================
     * 4. AMBIL SEMUA GURU
     * ============================================================
     */

    const teachers = await prisma.user.findMany({
      where: {
        role: 'teacher',
      },
      select: {
        id: true,
        name: true,
      },
    });

    const teacherByName = new Map();

    for (const teacher of teachers) {
      teacherByName.set(
        normalize(teacher.name),
        teacher
      );
    }

    /**
     * ============================================================
     * 5. HASIL IMPORT
     * ============================================================
     */

    const success = [];
    const errors = [];

    /**
     * Siswa yang sudah diproses di Excel.
     *
     * Tujuannya supaya satu siswa tidak muncul dua kali.
     */
    const processedStudentIds = new Set();

    /**
     * Cache perusahaan supaya perusahaan yang sama
     * tidak dicari berulang kali.
     */
    const companyCache = new Map();

    /**
     * Menyimpan jumlah siswa per perusahaan selama import.
     */
    const companyFilled = new Map();

    /**
     * Menyimpan guru yang sudah dipasang
     * pada perusahaan tertentu.
     */
    const companyAssignment = new Map();

    /**
     * ============================================================
     * 6. HELPER CARI PERUSAHAAN
     * ============================================================
     */

    const getCompany = async (companyName) => {
      const key = normalize(companyName);

      if (companyCache.has(key)) {
        return companyCache.get(key);
      }

      const company = await prisma.company.findUnique({
        where: {
          name: companyName,
        },
      });

      companyCache.set(key, company || null);

      if (
        company &&
        !companyFilled.has(company.id)
      ) {
        const filled = await prisma.user.count({
          where: {
            companyId: company.id,
          },
        });

        companyFilled.set(
          company.id,
          filled
        );
      }

      return company || null;
    };

    /**
     * ============================================================
     * 7. PROSES SATU PER SATU BARIS EXCEL
     * ============================================================
     */

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      /**
       * Excel:
       * Baris pertama = header
       * Maka data pertama = baris 2
       */
      const rowNumber = i + 2;

      /**
       * ----------------------------------------------------------
       * Ambil data siswa
       * ----------------------------------------------------------
       */

      const nis = normalizeNis(
        row['NIS'] ??
          row['nis'] ??
          ''
      );

      const studentName = String(
        row['Nama Siswa'] ??
          row['nama siswa'] ??
          ''
      ).trim();

      /**
       * ----------------------------------------------------------
       * Ambil data perusahaan
       * ----------------------------------------------------------
       */

      const companyName = String(
        row['Nama Perusahaan'] ??
          row['nama perusahaan'] ??
          ''
      ).trim();

      const address = String(
        row['Alamat'] ??
          row['alamat'] ??
          ''
      ).trim();

      const city = String(
        row['Kota'] ??
          row['kota'] ??
          ''
      ).trim();

      const country = String(
        row['Negara'] ??
          row['negara'] ??
          ''
      ).trim();

      /**
       * ----------------------------------------------------------
       * Koordinat
       * ----------------------------------------------------------
       */

      const latitude = Number(
        row['Latitude'] ??
          row['latitude']
      );

      const longitude = Number(
        row['Longitude'] ??
          row['longitude']
      );

      /**
       * ----------------------------------------------------------
       * Radius
       * ----------------------------------------------------------
       */

      const radiusValue =
        row['Radius'] ??
        row['RadiusMeters'] ??
        row['radius'] ??
        row['radiusMeters'];

      const radiusMeters =
        radiusValue === '' ||
        radiusValue == null
          ? 500
          : Number(radiusValue);

      /**
       * ----------------------------------------------------------
       * Kuota
       * ----------------------------------------------------------
       */

      const quotaValue =
        row['Kuota'] ??
        row['kuota'] ??
        row['Quota'] ??
        row['quota'];

      const quota =
        quotaValue === '' ||
        quotaValue == null
          ? 6
          : Number(quotaValue);

      /**
       * ----------------------------------------------------------
       * Guru Pembimbing
       * ----------------------------------------------------------
       */

      const teacherName = String(
        row['Guru Pembimbing'] ??
          row['guru pembimbing'] ??
          row['Nama Guru'] ??
          row['nama guru'] ??
          ''
      ).trim();

      /**
       * ==========================================================
       * 8. VALIDASI WAJIB
       * ==========================================================
       */

      if (!nis && !studentName) {
        errors.push({
          row: rowNumber,
          error:
            'NIS atau Nama Siswa wajib diisi',
        });

        continue;
      }

      if (!companyName) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Nama Perusahaan wajib diisi',
        });

        continue;
      }

      if (!address) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Alamat wajib diisi',
        });

        continue;
      }

      if (!city) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Kota wajib diisi',
        });

        continue;
      }

      if (!country) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Negara wajib diisi',
        });

        continue;
      }

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Latitude tidak valid',
        });

        continue;
      }

      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Longitude tidak valid',
        });

        continue;
      }

      if (
        !Number.isFinite(radiusMeters) ||
        radiusMeters <= 0
      ) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Radius harus lebih dari 0',
        });

        continue;
      }

      if (
        !Number.isFinite(quota) ||
        quota <= 0 ||
        !Number.isInteger(quota)
      ) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Kuota harus berupa bilangan bulat lebih dari 0',
        });

        continue;
      }

      if (!teacherName) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Guru Pembimbing wajib diisi',
        });

        continue;
      }

      /**
       * ==========================================================
       * 9. CARI SISWA
       * ==========================================================
       *
       * Prioritas:
       * 1. NIS
       * 2. Nama
       */

      const student =
        (nis && studentByNis.get(nis)) ||
        studentByName.get(
          normalize(studentName)
        );

      if (!student) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            `Siswa tidak ditemukan${
              nis
                ? ` untuk NIS ${nis}`
                : ''
            }`,
        });

        continue;
      }

      /**
       * Cegah siswa yang sama diproses dua kali.
       */

      if (
        processedStudentIds.has(student.id)
      ) {
        errors.push({
          row: rowNumber,
          name: student.name,
          error:
            'Siswa yang sama muncul lebih dari satu kali di Excel',
        });

        continue;
      }

      /**
       * ==========================================================
       * 10. CARI GURU
       * ==========================================================
       */

      const teacher =
        teacherByName.get(
          normalize(teacherName)
        );

      if (!teacher) {
        errors.push({
          row: rowNumber,
          name: student.name,
          error:
            `Guru Pembimbing "${teacherName}" tidak ditemukan`,
        });

        continue;
      }

      /**
       * ==========================================================
       * 11. CARI / BUAT PERUSAHAAN
       * ==========================================================
       */

      try {
        let company =
          await getCompany(companyName);

        /**
         * --------------------------------------------------------
         * Kalau perusahaan belum ada → buat baru
         * --------------------------------------------------------
         *
         * Mentor sengaja tidak diisi dari Excel.
         * Perusahaan baru akan memiliki mentor null.
         */

        if (!company) {
          company =
            await prisma.company.create({
              data: {
                name: companyName,
                address,
                city,
                country,
                quota,
                latitude,
                longitude,
                radiusMeters,
                mentorId: null,
              },
            });

          companyCache.set(
            normalize(companyName),
            company
          );

          companyFilled.set(
            company.id,
            0
          );
        } else {
          /**
           * ------------------------------------------------------
           * Kalau perusahaan sudah ada:
           * UPDATE datanya, bukan buat duplikat.
           * ------------------------------------------------------
           */

          const filled =
            companyFilled.get(
              company.id
            ) ?? 0;

          if (quota < filled) {
            errors.push({
              row: rowNumber,
              name: student.name,
              error:
                `Kuota ${quota} lebih kecil dari jumlah siswa yang sudah terpetakan (${filled})`,
            });

            continue;
          }

          /**
           * Cek apakah perusahaan ini sebelumnya
           * sudah diberi Guru Pembimbing berbeda.
           */

          const existingAssignment =
            companyAssignment.get(
              company.id
            );

          if (
            existingAssignment &&
            existingAssignment.teacherId !==
              teacher.id
          ) {
            errors.push({
              row: rowNumber,
              name: student.name,
              error:
                `Perusahaan "${companyName}" sudah memiliki Guru Pembimbing berbeda di baris Excel sebelumnya`,
            });

            continue;
          }

          /**
           * Update perusahaan.
           *
           * Mentor tidak disentuh.
           * Mentor yang sudah ada tetap aman.
           */

          company =
            await prisma.company.update({
              where: {
                id: company.id,
              },
              data: {
                address,
                city,
                country,
                quota,
                latitude,
                longitude,
                radiusMeters,
              },
            });

          companyCache.set(
            normalize(companyName),
            company
          );
        }

        /**
         * ========================================================
         * 12. SIMPAN ASSIGNMENT PERUSAHAAN
         * ========================================================
         *
         * Satu perusahaan:
         * - banyak siswa
         * - satu Guru Pembimbing
         *
         * Mentor tidak berasal dari Excel.
         */

        companyAssignment.set(
          company.id,
          {
            teacherId: teacher.id,
          }
        );

        /**
         * ========================================================
         * 13. CEK KUOTA
         * ========================================================
         */

        const oldCompanyId =
          student.companyId;

        /**
         * Kalau siswa memang belum berada
         * di perusahaan tersebut.
         */

        if (
          oldCompanyId !== company.id
        ) {
          const filled =
            companyFilled.get(
              company.id
            ) ?? 0;

          if (filled >= quota) {
            errors.push({
              row: rowNumber,
              name: student.name,
              error:
                `Kuota perusahaan "${companyName}" sudah penuh (${filled}/${quota})`,
            });

            continue;
          }

          /**
           * ======================================================
           * 14. UPDATE SISWA
           * ======================================================
           *
           * companyId = perusahaan
           * teacherId = guru pembimbing perusahaan
           */

          await prisma.user.update({
            where: {
              id: student.id,
            },
            data: {
              companyId: company.id,
              teacherId: teacher.id,
            },
          });

          /**
           * Update jumlah siswa perusahaan baru.
           */

          companyFilled.set(
            company.id,
            filled + 1
          );

          /**
           * Kalau sebelumnya punya perusahaan lain,
           * kurangi jumlah perusahaan lama.
           */

          if (oldCompanyId) {
            const oldFilled =
              companyFilled.get(
                oldCompanyId
              );

            if (
              oldFilled != null
            ) {
              companyFilled.set(
                oldCompanyId,
                Math.max(
                  0,
                  oldFilled - 1
                )
              );
            }
          }
        } else {
          /**
           * ======================================================
           * Kalau siswa sudah berada di perusahaan yang sama,
           * tetap pastikan Guru Pembimbing diperbarui.
           * ======================================================
           */

          await prisma.user.update({
            where: {
              id: student.id,
            },
            data: {
              teacherId: teacher.id,
            },
          });
        }

        /**
         * ========================================================
         * 15. BERHASIL
         * ========================================================
         */

        processedStudentIds.add(
          student.id
        );

        success.push({
          row: rowNumber,
          studentId: student.id,
          studentName: student.name,
          companyId: company.id,
          companyName: company.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
        });
      } catch (error) {
        errors.push({
          row: rowNumber,
          name:
            studentName ||
            companyName,
          error:
            error?.code === 'P2002'
              ? 'Data bentrok dengan data unik yang sudah terdaftar'
              : (
                  error?.message ||
                  'Gagal memproses baris'
                ),
        });
      }
    }

    /**
     * ============================================================
     * 16. RESPONSE
     * ============================================================
     */

    return res.status(200).json({
      message:
        'Import mapping siswa, perusahaan, dan guru selesai',
      total: rows.length,
      successCount:
        success.length,
      errorCount:
        errors.length,
      success,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/companies/:id
 * Edit perusahaan
 */
export const updateCompany = async (
  req,
  res,
  next
) => {
  try {
    const id = Number(
      req.params.id
    );

    const {
      name,
      address,
      city,
      country,
      category,
      quota,
      latitude,
      longitude,
      radiusMeters,
      isActive,
    } = req.body;

    const existing =
      await prisma.company.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        error:
          'Perusahaan tidak ditemukan',
      });
    }


    const company =
      await prisma.company.update({
        where: {
          id,
        },
        data: {
          name:
            name !== undefined
              ? String(name).trim()
              : undefined,

          address:
            address !== undefined
              ? String(address).trim()
              : undefined,

          city:
            city !== undefined
              ? city
              : undefined,

          country:
            country !== undefined
              ? country
              : undefined,

          category:
            category !== undefined
              ? category
              : undefined,

          quota:
            quota !== undefined
              ? Number(quota)
              : undefined,

          latitude:
            latitude !== undefined
              ? Number(latitude)
              : undefined,

          longitude:
            longitude !== undefined
              ? Number(longitude)
              : undefined,

          radiusMeters:
            radiusMeters !== undefined
              ? Number(radiusMeters)
              : undefined,

          isActive:
            isActive !== undefined
              ? Boolean(isActive)
              : undefined,
        },
      });

    res.json(company);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error:
          'Nama perusahaan sudah terdaftar',
      });
    }

    next(error);
  }
};

/**
 * DELETE /api/companies/:id
 * Soft delete
 */
export const deactivateCompany = async (
  req,
  res,
  next
) => {
  try {
    const company =
      await prisma.company.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          isActive: false,
        },
      });

    res.json(company);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/companies/:id/hard
 * Hard delete
 */
export const deleteCompany = async (
  req,
  res,
  next
) => {
  try {
    const id = Number(
      req.params.id
    );

    const existing =
      await prisma.company.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        error:
          'Perusahaan tidak ditemukan',
      });
    }

    const studentsCount =
      await prisma.user.count({
        where: {
          companyId: id,
        },
      });

    if (studentsCount > 0) {
      return res.status(400).json({
        error:
          `Perusahaan masih memiliki ${studentsCount} siswa. Pindahkan siswa terlebih dahulu.`,
      });
    }

    await prisma.company.delete({
      where: {
        id,
      },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};