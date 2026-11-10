import prisma from '../config/db.js';
import XLSX from 'xlsx';
import {
  SOURCE_LABEL,
  isInternalCategory,
  normalizeSource,
  resolveQuotas,
  getFilledBySource,
} from '../services/quotaService.js';
import { geocodeCompanyAddress } from '../services/companyGeocodingService.js';
import {
  isValidCompanyLocation,
  normalizeCompanyCategory,
} from '../utils/companyImport.js';

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

    // Jumlah siswa per perusahaan per jalur (sekolah / perusahaan)
    const grouped = await prisma.user.groupBy({
      by: ['companyId'],
      where: { companyId: { not: null } },
      _count: { _all: true },
    });

    const filledMap = new Map();

    for (const g of grouped) {
      const cur = filledMap.get(g.companyId) || { sekolah: 0, perusahaan: 0 };
      cur.sekolah += g._count._all;
      filledMap.set(g.companyId, cur);
    }

    res.json({
      data: companies.map(({ _count, mentor, ...rest }) => {
        const f = filledMap.get(rest.id) || { sekolah: 0, perusahaan: 0 };
        return {
          ...rest,
          filled: _count.students,
          filledSchool: f.sekolah,
          filledCompany: f.perusahaan,
          mentor,
        };
      }),
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
      latitude,
      longitude,
      radiusMeters,
    } = req.body;

    const quotas = resolveQuotas(req.body) || {
      quotaSchool: 0,
      quotaCompany: 0,
      quota: 0,
    };

    if (quotas.error) {
      return res.status(400).json({ error: quotas.error });
    }

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
        quota: quotas.quota,
        quotaSchool: quotas.quotaSchool,
        quotaCompany: quotas.quotaCompany,
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
        'Kuota Sekolah': '',
        'Kuota Perusahaan': '',
        Jalur: '',
        'Guru Pembimbing': '',
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
      { wch: 15 },
      { wch: 18 },
      { wch: 14 },
      { wch: 30 },
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

export const downloadCompanyImportTemplate = async (req, res, next) => {
  try {
    const headers = [
      'Nama Perusahaan',
      'Alamat Lengkap',
      'Nomor Telepon',
      'Kategori Perusahaan',
      'Radius Lokasi (meter)',
      'Kota',
      'Negara',
      'Kuota Sekolah',
      'Kuota Perusahaan',
      'Latitude',
      'Longitude',
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet['!cols'] = [
      { wch: 30 },
      { wch: 45 },
      { wch: 20 },
      { wch: 24 },
      { wch: 24 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Perusahaan');
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="template-import-perusahaan.xlsx"'
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

export const geocodeCompanyImportAddress = async (req, res, next) => {
  try {
    const {
      address,
      companyName,
      city,
      province,
      country,
    } = req.body;
    if (
      typeof address !== 'string' ||
      !address.trim() ||
      address.trim().length > 500 ||
      [companyName, city, province, country].some(
        (value) =>
          value !== undefined &&
          (typeof value !== 'string' || value.length > 200)
      )
    ) {
      return res.status(400).json({
        error: 'Alamat wajib diisi (maksimal 500 karakter); konteks lokasi maksimal 200 karakter.',
      });
    }

    const response = await geocodeCompanyAddress({
      address: address.trim(),
      companyName,
      city,
      province,
      country,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
};

const parseImportInteger = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

export const confirmCompanyImport = async (req, res, next) => {
  try {
    const { companies } = req.body;
    if (
      !Array.isArray(companies) ||
      companies.length === 0 ||
      companies.length > 200
    ) {
      return res.status(400).json({
        error: 'Import harus berisi 1 sampai 200 perusahaan.',
      });
    }

    const normalizedRows = companies.map((company, index) => {
      const row = company && typeof company === 'object' ? company : {};
      const name = String(row.name ?? '').trim();
      const address = String(row.address ?? '').trim();
      const categoryInput = String(row.category ?? '').trim();
      const category = normalizeCompanyCategory(categoryInput);
      const radiusMeters = parseImportInteger(row.radiusMeters, 500);
      const isInternal = category === 'Internal';
      const quotaSchool = isInternal
        ? 0
        : parseImportInteger(row.quotaSchool, 5);
      const quotaCompany = isInternal
        ? 0
        : parseImportInteger(row.quotaCompany, 0);
      const latitude = row.latitude;
      const longitude = row.longitude;
      const errors = [];

      if (!name) errors.push('Nama perusahaan wajib diisi.');
      if (!address) errors.push('Alamat lengkap wajib diisi.');
      if (!category) {
        errors.push('Kategori harus Internal atau Eksternal.');
      }
      if (
        !Number.isInteger(radiusMeters) ||
        radiusMeters < 50 ||
        radiusMeters > 2000
      ) {
        errors.push('Radius harus bilangan bulat antara 50 dan 2000 meter.');
      }
      if (
        quotaSchool === null ||
        quotaCompany === null ||
        quotaSchool < 0 ||
        quotaCompany < 0
      ) {
        errors.push('Kuota harus berupa bilangan bulat 0 atau lebih.');
      } else if (!isInternal && quotaSchool + quotaCompany <= 0) {
        errors.push('Total kuota perusahaan Eksternal harus lebih dari 0.');
      }
      if (!isValidCompanyLocation(latitude, longitude)) {
        errors.push('Latitude dan longitude belum valid atau tidak boleh 0,0.');
      }

      return {
        rowNumber: Number.isInteger(row.rowNumber)
          ? row.rowNumber
          : index + 2,
        name,
        address,
        phone: String(row.phone ?? '').trim() || null,
        category,
        city: String(row.city ?? '').trim() || null,
        country: String(row.country ?? '').trim() || null,
        radiusMeters,
        quotaSchool,
        quotaCompany,
        latitude,
        longitude,
        errors,
      };
    });

    const nameCounts = new Map();
    for (const row of normalizedRows) {
      const key = normalize(row.name);
      if (!key) continue;
      nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
    }

    for (const row of normalizedRows) {
      const key = normalize(row.name);
      if (key && nameCounts.get(key) > 1) {
        row.errors.push('Nama perusahaan duplikat di dalam file.');
      }
    }

    const names = normalizedRows
      .filter((row) => row.name)
      .map((row) => row.name);
    const existingCompanies = names.length
      ? await prisma.company.findMany({
          where: {
            name: {
              in: names,
              mode: 'insensitive',
            },
          },
          select: { name: true },
        })
      : [];
    const existingNames = new Set(
      existingCompanies.map((company) => normalize(company.name))
    );

    for (const row of normalizedRows) {
      if (existingNames.has(normalize(row.name))) {
        row.errors.push('Nama perusahaan sudah terdaftar.');
      }
    }

    const created = [];
    const failed = [];
    for (const row of normalizedRows) {
      if (row.errors.length > 0) {
        failed.push({
          row: row.rowNumber,
          name: row.name || undefined,
          error: row.errors.join(' '),
        });
        continue;
      }

      try {
        const company = await prisma.company.create({
          data: {
            name: row.name,
            address: row.address,
            phone: row.phone,
            category: row.category,
            city: row.city,
            country: row.country,
            latitude: row.latitude,
            longitude: row.longitude,
            radiusMeters: row.radiusMeters,
            quotaSchool: row.quotaSchool,
            quotaCompany: row.quotaCompany,
            quota: row.quotaSchool + row.quotaCompany,
          },
          select: {
            id: true,
            name: true,
          },
        });
        created.push({
          row: row.rowNumber,
          id: company.id,
          name: company.name,
        });
      } catch (error) {
        if (error.code === 'P2002') {
          failed.push({
            row: row.rowNumber,
            name: row.name,
            error: 'Nama perusahaan sudah terdaftar.',
          });
          continue;
        }
        console.error('Gagal menyimpan perusahaan saat import.', {
          row: row.rowNumber,
          code: error.code,
          message: error.message,
        });
        failed.push({
          row: row.rowNumber,
          name: row.name,
          error:
            error.code === 'P2003'
              ? 'Relasi data perusahaan tidak valid.'
              : 'Gagal menyimpan karena kesalahan database.',
        });
      }
    }

    res.json({
      created,
      failed,
      summary: {
        total: normalizedRows.length,
        imported: created.length,
        failed: failed.length,
      },
    });
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
     * Menyimpan jumlah siswa per perusahaan per jalur selama import:
     * { sekolah, perusahaan }
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
        const filled = await getFilledBySource(
          prisma,
          company.id
        );

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

      const readQuota = (...keys) => {
        for (const key of keys) {
          const v = row[key];
          if (v !== undefined && v !== null && v !== '') {
            return Number(v);
          }
        }
        return undefined;
      };

      const quotaSchoolRaw = readQuota(
        'Kuota Sekolah',
        'kuota sekolah',
        'KuotaSekolah',
        'quotaSchool'
      );
      const quotaCompanyRaw = readQuota(
        'Kuota Perusahaan',
        'kuota perusahaan',
        'KuotaPerusahaan',
        'quotaCompany'
      );
      // kolom lama "Kuota" = Kuota Sekolah
      const legacyQuotaRaw = readQuota(
        'Kuota',
        'kuota',
        'Quota',
        'quota'
      );

      // Nilai untuk perusahaan BARU (default lama: 6 kuota sekolah)
      const quotaSchool =
        quotaSchoolRaw ??
        legacyQuotaRaw ??
        (quotaCompanyRaw !== undefined ? 0 : 6);
      const quotaCompany = quotaCompanyRaw ?? 0;
      const quota = quotaSchool + quotaCompany;

      /**
       * ----------------------------------------------------------
       * Jalur penempatan
       * ----------------------------------------------------------
       */

      const jalurText = String(
        row['Jalur'] ??
          row['jalur'] ??
          row['Jalur Penempatan'] ??
          ''
      ).trim();

      const placementSource = normalizeSource(jalurText);

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
        ![quotaSchool, quotaCompany].every(
          (n) => Number.isInteger(n) && n >= 0
        ) ||
        quota <= 0
      ) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Kuota Sekolah / Kuota Perusahaan harus bilangan bulat 0 atau lebih dan totalnya lebih dari 0',
        });

        continue;
      }

      if (jalurText && !placementSource) {
        errors.push({
          row: rowNumber,
          name: studentName || undefined,
          error:
            'Jalur harus diisi "Sekolah" atau "Perusahaan"',
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
                quotaSchool,
                quotaCompany,
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
            { sekolah: 0, perusahaan: 0 }
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
            ) ?? { sekolah: 0, perusahaan: 0 };

          // Hanya kuota yang diisi di Excel yang ditimpa;
          // yang kosong tetap memakai nilai di database.
          const effSchool =
            quotaSchoolRaw ??
            legacyQuotaRaw ??
            company.quotaSchool;
          const effCompany =
            quotaCompanyRaw ??
            company.quotaCompany;

          // Perusahaan sekolah (Internal) tidak dibatasi kuota.
          if (!isInternalCategory(company.category)) {
            if (effSchool < filled.sekolah) {
              errors.push({
                row: rowNumber,
                name: student.name,
                error:
                  `Kuota Sekolah ${effSchool} lebih kecil dari siswa jalur sekolah yang sudah terpetakan (${filled.sekolah})`,
              });

              continue;
            }

            if (effCompany < filled.perusahaan) {
              errors.push({
                row: rowNumber,
                name: student.name,
                error:
                  `Kuota Perusahaan ${effCompany} lebih kecil dari siswa jalur perusahaan yang sudah terpetakan (${filled.perusahaan})`,
              });

              continue;
            }
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
                quota: effSchool + effCompany,
                quotaSchool: effSchool,
                quotaCompany: effCompany,
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

        const internalCompany =
          isInternalCategory(company.category);

        const currentSource =
          student.placementSource === 'perusahaan'
            ? 'perusahaan'
            : 'sekolah';

        /**
         * Jalur yang dipakai:
         * - perusahaan sekolah (Internal) -> selalu jalur sekolah
         * - kolom Jalur diisi             -> sesuai Excel
         * - kosong, siswa sudah di sini   -> jalur lama dipertahankan
         * - kosong, siswa baru            -> sekolah
         */
        const targetSource = internalCompany
          ? 'sekolah'
          : placementSource ||
            (oldCompanyId === company.id
              ? currentSource
              : 'sekolah');

        const moved =
          oldCompanyId !== company.id ||
          currentSource !== targetSource;

        if (moved) {
          const filled =
            companyFilled.get(
              company.id
            ) ?? { sekolah: 0, perusahaan: 0 };

          const capacity =
            targetSource === 'perusahaan'
              ? company.quotaCompany
              : company.quotaSchool;

          // Perusahaan sekolah (Internal) tidak dibatasi kuota.
          if (
            !internalCompany &&
            filled[targetSource] >= capacity
          ) {
            errors.push({
              row: rowNumber,
              name: student.name,
              error:
                `Kuota ${SOURCE_LABEL[targetSource]} perusahaan "${companyName}" sudah penuh (${filled[targetSource]}/${capacity})`,
            });

            continue;
          }

          /**
           * ======================================================
           * 14. UPDATE SISWA
           * ======================================================
           *
           * companyId       = perusahaan
           * teacherId       = guru pembimbing perusahaan
           * placementSource = jalur kuota yang dipakai
           */

          await prisma.user.update({
            where: {
              id: student.id,
            },
            data: {
              companyId: company.id,
              teacherId: teacher.id,
              placementSource: targetSource,
            },
          });

          companyFilled.set(company.id, {
            ...filled,
            [targetSource]: filled[targetSource] + 1,
          });

          /**
           * Kurangi hitungan tempat/jalur lama siswa.
           * (Kalau perusahaan sama, ini mengurangi jalur lamanya.)
           */
          if (oldCompanyId) {
            const oldFilled =
              companyFilled.get(
                oldCompanyId
              );

            if (oldFilled) {
              companyFilled.set(oldCompanyId, {
                ...oldFilled,
                [currentSource]: Math.max(
                  0,
                  oldFilled[currentSource] - 1
                ),
              });
            }
          }
        } else {
          /**
           * ======================================================
           * Siswa sudah di perusahaan & jalur yang sama,
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
          placementSource: targetSource,
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


    // Kuota dua jalur. null = tidak ada perubahan kuota.
    const quotas = resolveQuotas(req.body, existing);

    if (quotas?.error) {
      return res.status(400).json({ error: quotas.error });
    }

    if (quotas) {
      const finalCategory =
        category !== undefined ? category : existing.category;

      // Perusahaan sekolah (Internal) tidak dibatasi kuota.
      if (!isInternalCategory(finalCategory)) {
        const filled = await getFilledBySource(prisma, id);

        if (quotas.quotaSchool < filled.sekolah) {
          return res.status(400).json({
            error: `Kuota Sekolah (${quotas.quotaSchool}) lebih kecil dari siswa jalur sekolah yang sudah terpetakan (${filled.sekolah})`,
          });
        }

        if (quotas.quotaCompany < filled.perusahaan) {
          return res.status(400).json({
            error: `Kuota Perusahaan (${quotas.quotaCompany}) lebih kecil dari siswa jalur perusahaan yang sudah terpetakan (${filled.perusahaan})`,
          });
        }
      }
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

          quota: quotas ? quotas.quota : undefined,

          quotaSchool: quotas ? quotas.quotaSchool : undefined,

          quotaCompany: quotas ? quotas.quotaCompany : undefined,

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
