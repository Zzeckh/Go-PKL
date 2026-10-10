import prisma from '../config/db.js';
import XLSX from 'xlsx';

/**
 * ============================================================
 * HELPER
 * ============================================================
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
 * ============================================================
 * GET /api/companies
 * ============================================================
 *
 * quotaCompany = kapasitas maksimal perusahaan
 * filled       = jumlah siswa yang sudah terhubung
 *
 * Sisa kuota:
 * quotaCompany - filled
 * ============================================================
 */

export const getCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: {
        name: 'asc',
      },

      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyId: true,
          },
        },

        students: {
          where: {
            role: 'student',
          },

          select: {
            id: true,
          },
        },
      },
    });

    const data = companies.map(({ students, ...company }) => ({
      ...company,

      // Jumlah siswa yang sedang terpetakan
      filled: students.length,

      // Sisa kapasitas
      remainingQuota: Math.max(
        0,
        company.quotaCompany - students.length
      ),
    }));

    return res.json({
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================================
 * POST /api/companies
 * ============================================================
 *
 * Membuat perusahaan secara manual.
 *
 * quotaCompany = kapasitas maksimal siswa perusahaan
 * ============================================================
 */

export const createCompany = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      country,
      category,
      quotaCompany,
      quota,
      latitude,
      longitude,
      radiusMeters,
      mentorId,
      isActive,
    } = req.body;

    /**
     * ========================================================
     * VALIDASI NAMA & ALAMAT
     * ========================================================
     */

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        error: 'Nama perusahaan wajib diisi',
      });
    }

    if (!address || !String(address).trim()) {
      return res.status(400).json({
        error: 'Alamat perusahaan wajib diisi',
      });
    }

    /**
     * ========================================================
     * VALIDASI KUOTA
     * ========================================================
     */

    const quotaValue =
      quotaCompany !== undefined
        ? Number(quotaCompany)
        : Number(quota);

    if (
      !Number.isInteger(quotaValue) ||
      quotaValue <= 0
    ) {
      return res.status(400).json({
        error:
          'Kuota perusahaan harus berupa bilangan bulat lebih dari 0',
      });
    }

    /**
     * ========================================================
     * VALIDASI KOORDINAT
     * ========================================================
     */

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        error:
          'Koordinat geofence (latitude/longitude) wajib diisi',
      });
    }

    const latitudeNumber = Number(latitude);
    const longitudeNumber = Number(longitude);

    if (
      !Number.isFinite(latitudeNumber) ||
      latitudeNumber < -90 ||
      latitudeNumber > 90
    ) {
      return res.status(400).json({
        error: 'Latitude tidak valid',
      });
    }

    if (
      !Number.isFinite(longitudeNumber) ||
      longitudeNumber < -180 ||
      longitudeNumber > 180
    ) {
      return res.status(400).json({
        error: 'Longitude tidak valid',
      });
    }

    /**
     * ========================================================
     * VALIDASI RADIUS
     * ========================================================
     */

    const radiusNumber =
      radiusMeters == null || radiusMeters === ''
        ? 500
        : Number(radiusMeters);

    if (
      !Number.isFinite(radiusNumber) ||
      radiusNumber <= 0
    ) {
      return res.status(400).json({
        error: 'Radius harus lebih dari 0',
      });
    }

    /**
     * ========================================================
     * VALIDASI MENTOR
     * ========================================================
     */

    let selectedMentor = null;

    if (
      mentorId !== undefined &&
      mentorId !== null &&
      mentorId !== ''
    ) {
      const mentorIdNumber = Number(mentorId);

      if (!Number.isInteger(mentorIdNumber)) {
        return res.status(400).json({
          error: 'mentorId tidak valid',
        });
      }

      selectedMentor = await prisma.user.findUnique({
        where: {
          id: mentorIdNumber,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyId: true,
        },
      });

      if (
        !selectedMentor ||
        selectedMentor.role !== 'mentor'
      ) {
        return res.status(400).json({
          error:
            'mentorId harus user dengan role mentor',
        });
      }

      if (selectedMentor.companyId !== null) {
        return res.status(400).json({
          error:
            'Mentor tersebut sudah terhubung dengan perusahaan lain',
        });
      }
    }

    /**
     * ========================================================
     * BUAT PERUSAHAAN
     * ========================================================
     */

    const company = await prisma.company.create({
      data: {
        name: String(name).trim(),

        address: String(address).trim(),

        city:
          city !== undefined &&
          city !== ''
            ? String(city).trim()
            : null,

        country:
          country !== undefined &&
          country !== ''
            ? String(country).trim()
            : null,

        category:
          category !== undefined &&
          category !== ''
            ? String(category).trim()
            : null,

        quotaCompany: quotaValue,

        latitude: latitudeNumber,

        longitude: longitudeNumber,

        radiusMeters: radiusNumber,

        isActive:
          isActive !== undefined
            ? Boolean(isActive)
            : true,

        mentorId: selectedMentor
          ? selectedMentor.id
          : null,
      },

      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyId: true,
          },
        },
      },
    });

    /**
     * ========================================================
     * HUBUNGKAN COMPANY ID KE MENTOR
     * ========================================================
     */

    if (selectedMentor) {
      await prisma.user.update({
        where: {
          id: selectedMentor.id,
        },

        data: {
          companyId: company.id,
        },
      });
    }

    return res.status(201).json({
      ...company,
      filled: 0,
      remainingQuota: quotaValue,
    });
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
 * ============================================================
 * GET /api/companies/template
 * ============================================================
 *
 * Download template Excel.
 *
 * Tidak ada quotaSchool lagi.
 *
 * Kolom:
 * NIS
 * Nama Siswa
 * Nama Perusahaan
 * Alamat
 * Kota
 * Negara
 * Latitude
 * Longitude
 * Radius
 * Kuota Perusahaan
 * Guru Pembimbing
 * ============================================================
 */

export const downloadCompanyTemplate = async (
  req,
  res,
  next
) => {
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
        'Kuota Perusahaan': '',
        'Guru Pembimbing': '',
      },
    ];

    const worksheet =
      XLSX.utils.json_to_sheet(templateData);

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
      { wch: 20 },
      { wch: 30 },
    ];

    const workbook =
      XLSX.utils.book_new();

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

    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================================
 * POST /api/companies/import
 * ============================================================
 *
 * Import Excel mapping siswa ke perusahaan.
 *
 * SATU BARIS = SATU SISWA.
 *
 * quotaCompany = kapasitas global perusahaan.
 *
 * filled = jumlah siswa yang sudah terhubung.
 *
 * Siswa baru hanya boleh masuk jika:
 *
 * filled < quotaCompany
 *
 * Tidak ada quotaSchool.
 * ============================================================
 */

export const importCompanies = async (
  req,
  res,
  next
) => {
  try {
    /**
     * ========================================================
     * 1. CEK FILE
     * ========================================================
     */

    if (!req.file) {
      return res.status(400).json({
        error: 'File Excel wajib diupload',
      });
    }

    /**
     * ========================================================
     * 2. BACA EXCEL
     * ========================================================
     */

    const workbook = XLSX.read(
      req.file.buffer,
      {
        type: 'buffer',
      }
    );

    const sheetName =
      workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({
        error:
          'File Excel tidak memiliki sheet',
      });
    }

    const worksheet =
      workbook.Sheets[sheetName];

    const rows =
      XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: '',
        }
      );

    if (!rows.length) {
      return res.status(400).json({
        error:
          'File Excel tidak memiliki data',
      });
    }

    /**
     * ========================================================
     * 3. AMBIL SISWA
     * ========================================================
     */

    const students =
      await prisma.user.findMany({
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

    const studentByNis =
      new Map();

    const studentByName =
      new Map();

    for (const student of students) {
      const nis = normalizeNis(
        String(
          student.email || ''
        ).split('@')[0]
      );

      if (nis) {
        studentByNis.set(
          nis,
          student
        );
      }

      studentByName.set(
        normalize(student.name),
        student
      );
    }

    /**
     * ========================================================
     * 4. AMBIL GURU
     * ========================================================
     */

    const teachers =
      await prisma.user.findMany({
        where: {
          role: 'teacher',
        },

        select: {
          id: true,
          name: true,
        },
      });

    const teacherByName =
      new Map();

    for (const teacher of teachers) {
      teacherByName.set(
        normalize(teacher.name),
        teacher
      );
    }

    /**
     * ========================================================
     * 5. CACHE
     * ========================================================
     */

    const success = [];
    const errors = [];

    const processedStudentIds =
      new Set();

    const companyCache =
      new Map();

    /**
     * Jumlah siswa aktual per perusahaan.
     */
    const companyFilled =
      new Map();

    /**
     * Guru pembimbing per perusahaan
     * selama proses Excel.
     */
    const companyAssignment =
      new Map();

    /**
     * ========================================================
     * 6. HELPER CARI PERUSAHAAN
     * ========================================================
     */

    const getCompany =
      async (companyName) => {
        const normalizedName =
          normalize(companyName);

        if (
          companyCache.has(
            normalizedName
          )
        ) {
          return companyCache.get(
            normalizedName
          );
        }

        const company =
          await prisma.company.findFirst({
            where: {
              name: companyName,
            },
          });

        companyCache.set(
          normalizedName,
          company || null
        );

        if (
          company &&
          !companyFilled.has(
            company.id
          )
        ) {
          const filled =
            await prisma.user.count({
              where: {
                companyId:
                  company.id,
                role: 'student',
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
     * ========================================================
     * 7. PROSES EXCEL
     * ========================================================
     */

    for (
      let i = 0;
      i < rows.length;
      i++
    ) {
      const row = rows[i];

      const rowNumber = i + 2;

      /**
       * ======================================================
       * AMBIL DATA
       * ======================================================
       */

      const nis =
        normalizeNis(
          row['NIS'] ??
            row['nis'] ??
            ''
        );

      const studentName =
        String(
          row['Nama Siswa'] ??
            row['nama siswa'] ??
            ''
        ).trim();

      const companyName =
        String(
          row['Nama Perusahaan'] ??
            row['nama perusahaan'] ??
            ''
        ).trim();

      const address =
        String(
          row['Alamat'] ??
            row['alamat'] ??
            ''
        ).trim();

      const city =
        String(
          row['Kota'] ??
            row['kota'] ??
            ''
        ).trim();

      const country =
        String(
          row['Negara'] ??
            row['negara'] ??
            ''
        ).trim();

      const latitude =
        Number(
          row['Latitude'] ??
            row['latitude']
        );

      const longitude =
        Number(
          row['Longitude'] ??
            row['longitude']
        );

      /**
       * ======================================================
       * RADIUS
       * ======================================================
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
       * ======================================================
       * KUOTA PERUSAHAAN
       * ======================================================
       */

      const quotaCompanyValue =
        row['Kuota Perusahaan'] ??
        row['kuota perusahaan'] ??
        row['Quota Perusahaan'] ??
        row['quota perusahaan'] ??
        row['quotaCompany'] ??
        row['QuotaCompany'];

      /**
       * ======================================================
       * GURU
       * ======================================================
       */

      const teacherName =
        String(
          row['Guru Pembimbing'] ??
            row['guru pembimbing'] ??
            row['Nama Guru'] ??
            row['nama guru'] ??
            ''
        ).trim();

      /**
       * ======================================================
       * VALIDASI WAJIB
       * ======================================================
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
          name:
            studentName ||
            undefined,
          error:
            'Nama Perusahaan wajib diisi',
        });

        continue;
      }

      if (!address) {
        errors.push({
          row: rowNumber,
          name:
            studentName ||
            undefined,
          error:
            'Alamat wajib diisi',
        });

        continue;
      }

      if (!city) {
        errors.push({
          row: rowNumber,
          name:
            studentName ||
            undefined,
          error:
            'Kota wajib diisi',
        });

        continue;
      }

      if (!country) {
        errors.push({
          row: rowNumber,
          name:
            studentName ||
            undefined,
          error:
            'Negara wajib diisi',
        });

        continue;
      }

      /**
       * ======================================================
       * VALIDASI KOORDINAT
       * ======================================================
       */

      if (
        !Number.isFinite(
          latitude
        ) ||
        latitude < -90 ||
        latitude > 90
      ) {
        errors.push({
          row: rowNumber,
          name:
            studentName ||
            undefined,
          error:
            'Latitude tidak valid',
        });

        continue;
      }

      if (
        !Number.isFinite(
          longitude
        ) ||
        longitude < -180 ||
        longitude > 180
      ) {
        errors.push({
          row: rowNumber,
          name:
            studentName ||
            undefined,
          error:
            'Longitude tidak valid',
        });

        continue;
      }

      /**
       * ======================================================
       * VALIDASI RADIUS
       * ======================================================
       */

      if (
        !Number.isFinite(
          radiusMeters
        ) ||
        radiusMeters <= 0
      ) {
        errors.push({
          row: rowNumber,
          name:
            studentName ||
            undefined,
          error:
            'Radius harus lebih dari 0',
        });

        continue;
      }

      /**
       * ======================================================
       * VALIDASI GURU
       * ======================================================
       */

      if (!teacherName) {
        errors.push({
          row: rowNumber,
          name:
            studentName ||
            undefined,
          error:
            'Guru Pembimbing wajib diisi',
        });

        continue;
      }

      /**
       * ======================================================
       * CARI SISWA
       * ======================================================
       */

      const student =
        (nis &&
          studentByNis.get(nis)) ||
        studentByName.get(
          normalize(studentName)
        );

      if (!student) {
        errors.push({
          row: rowNumber,
          name:
            studentName ||
            undefined,
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
       * ======================================================
       * DUPLIKAT SISWA
       * ======================================================
       */

      if (
        processedStudentIds.has(
          student.id
        )
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
       * ======================================================
       * CARI GURU
       * ======================================================
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
       * ======================================================
       * CARI / BUAT PERUSAHAAN
       * ======================================================
       */

      try {
        let company =
          await getCompany(
            companyName
          );

        /**
         * ====================================================
         * PERUSAHAAN BARU
         * ====================================================
         */

        if (!company) {
          const newQuotaCompany =
            Number(
              quotaCompanyValue
            );

          if (
            !Number.isInteger(
              newQuotaCompany
            ) ||
            newQuotaCompany <= 0
          ) {
            errors.push({
              row: rowNumber,
              name: student.name,
              error:
                'Kuota Perusahaan wajib berupa bilangan bulat lebih dari 0',
            });

            continue;
          }

          company =
            await prisma.company.create({
              data: {
                name:
                  companyName,

                address,

                city,

                country,

                quotaCompany:
                  newQuotaCompany,

                latitude,

                longitude,

                radiusMeters,

                mentorId:
                  null,
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
           * ==================================================
           * PERUSAHAAN SUDAH ADA
           * ==================================================
           */

          const filled =
            companyFilled.get(
              company.id
            ) ?? 0;

          /**
           * ==================================================
           * GURU HARUS KONSISTEN
           * ==================================================
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
           * ==================================================
           * UPDATE KUOTA JIKA DIISI EXCEL
           * ==================================================
           */

          let newQuotaCompany =
            company.quotaCompany;

          if (
            quotaCompanyValue !== '' &&
            quotaCompanyValue != null
          ) {
            newQuotaCompany =
              Number(
                quotaCompanyValue
              );

            if (
              !Number.isInteger(
                newQuotaCompany
              ) ||
              newQuotaCompany <= 0
            ) {
              errors.push({
                row: rowNumber,
                name: student.name,
                error:
                  'Kuota Perusahaan harus berupa bilangan bulat lebih dari 0',
              });

              continue;
            }
          }

          /**
           * Jangan mengubah kapasitas
           * menjadi lebih kecil dari
           * siswa yang sudah ada.
           */

          if (
            newQuotaCompany <
            filled
          ) {
            errors.push({
              row: rowNumber,
              name: student.name,
              error:
                `Kuota perusahaan ${newQuotaCompany} lebih kecil dari jumlah siswa yang sudah terpetakan (${filled})`,
            });

            continue;
          }

          company =
            await prisma.company.update({
              where: {
                id: company.id,
              },

              data: {
                address,

                city,

                country,

                quotaCompany:
                  newQuotaCompany,

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
         * ====================================================
         * SIMPAN GURU PEMBIMBING
         * ====================================================
         */

        companyAssignment.set(
          company.id,
          {
            teacherId:
              teacher.id,
          }
        );

        /**
         * ====================================================
         * CEK KUOTA GLOBAL PERUSAHAAN
         * ====================================================
         */

        const oldCompanyId =
          student.companyId;

        /**
         * Siswa pindah perusahaan.
         */

        if (
          oldCompanyId !==
          company.id
        ) {
          const filled =
            companyFilled.get(
              company.id
            ) ?? 0;

          /**
           * KUOTA PENUH
           */

          if (
            filled >=
            company.quotaCompany
          ) {
            errors.push({
              row: rowNumber,
              name: student.name,
              error:
                `Kuota perusahaan "${companyName}" sudah penuh (${filled}/${company.quotaCompany})`,
            });

            continue;
          }

          /**
           * ==================================================
           * UPDATE SISWA
           * ==================================================
           */

          await prisma.user.update({
            where: {
              id: student.id,
            },

            data: {
              companyId:
                company.id,

              teacherId:
                teacher.id,
            },
          });

          /**
           * ==================================================
           * TAMBAH FILLED
           * ==================================================
           */

          companyFilled.set(
            company.id,
            filled + 1
          );

          /**
           * ==================================================
           * KURANGI PERUSAHAAN LAMA
           * ==================================================
           */

          if (
            oldCompanyId
          ) {
            /**
             * Kalau company lama belum
             * ada di cache, ambil jumlahnya.
             */

            if (
              !companyFilled.has(
                oldCompanyId
              )
            ) {
              const oldFilled =
                await prisma.user.count({
                  where: {
                    companyId:
                      oldCompanyId,
                    role: 'student',
                  },
                });

              companyFilled.set(
                oldCompanyId,
                oldFilled
              );
            }

            const oldFilled =
              companyFilled.get(
                oldCompanyId
              ) ?? 0;

            companyFilled.set(
              oldCompanyId,
              Math.max(
                0,
                oldFilled - 1
              )
            );
          }
        } else {
          /**
           * ==================================================
           * SISWA SUDAH DI PERUSAHAAN YANG SAMA
           * ==================================================
           */

          await prisma.user.update({
            where: {
              id: student.id,
            },

            data: {
              teacherId:
                teacher.id,
            },
          });
        }

        /**
         * ====================================================
         * BERHASIL
         * ====================================================
         */

        processedStudentIds.add(
          student.id
        );

        const finalFilled =
          companyFilled.get(
            company.id
          ) ?? 0;

        success.push({
          row: rowNumber,

          studentId:
            student.id,

          studentName:
            student.name,

          companyId:
            company.id,

          companyName:
            company.name,

          teacherId:
            teacher.id,

          teacherName:
            teacher.name,

          quotaCompany:
            company.quotaCompany,

          filled:
            finalFilled,

          remainingQuota:
            Math.max(
              0,
              company.quotaCompany -
                finalFilled
            ),
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
              : error?.message ||
                'Gagal memproses baris',
        });
      }
    }

    /**
     * ========================================================
     * RESPONSE
     * ========================================================
     */

    return res.status(200).json({
      message:
        'Import mapping siswa, perusahaan, dan guru selesai',

      total:
        rows.length,

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
 * ============================================================
 * PATCH /api/companies/:id
 * ============================================================
 *
 * Edit perusahaan.
 *
 * quotaCompany = kapasitas maksimal semua sekolah.
 *
 * Tidak ada quotaSchool.
 * ============================================================
 */

export const updateCompany = async (
  req,
  res,
  next
) => {
  try {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id)
    ) {
      return res.status(400).json({
        error:
          'ID perusahaan tidak valid',
      });
    }

    const {
      name,
      address,
      city,
      country,
      category,
      quotaCompany,
      quota,
      latitude,
      longitude,
      radiusMeters,
      mentorId,
      isActive,
    } = req.body;

    /**
     * ========================================================
     * CARI PERUSAHAAN
     * ========================================================
     */

    const existing =
      await prisma.company.findUnique({
        where: {
          id,
        },

        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              companyId: true,
            },
          },

          students: {
            where: {
              role: 'student',
            },

            select: {
              id: true,
            },
          },
        },
      });

    if (!existing) {
      return res.status(404).json({
        error:
          'Perusahaan tidak ditemukan',
      });
    }

    /**
     * ========================================================
     * HITUNG SISWA TERPAKAI
     * ========================================================
     */

    const studentsCount =
      existing.students.length;

    /**
     * ========================================================
     * VALIDASI KUOTA
     * ========================================================
     */

    let newQuotaCompany =
      existing.quotaCompany;

    const incomingQuota =
      quotaCompany !== undefined
        ? quotaCompany
        : quota;

    if (
      incomingQuota !== undefined
    ) {
      newQuotaCompany =
        Number(incomingQuota);

      if (
        !Number.isInteger(
          newQuotaCompany
        ) ||
        newQuotaCompany <= 0
      ) {
        return res.status(400).json({
          error:
            'Kuota perusahaan harus berupa bilangan bulat lebih dari 0',
        });
      }
    }

    /**
     * Kuota tidak boleh lebih kecil
     * dari siswa yang sudah terpetakan.
     */

    if (
      studentsCount >
      newQuotaCompany
    ) {
      return res.status(400).json({
        error:
          `Kuota perusahaan baru (${newQuotaCompany}) tidak boleh lebih kecil dari jumlah siswa yang sudah terpetakan (${studentsCount})`,
      });
    }

    /**
     * ========================================================
     * VALIDASI KOORDINAT
     * ========================================================
     */

    let newLatitude =
      existing.latitude;

    let newLongitude =
      existing.longitude;

    if (
      latitude !== undefined
    ) {
      newLatitude =
        Number(latitude);

      if (
        !Number.isFinite(
          newLatitude
        ) ||
        newLatitude < -90 ||
        newLatitude > 90
      ) {
        return res.status(400).json({
          error:
            'Latitude tidak valid',
        });
      }
    }

    if (
      longitude !== undefined
    ) {
      newLongitude =
        Number(longitude);

      if (
        !Number.isFinite(
          newLongitude
        ) ||
        newLongitude < -180 ||
        newLongitude > 180
      ) {
        return res.status(400).json({
          error:
            'Longitude tidak valid',
        });
      }
    }

    /**
     * ========================================================
     * VALIDASI RADIUS
     * ========================================================
     */

    let newRadius =
      existing.radiusMeters;

    if (
      radiusMeters !== undefined
    ) {
      newRadius =
        Number(radiusMeters);

      if (
        !Number.isFinite(
          newRadius
        ) ||
        newRadius <= 0
      ) {
        return res.status(400).json({
          error:
            'Radius harus lebih dari 0',
        });
      }
    }

    /**
     * ========================================================
     * VALIDASI MENTOR
     * ========================================================
     */

    let newMentorId =
      existing.mentorId;

    if (
      mentorId !== undefined
    ) {
      if (
        mentorId === null ||
        mentorId === ''
      ) {
        newMentorId = null;
      } else {
        const mentorIdNumber =
          Number(mentorId);

        if (
          !Number.isInteger(
            mentorIdNumber
          )
        ) {
          return res.status(400).json({
            error:
              'mentorId tidak valid',
          });
        }

        const mentor =
          await prisma.user.findUnique({
            where: {
              id: mentorIdNumber,
            },

            select: {
              id: true,
              name: true,
              role: true,
              companyId: true,
            },
          });

        if (
          !mentor ||
          mentor.role !== 'mentor'
        ) {
          return res.status(400).json({
            error:
              'Mentor yang dipilih harus user dengan role mentor',
          });
        }

        if (
          mentor.companyId !== null &&
          mentor.companyId !== id
        ) {
          return res.status(400).json({
            error:
              'Mentor tersebut sudah terhubung dengan perusahaan lain',
          });
        }

        newMentorId =
          mentor.id;
      }
    }

    /**
     * ========================================================
     * UPDATE COMPANY
     * ========================================================
     */

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

        quotaCompany:
          newQuotaCompany,

        latitude:
          newLatitude,

        longitude:
          newLongitude,

        radiusMeters:
          newRadius,

        mentorId:
          newMentorId,

        isActive:
          isActive !== undefined
            ? Boolean(isActive)
            : undefined,
      },
    });

    /**
     * ========================================================
     * LEPASKAN MENTOR LAMA
     * ========================================================
     */

    if (
      existing.mentorId &&
      existing.mentorId !==
        newMentorId
    ) {
      await prisma.user.update({
        where: {
          id:
            existing.mentorId,
        },

        data: {
          companyId: null,
        },
      });
    }

    /**
     * ========================================================
     * HUBUNGKAN MENTOR BARU
     * ========================================================
     */

    if (
      newMentorId &&
      newMentorId !==
        existing.mentorId
    ) {
      await prisma.user.update({
        where: {
          id: newMentorId,
        },

        data: {
          companyId: id,
        },
      });
    }

    /**
     * ========================================================
     * AMBIL DATA TERBARU
     * ========================================================
     */

    const result =
      await prisma.company.findUnique({
        where: {
          id,
        },

        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              companyId: true,
            },
          },

          students: {
            where: {
              role: 'student',
            },

            select: {
              id: true,
            },
          },
        },
      });

    const filled =
      result.students.length;

    return res.json({
      id: result.id,
      name: result.name,
      address: result.address,
      city: result.city,
      country: result.country,
      phone: result.phone,
      category: result.category,

      quotaCompany:
        result.quotaCompany,

      filled,

      remainingQuota:
        Math.max(
          0,
          result.quotaCompany -
            filled
        ),

      latitude:
        result.latitude,

      longitude:
        result.longitude,

      radiusMeters:
        result.radiusMeters,

      isActive:
        result.isActive,

      createdAt:
        result.createdAt,

      updatedAt:
        result.updatedAt,

      academicYearId:
        result.academicYearId,

      mentor:
        result.mentor,
    });
  } catch (error) {
    if (
      error?.code === 'P2002'
    ) {
      return res.status(409).json({
        error:
          'Nama perusahaan sudah terdaftar',
      });
    }

    next(error);
  }
};

/**
 * ============================================================
 * DELETE /api/companies/:id
 * Soft delete
 * ============================================================
 */

export const deactivateCompany =
  async (
    req,
    res,
    next
  ) => {
    try {
      const id =
        Number(req.params.id);

      if (
        !Number.isInteger(id)
      ) {
        return res.status(400).json({
          error:
            'ID perusahaan tidak valid',
        });
      }

      const company =
        await prisma.company.update({
          where: {
            id,
          },

          data: {
            isActive: false,
          },
        });

      return res.json(
        company
      );
    } catch (error) {
      next(error);
    }
  };

/**
 * ============================================================
 * DELETE /api/companies/:id/hard
 * Hard delete
 * ============================================================
 */

export const deleteCompany =
  async (
    req,
    res,
    next
  ) => {
    try {
      const id =
        Number(req.params.id);

      if (
        !Number.isInteger(id)
      ) {
        return res.status(400).json({
          error:
            'ID perusahaan tidak valid',
        });
      }

      /**
       * ======================================================
       * CARI COMPANY
       * ======================================================
       */

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

      /**
       * ======================================================
       * CEK SISWA
       * ======================================================
       */

      const studentsCount =
        await prisma.user.count({
          where: {
            companyId: id,
            role: 'student',
          },
        });

      if (
        studentsCount > 0
      ) {
        return res.status(400).json({
          error:
            `Perusahaan masih memiliki ${studentsCount} siswa. Pindahkan siswa terlebih dahulu.`,
        });
      }

      /**
       * ======================================================
       * LEPASKAN MENTOR
       * ======================================================
       */

      if (
        existing.mentorId
      ) {
        await prisma.user.update({
          where: {
            id:
              existing.mentorId,
          },

          data: {
            companyId: null,
          },
        });
      }

      /**
       * ======================================================
       * HAPUS COMPANY
       * ======================================================
       */

      await prisma.company.delete({
        where: {
          id,
        },
      });

      return res.json({
        success: true,
        message:
          'Perusahaan berhasil dihapus',
      });
    } catch (error) {
      next(error);
    }
  };