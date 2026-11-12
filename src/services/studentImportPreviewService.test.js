import test from 'node:test';
import XLSX from 'xlsx';
import assert from 'node:assert/strict';

import {
  previewStudentImportRows,
  readStudentImportNisCell,
  validateStudentImportHeaders,
} from './studentImportPreviewService.js';

const headers = ['NIS', 'Nama Siswa', 'Kelas', 'Jurusan', 'Tahun Ajaran', 'Email'];

const masterData = {
  students: [
    {
      id: 10,
      nis: '0010',
      name: 'Alya Siswa',
      email: '0010@siswa.test',
      classId: 5,
      academicYearId: 2,
    },
  ],
  emails: [{ id: 10, nis: '0010', role: 'student', email: '0010@siswa.test' }],
  classes: [
    {
      id: 5,
      name: 'XII RPL 1',
      major: 'RPL',
      academicYearId: 2,
      academicYear: { name: '2026/2027' },
    },
  ],
  academicYears: [{ id: 2, name: '2026/2027' }],
};

const row = (overrides = {}) => ({
  rowNumber: 2,
  nis: '0010',
  name: 'Alya Siswa',
  className: 'XII RPL 1',
  major: 'RPL',
  academicYear: '2026/2027',
  email: '',
  ...overrides,
});

test('rejects a workbook with missing required columns', () => {
  const result = validateStudentImportHeaders(['NIS', 'Nama Siswa']);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /Kelas, Jurusan, Tahun Ajaran/);
});

test('matches an existing NIS without mutating existing account data', () => {
  const students = structuredClone(masterData.students);
  const result = previewStudentImportRows({ rows: [row()], ...masterData });

  assert.equal(result.rows[0].status, 'existing');
  assert.equal(result.existingRows, 1);
  assert.deepEqual(masterData.students, students);
});

test('marks an unknown NIS as a new account candidate with the project email format', () => {
  const result = previewStudentImportRows({
    rows: [row({ rowNumber: 3, nis: '0099', name: 'Budi Baru' })],
    ...masterData,
  });

  assert.equal(result.rows[0].status, 'new-candidate');
  assert.equal(result.newAccountCandidates, 1);
  assert.equal(result.rows[0].email, '99@gopkl.id');
  assert.equal(result.rows[0].classId, 5);
  assert.equal(result.rows[0].academicYearId, 2);
});

test('marks every repeated NIS row as a duplicate', () => {
  const result = previewStudentImportRows({
    rows: [row({ rowNumber: 2 }), row({ rowNumber: 3 })],
    ...masterData,
  });

  assert.equal(result.duplicateRows, 2);
  assert.ok(result.rows.every((item) => item.status === 'duplicate'));
});

test('rejects a row with an empty NIS', () => {
  const result = previewStudentImportRows({
    rows: [row({ nis: '', name: 'Siswa Tanpa NIS' })],
    ...masterData,
  });

  assert.equal(result.invalidRows, 1);
  assert.equal(result.newAccountCandidates, 0);
  assert.match(result.rows[0].reason, /NIS wajib diisi/);
});

test('rejects duplicate emails and emails owned by another account', () => {
  const duplicateFile = previewStudentImportRows({
    rows: [
      row({ nis: '0041', name: 'Orang Satu', email: 'same@example.test' }),
      row({ rowNumber: 3, nis: '0042', name: 'Orang Dua', email: 'same@example.test' }),
    ],
    ...masterData,
  });
  assert.equal(duplicateFile.duplicateRows, 2);

  const conflict = previewStudentImportRows({
    rows: [row({ nis: '0099', name: 'Calon Baru', email: '0010@siswa.test' })],
    ...masterData,
  });
  assert.equal(conflict.rows[0].status, 'invalid');
  assert.match(conflict.rows[0].reason, /Email sudah digunakan/);
});

test('rejects unknown class, major, and academic year combinations', () => {
  const result = previewStudentImportRows({
    rows: [row({ nis: '0099', name: 'Calon Baru', className: 'Kelas Asing' })],
    ...masterData,
  });

  assert.equal(result.rows[0].status, 'invalid');
  assert.match(result.rows[0].reason, /Kombinasi Kelas/);
});

test('matches existing students by NIS even when other import fields differ', () => {
  const result = previewStudentImportRows({
    rows: [
      row({
        name: 'Nama Berbeda',
        className: 'Kelas Tidak Sama',
        academicYear: 'Tahun Berbeda',
        email: 'new-email@example.test',
      }),
    ],
    ...masterData,
  });

  assert.equal(result.rows[0].status, 'existing');
  assert.equal(result.newAccountCandidates, 0);
  assert.match(result.rows[0].reason, /data siswa existing tidak akan diubah/);
});

test('rejects an NIS assigned to a non-student account', () => {
  const result = previewStudentImportRows({
    rows: [row({ nis: '0020', name: 'Calon Baru' })],
    ...masterData,
    emails: [
      ...masterData.emails,
      { id: 20, nis: '0020', role: 'teacher', email: 'guru@example.test' },
    ],
  });

  assert.equal(result.rows[0].status, 'invalid');
  assert.match(result.rows[0].reason, /akun non-siswa/);
});

test('rejects unsupported headers', () => {
  const result = validateStudentImportHeaders([
    ...headers,
    'Password',
  ]);

  assert.equal(result.valid, false);
  assert.match(result.errors[0], /Kolom tidak dikenal: password/);
});

test('normalizes numeric NIS values consistently for lookup and matching', () => {
  const result = previewStudentImportRows({
    rows: [row({ nis: 10 })],
    ...masterData,
  });

  assert.equal(result.rows[0].nis, 10);
  assert.equal(result.rows[0].status, 'existing');
});

test('accepts integer numeric Excel NIS and canonicalizes its stored representation', () => {
  assert.deepEqual(readStudentImportNisCell({ t: 'n', v: 1234, z: '0' }), {
    nis: 1234,
    issue: undefined,
  });
});

test('reads the numeric NIS cell from an XLSX workbook', () => {
  const worksheet = XLSX.utils.aoa_to_sheet([['NIS'], [123456]]);
  worksheet.A2.z = '0';
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa');
  const loaded = XLSX.read(
    XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    { type: 'buffer', cellStyles: true }
  );
  const nisCell = loaded.Sheets.Siswa.A2;

  assert.equal(nisCell.t, 'n');
  assert.equal(nisCell.z, '0');
  assert.equal(readStudentImportNisCell(nisCell).nis, 123456);
});

test('rejects text, decimal, negative, and unsafe NIS values', () => {
  for (const cell of [
    { t: 's', v: '1234' },
    { t: 'n', v: 12.5 },
    { t: 'n', v: -1 },
    { t: 'n', v: 0 },
    { t: 'n', v: Number.MAX_SAFE_INTEGER + 1 },
    { t: 'n', v: 1_000_000_000_000_000 },
  ]) {
    const parsed = readStudentImportNisCell(cell);
    assert.equal(parsed.nis, null);
    assert.match(parsed.issue, /angka bulat positif maksimal 15 digit/);
  }
});

test('canonicalizes leading-zero strings so they cannot create a duplicate numeric NIS', () => {
  const parsed = readStudentImportNisCell({
    t: 'n',
    v: 10,
  });
  const existing = previewStudentImportRows({
    rows: [row({ nis: parsed.nis })],
    ...masterData,
    students: [{ ...masterData.students[0], nis: '00010' }],
  });
  assert.equal(existing.rows[0].status, 'existing');
  assert.equal(existing.rows[0].nis, 10);
});

test('rejects missing and nonnumeric NIS values with clear validation errors', () => {
  const result = previewStudentImportRows({
    rows: [row({ nis: '' }), row({ rowNumber: 3, nis: 'abc' })],
    ...masterData,
  });

  assert.equal(result.invalidRows, 2);
  assert.match(result.rows[0].reason, /NIS wajib diisi/);
  assert.match(result.rows[1].reason, /NIS wajib diisi/);
});