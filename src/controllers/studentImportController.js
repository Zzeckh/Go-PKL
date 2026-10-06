import prisma from '../config/db.js';
import XLSX from 'xlsx';
import {
  OPTIONAL_STUDENT_IMPORT_HEADERS,
  REQUIRED_STUDENT_IMPORT_HEADERS,
  previewStudentImportRows,
  validateStudentImportHeaders,
} from '../services/studentImportPreviewService.js';

const templateHeaders = [
  ...REQUIRED_STUDENT_IMPORT_HEADERS,
  ...OPTIONAL_STUDENT_IMPORT_HEADERS,
];

export const downloadStudentImportTemplate = async (req, res, next) => {
  try {
    const worksheet = XLSX.utils.aoa_to_sheet([templateHeaders]);
    worksheet['!cols'] = [
      { wch: 16, z: '@' },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 32 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Siswa');
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="template-import-siswa.xlsx"'
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

export const previewStudentImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File Excel wajib diunggah.' });
    }

    if (!req.file.originalname.toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({ error: 'Format file harus .xlsx.' });
    }

    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } catch {
      return res.status(400).json({ error: 'File Excel tidak dapat dibaca.' });
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ error: 'File Excel tidak memiliki worksheet.' });
    }

    const worksheet = workbook.Sheets[sheetName];
    const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: true,
      blankrows: true,
    });

    if (sheetRows.length === 0) {
      return res.status(400).json({ error: 'Template tidak memiliki header.' });
    }

    const headerValidation = validateStudentImportHeaders(sheetRows[0]);
    if (!headerValidation.valid) {
      return res.status(400).json({
        error: 'Header template tidak valid.',
        details: headerValidation.errors,
      });
    }

    const importRows = sheetRows
      .slice(1)
      .map((cells, index) => {
        const getCell = (header) => cells[headerValidation.headerMap.get(header)] ?? '';
        const rawNis = getCell('NIS');

        return {
          rowNumber: index + 2,
          nis: rawNis,
          nisIsNumeric: typeof rawNis === 'number',
          name: getCell('Nama Siswa'),
          className: getCell('Kelas'),
          major: getCell('Jurusan'),
          academicYear: getCell('Tahun Ajaran'),
          email: headerValidation.headerMap.has('Email')
            ? getCell('Email')
            : '',
        };
      })
      .filter((row) =>
        [row.nis, row.name, row.className, row.major, row.academicYear, row.email]
          .some((value) => String(value ?? '').trim() !== '')
      );

    if (importRows.length === 0) {
      return res.status(400).json({ error: 'File tidak memiliki baris data siswa.' });
    }

    const [students, emailOwners, classes, academicYears] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'student' },
        select: {
          id: true,
          name: true,
          email: true,
          classId: true,
          academicYearId: true,
        },
      }),
      prisma.user.findMany({
        select: { id: true, email: true },
      }),
      prisma.class.findMany({
        select: {
          id: true,
          name: true,
          major: true,
          academicYearId: true,
          academicYear: { select: { name: true } },
        },
      }),
      prisma.academicYear.findMany({
        select: { id: true, name: true },
      }),
    ]);

    const preview = previewStudentImportRows({
      rows: importRows,
      students,
      emails: emailOwners,
      classes,
      academicYears,
    });

    res.json({
      ...preview,
      saveEnabled: false,
      message: 'Preview saja. Tidak ada data yang disimpan; calon akun baru menunggu kebijakan kredensial.',
    });
  } catch (error) {
    next(error);
  }
};