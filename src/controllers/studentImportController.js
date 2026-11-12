import prisma from '../config/db.js';
import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import {
  OPTIONAL_STUDENT_IMPORT_HEADERS,
  REQUIRED_STUDENT_IMPORT_HEADERS,
  STUDENT_IMPORT_TEMPLATE_SAMPLE_NAME,
  normalizeStudentNis,
  previewStudentImportRows,
  readStudentImportNisCell,
  validateStudentImportHeaders,
} from '../services/studentImportPreviewService.js';
import { createStudentImportAccounts } from '../services/studentImportAccountService.js';

const templateHeaders = [
  ...REQUIRED_STUDENT_IMPORT_HEADERS,
  ...OPTIONAL_STUDENT_IMPORT_HEADERS,
];

const getStudentImportMasterData = async () => {
  const [students, emails, classes, academicYears] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        nis: true,
        name: true,
        email: true,
        classId: true,
        academicYearId: true,
      },
    }),
    prisma.user.findMany({
      select: { id: true, email: true, nis: true, role: true },
    }),
    prisma.class.findMany({
      select: {
        id: true,
        name: true,
        major: true,
        programKeahlian: { select: { id: true, name: true } },
        academicYearId: true,
        academicYear: { select: { name: true } },
      },
    }),
    prisma.academicYear.findMany({
      select: { id: true, name: true },
    }),
  ]);

  return { students, emails, classes, academicYears };
};

const createPreviewRows = (rows, masterData) =>
  previewStudentImportRows({ rows, ...masterData });

const sanitizeConfirmationRows = (rows) =>
  rows
    .filter((row) => row && typeof row === 'object')
    .map((row, index) => {
      const nis = normalizeStudentNis(row.nis);
      return {
        rowNumber: Number.isInteger(row.rowNumber) ? row.rowNumber : index + 2,
        nis,
        nisIssue:
          row.nisIssue ||
          (nis === null
            ? 'NIS harus berupa angka bulat positif maksimal 15 digit.'
            : undefined),
        name: row.name,
        className: row.className,
        major: row.major,
        academicYear: row.academicYear,
        email: row.email,
      };
    })
    .filter((row) =>
      [
        row.nis,
        row.name,
        row.className,
        row.major,
        row.academicYear,
        row.email,
      ].some((value) => String(value ?? '').trim() !== '')
    );

export const downloadStudentImportTemplate = async (req, res, next) => {
  try {
    const worksheet = XLSX.utils.aoa_to_sheet([
      templateHeaders,
      [123456, STUDENT_IMPORT_TEMPLATE_SAMPLE_NAME],
    ]);
    worksheet.A2.z = '0';
    worksheet['!cols'] = [
      { wch: 16 },
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
        const nisColumn = headerValidation.headerMap.get('NIS');
        const nisCell = worksheet[
          XLSX.utils.encode_cell({ r: index + 1, c: nisColumn })
        ];
        const { nis, issue: nisIssue } = readStudentImportNisCell(nisCell);

        const row = {
          rowNumber: index + 2,
          nis,
          nisIssue,
          name: getCell('Nama Siswa'),
          className: getCell('Kelas'),
          major: getCell('Jurusan'),
          academicYear: getCell('Tahun Ajaran'),
          email: headerValidation.headerMap.has('Email')
            ? getCell('Email')
            : '',
        };
        if (
          String(row.name).trim().toLocaleUpperCase('id') ===
          STUDENT_IMPORT_TEMPLATE_SAMPLE_NAME
        ) {
          return null;
        }
        return row;
      })
      .filter(Boolean)
      .filter((row) =>
        [
          row.nis,
          row.nisIssue,
          row.name,
          row.className,
          row.major,
          row.academicYear,
          row.email,
        ]
          .some((value) => String(value ?? '').trim() !== '')
      );

    if (importRows.length === 0) {
      return res.status(400).json({ error: 'File tidak memiliki baris data siswa.' });
    }

    const masterData = await getStudentImportMasterData();
    const preview = createPreviewRows(importRows, masterData);

    res.json({
      ...preview,
      saveEnabled: preview.newAccountCandidates > 0,
      message:
        preview.newAccountCandidates > 0
          ? 'Periksa data, lalu konfirmasi untuk membuat akun baru. Siswa existing tidak akan diubah.'
          : 'Tidak ada akun baru yang siap dibuat.',
    });
  } catch (error) {
    next(error);
  }
};

export const confirmStudentImport = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body?.rows) || req.body.rows.length === 0) {
      return res.status(400).json({
        error: 'Data preview siswa wajib dikirim untuk dikonfirmasi.',
      });
    }

    const rows = sanitizeConfirmationRows(req.body.rows);
    if (rows.length === 0) {
      return res.status(400).json({
        error: 'Tidak ada baris data siswa yang dapat diproses.',
      });
    }

    const masterData = await getStudentImportMasterData();
    const preview = createPreviewRows(rows, masterData);
    const result = await createStudentImportAccounts({
      rows: preview.rows,
      prisma,
      hashPassword: (password) => bcrypt.hash(password, 10),
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};